# SAMAGNA Commercial Business Model Integration

## 1. Executive Summary

This extension introduces two sustainable commercial revenue streams into the existing **SAMAGNA** digital forest governance ecosystem while strictly safeguarding the primary government-supported tribal procurement model:

1. **Government Digital Infrastructure Royalty & Licensing**: Proposed institutional service revenue charged to the state/forest department for operating and maintaining the digital procurement platform.
2. **Integrated B2B & B2C Forest Produce Marketplace**: Direct commercial channel connecting verified warehouse stock to wholesale industries and individual retail consumers, earning transparent transaction commissions.

---

## 2. Invariant: 100% Protection of Forest Collector MSP

> **CRITICAL LEGAL & ETHICAL INVARIANT**
>
> Neither government service royalties, technology maintenance fees, nor buyer marketplace commissions may **ever** be deducted from the primary forest collectors' statutory Minimum Support Price (MSP) payments.
>
> Primary gatherers receive 100% of their DBT bank transfers and cash receipts as determined by the official TRIFED/State Forest Department pricing matrix. Platform earnings are strictly additive institutional fees and commercial buyer-side margins.

---

## 3. Revenue Stream Architecture

```
                                  ┌─────────────────────────────┐
                                  │   SAMAGNA PLATFORM REVENUE  │
                                  └──────────────┬──────────────┘
                                                 │
            ┌────────────────────────────────────┼────────────────────────────────────┐
            ▼                                    ▼                                    ▼
┌─────────────────────────┐          ┌─────────────────────────┐          ┌─────────────────────────┐
│ Stream 1: Govt Services │          │ Stream 2: B2B Wholesale │          │ Stream 3: B2C Retail    │
├─────────────────────────┤          ├─────────────────────────┤          ├─────────────────────────┤
│ • 2.50% Service Royalty │          │ • 3.50% Buyer Commission│          │ • 6.00% Retail Comm.    │
│ • ₹5,00,000 Annual Lic. │          │ • Pharmaceutical buyers │          │ • Direct consumers      │
│ • ₹1,50,000 Annual Maint│          │ • Food & Ayurvedic mfg  │          │ • Packaged forest items │
└─────────────────────────┘          └─────────────────────────┘          └─────────────────────────┘
```

### Stream 1: Government Service & Royalty Management
- **Total Procurement Baseline**: ₹2,55,582.60 (active Mayurbhanj district procurement).
- **Service Royalty Percentage**: Configurable (default `2.50%` = ₹6,389.57).
- **Annual Platform Licensing Fee**: Fixed contractual (default `₹5,00,000.00`).
- **Technology Maintenance Charges**: Fixed contractual (default `₹1,50,000.00`).
- **Total Institutional Revenue**: **₹6,56,389.57**.
- **Admin Management Path**: `/admin` → **Government Royalty** tab (`src/components/admin/GovernmentRoyaltySection.tsx`).

### Stream 2: B2B Bulk Marketplace Commissions
- **Target Customers**: Pharmaceutical labs, Ayurvedic manufacturers, herbal extractors, food processing enterprises, wholesale traders.
- **Commission Rate**: Configurable (default `3.50%` on GMV).
- **Features**: Minimum Order Quantities (MOQ), wholesale tier pricing, GSTIN/PAN validation, formal Request for Quotation (RFQ) desk, printable commercial tax invoices.
- **Admin Management Path**: `/admin` → **Buyer Commissions** tab (`src/components/admin/MarketplaceCommissionSection.tsx`).

### Stream 3: B2C Consumer Retail Commissions
- **Target Customers**: General citizens and health-conscious retail buyers.
- **Commission Rate**: Configurable (default `6.00%` on retail purchases).
- **Features**: Consumer pack sizes (250g, 500g, 1kg), search and category filters, shopping cart, demo checkout, batch provenance, and digital customer invoices.

---

## 4. Integration with Existing Warehouse Inventory

The marketplace does **not** maintain a separate or detached inventory system. It is physically and logically connected to the state warehouse inventory:

- **Source Facility**: Baripada Central Depôt (`BRP-01`).
- **Verified Species**:
  1. *Dried Mahua Flowers* (Lot `BS-400`, Grade A, 9.4% Moisture).
  2. *Wild Forest Honey* (Lot `BS-W-410`, Grade A raw unfiltered).
  3. *Tamarind deseeded* (Lot `BS-W-411`, Grade A).
  4. *Char Seeds / Chironji* (Lot `BS-W-412`, Grade A kernels).
  5. *Sal Seeds* (Lot `BS-W-413`, Grade A industrial oil extraction).
  6. *Wild Harida* (Lot `BS-W-414`, Grade A Ayurvedic specification).
  7. *Sun-Dried Amla* (Lot `BS-W-415`, Grade A high-tannin).
- **Inventory Reservation Workflow**:
  ```
  Buyer Order Placed
    └──> Check available physical balance in Baripada Depôt
    └──> Deduct purchased quantity from available stock
    └──> Log reservation to Dexie store `inventorySales`
    └──> Append audit trail to `auditEvents`
    └──> Generate printable commercial invoice with batch QR link
  ```

---

## 5. Portal Map & Routes

| Route | Role / Audience | Description |
|---|---|---|
| `/marketplace` | General Buyers | Unified commercial entry point with B2B/B2C filter toggles. |
| `/marketplace/b2b` | Bulk Enterprises | Wholesale catalogue with MOQ matrix and RFQ triggers. |
| `/marketplace/b2c` | Consumers | Direct-to-consumer store with packaged weights and cart. |
| `/marketplace/product/[slug]` | All Buyers | Detailed lot provenance, certified moisture data, and dual checkout modes. |
| `/marketplace/rfq` | Enterprises | Enterprise quotation portal with depôt quote acceptance. |
| `/marketplace/cart` | All Buyers | Shopping cart with transparent commission fee breakdowns. |
| `/marketplace/checkout` | All Buyers | Demo commercial payment gateway with GST/PAN verification. |
| `/marketplace/orders` | All Buyers | Order history and fulfillment roster. |
| `/marketplace/orders/[id]` | All Buyers | Official printable commercial tax invoice with QR batch verification link. |
| `/marketplace/register` | All Buyers | Corporate GSTIN and retail customer verification onboarding. |
| `/admin` | Administrators | Features **Business Revenue**, **Government Royalty**, and **Buyer Commissions** tabs. |

---

## 6. Verification and Test Suite

To verify the commercial model and platform integrity at any time:

```bash
# 1. Commercial business model unit and integration tests (36 checks)
npm run test:commercial

# 2. Comprehensive regression test suite across all 25 modules
npm run test:all

# 3. Production static and dynamic compilation build test
npm run build
```
