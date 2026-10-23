# STATES.md — BanaSetu Finite State Machines & Lifecycle Specifications

> **System:** BanaSetu Minor Forest Produce (MFP) Ledger  
> **Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL / LABHA Scheme)  
> **Type:** Normative Lifecycle & Invariant State Specifications

---

## 1. Batch & Physical Produce Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Collector creates request
    DRAFT --> PENDING_VERIFICATION : Collector submits request
    PENDING_VERIFICATION --> VERIFIED_INTAKE : Scale weighment verified by Collection Center
    VERIFIED_INTAKE --> DISPATCHED_IN_TRANSIT : Manifest created for transit to central depot
    DISPATCHED_IN_TRANSIT --> RECEIVED_WAREHOUSE : Truck arrives at Baripada depot
    
    state InwardVerification <<choice>>
    RECEIVED_WAREHOUSE --> InwardVerification : Reweighing & shrinkage calculation
    
    InwardVerification --> AVAILABLE_STOCK : Loss <= Shrinkage Tolerance (e.g. <= 1.5%)
    InwardVerification --> QUARANTINED_DISCREPANCY : Loss > Shrinkage Tolerance (e.g. > 1.5%)
    
    QUARANTINED_DISCREPANCY --> AVAILABLE_STOCK : Supervisor approves resolution
    QUARANTINED_DISCREPANCY --> REJECTED_WRITEOFF : Supervisor write-off
    
    AVAILABLE_STOCK --> SOLD_ALLOCATED : Outward allocation to cooperative/buyer
    SOLD_ALLOCATED --> [*]
```

### State Definitions & Permissions

| State | Responsible Actor | Permitted Transitions | Guardrails & Invariants |
|:---|:---|:---|:---|
| `DRAFT` | `COLLECTOR` | $\rightarrow$ `PENDING_VERIFICATION` | Local auto-save in IndexedDB. Editable until submission. |
| `PENDING_VERIFICATION` | `COLLECTOR` / `SHG_FACILITATOR` | $\rightarrow$ `VERIFIED_INTAKE`, $\rightarrow$ `CANCELLED` | Awaiting physical weighment at aggregation center. Can be cancelled within 6s undo window. |
| `VERIFIED_INTAKE` | `COLLECTION_MANAGER` | $\rightarrow$ `DISPATCHED_IN_TRANSIT` | Net weight certified on scale. Tare subtracted. Field payment reference generated. |
| `DISPATCHED_IN_TRANSIT` | `COLLECTION_MANAGER` | $\rightarrow$ `RECEIVED_WAREHOUSE` | In transit between forest center (e.g. Karanjia) and central depot (Baripada). |
| `RECEIVED_WAREHOUSE` | `WAREHOUSE_MANAGER` | $\rightarrow$ `AVAILABLE_STOCK`, $\rightarrow$ `QUARANTINED_DISCREPANCY` | Depot reweighed gross/tare. Natural shrinkage mathematically evaluated. |
| `QUARANTINED_DISCREPANCY` | `SUPERVISOR_ADMIN` | $\rightarrow$ `AVAILABLE_STOCK`, $\rightarrow$ `REJECTED_WRITEOFF` | Isolated from inventory. Original field gatherer payout reference is **unaltered**. |
| `AVAILABLE_STOCK` | `WAREHOUSE_MANAGER` | $\rightarrow$ `SOLD_ALLOCATED` | Available for outward sale. Stock cannot become negative. |
| `SOLD_ALLOCATED` | `WAREHOUSE_MANAGER` | Terminal state | Allocation quantity cannot exceed available stock. |

---

## 2. Offline Outbox Synchronization State Machine

```mermaid
stateDiagram-v2
    [*] --> LOCAL_SAVED : Record written to IndexedDB
    LOCAL_SAVED --> IN_FLIGHT_SYNC : Online trigger / manual sync
    
    state SyncEvaluation <<choice>>
    IN_FLIGHT_SYNC --> SyncEvaluation : Server response
    
    SyncEvaluation --> SYNCED_TO_SERVER : HTTP 200 / 201 OK
    SyncEvaluation --> RETRY_QUEUED : HTTP 503 or Network Error
    SyncEvaluation --> CONFLICT_FLAGGED : HTTP 409 Conflict
    
    RETRY_QUEUED --> IN_FLIGHT_SYNC : Backoff timer expires (2^n * 1s)
    CONFLICT_FLAGGED --> MANUAL_REVIEW : Queued for administrator
    SYNCED_TO_SERVER --> [*]
```

### Sync State Invariants
1. **Never Discard Unsynced Work:** Under no condition does a network error, app crash, or HTTP 503 response delete a local Dexie record.
2. **Exponential Backoff:** Retries increment an attempt counter $n$. Retry delay is computed as:
   $$\text{Delay} = \min(2^n \times 1000\text{ms}, 30000\text{ms})$$
3. **Idempotency Guarantee:** Every synchronized payload includes an `idempotencyKey`. The server uses a unique database constraint to ensure identical submissions are committed exactly once.

---

## 3. Discrepancy & Shrinkage Segregation Logic

Given:
- $W_{\text{field}}$ = Certified field net weight recorded at forest collection center.
- $W_{\text{wh}}$ = Arrival net weight measured at central warehouse depot.
- $T_{\text{pct}}$ = Allowable natural shrinkage tolerance percentage (e.g. $1.5\%$).

The shrinkage percentage $S_{\text{pct}}$ is calculated:
$$S_{\text{pct}} = \max\left(0, \frac{W_{\text{field}} - W_{\text{wh}}}{W_{\text{field}}} \times 100\right)$$

### Branching Matrix:
1. **Case A ($S_{\text{pct}} \le T_{\text{pct}}$):**
   - Result: Transit loss is approved as natural botanical moisture loss.
   - Status $\rightarrow$ `AVAILABLE_STOCK`.
   - Verified Stock Weight $\leftarrow W_{\text{wh}}$.
2. **Case B ($S_{\text{pct}} > T_{\text{pct}}$):**
   - Result: Transit loss exceeds allowable tolerance.
   - Status $\rightarrow$ `QUARANTINED_DISCREPANCY`.
   - Supervisor case created with severity = `HIGH`.
   - Stock is quarantined and blocked from outward allocation.
   - **Protection Rule:** Gatherer's payable amount based on $W_{\text{field}}$ remains **100% intact**.
