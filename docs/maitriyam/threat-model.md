# Maitriyam v0: Threat Model & Risk Register

**Author**: Assistant / Antigravity Engineering  
**Scope**: Samagna In-App Assistant (Maitriyam v0)  
**Deliverable**: Phase 3 Security Architecture  
**Status**: APPROVED

---

## 1. Threat Matrix & Controls

| Threat ID | Threat Description | Attack Vector | Security Control | Verified Test |
|---|---|---|---|---|
| **TM-01** | **Cross-User Conversation Exposure** | Attacker queries API with forged `conversationId` | Server generates and cryptographically binds conversation sessions to `(userId, organisationId, surface)`. Accessing another user's session returns HTTP 403. | `scripts/test-maitriyam-security.ts` (Group 1) |
| **TM-02** | **Cross-Role Privilege Escalation** | Collector queries administrative audit logs or manager quarantine cases | RBAC policy strictly enforced server-side. Tools validate actor role before reading sensitive collections. | `scripts/test-maitriyam-security.ts` (Group 2) |
| **TM-03** | **Batch Code Enumeration / Scraping** | Script iterates through sequential batch IDs (`BS-400` to `BS-999`) | Sliding-window token bucket rate limiting (20 req/min for public, 30 req/min for auth). Unknown codes return consistent timing and neutral error payload. | `scripts/test-maitriyam-security.ts` (Group 3) |
| **TM-04** | **Prompt Injection via Tool / Corpus Text** | Adversarial text embedded in crop names or pickup notes attempts to hijack instructions | System operates in deterministic L0/L1/L3 mode with `DisabledProvider`. Output checks verify citation integrity and reject execution of instructions from retrieved strings. | `scripts/test-maitriyam-security.ts` (Group 4) |
| **TM-05** | **Cost & Compute Exhaustion** | Flooding chat API with large payloads | Hard payload limits (Zod max 500 chars), rate limits, and short timeout budgets (`AbortController` 3s). No third-party model token costs incurred in v0. | `scripts/test-maitriyam-security.ts` (Group 5) |
| **TM-06** | **Collector PII Leakage** | Collector Aadhaar, phone, or bank numbers typed into query or stored in history | Multi-stage regex normalisation and masking (`maskAllPii`) transforms numbers to redacted form (`•••• •••• 1234`) before persistence or response. | `scripts/test-maitriyam-matcher.ts` (Group 4) |
| **TM-07** | **Emergency Kill-Switch Failure** | Compromised assistant needs immediate deprecation | `MAITRIYAM_ENABLED=false` checked dynamically at request time in API handlers; launcher queries `/api/assistant/config` and hides instantly. | `scripts/test-maitriyam-security.ts` (Group 6) |
| **TM-08** | **Stale Cached Rate Advice** | Device offline during seasonal MSP rate change | Rate rule: Assistant never returns offline rate values; explicitly points to latest printed physical receipt or online sync ledger. | `scripts/test-maitriyam-matcher.ts` (Case 12) |
| **TM-09** | **Harm from Mistranslated Odia Guidance** | Machine-translated legal text causes field dispute | Every Odia entry marked `reviewed: false` until human sign-off; UI renders a prominent warning badge; legal/refusal text ships in standard English. | `i18n/review-status.json` |
| **TM-10** | **Voice Eavesdropping / Audio Data Leak** | Browser Web Speech streaming audio to third-party cloud | `MAITRIYAM_VOICE_ENABLED=false` by default; voice input requires explicit owner opt-in and permission prompt on tap; Samagna never stores raw audio. | `src/app/api/assistant/config/route.ts` |

---

## 2. Programmatic Output Check Invariants

1. **Citation Integrity**: Every factual claim cites an approved sourceRef (`/about`, `/verify`, or official schedule).
2. **Numeric Grounding**: Any numerical figure in an answer must directly originate from an authorized tool result or knowledge entry.
3. **No Official Persona Spoofing**: The assistant explicitly self-identifies as an automated guidance assistant and never claims to be an officer or government authority.
4. **Static No-Write Guarantee**: Zero SQL `INSERT`, `UPDATE`, `DELETE`, or Prisma write calls exist inside `src/lib/assistant/tools.ts`.
