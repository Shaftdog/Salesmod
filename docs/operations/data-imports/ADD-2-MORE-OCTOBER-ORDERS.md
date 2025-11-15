---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Add 2 More October Orders

## Quick Import

You have 2 additional October orders to add:

1. **635 Kingbird Cir, Delray Beach, FL** - iFund Cities - $550
2. **412-414 Jennifer Ln, Eustis, FL** - MoFin Lending (new client) - $300

---

## 🎯 Simple 1-Step Process

**File**: `INSERT-2-NEW-ORDERS.sql`

**In Supabase SQL Editor:**
1. Copy/paste the entire file
2. Run it
3. Done!

**What it does:**
- ✅ Checks if MoFin Lending exists
- ✅ Creates MoFin Lending client if needed (company type, with "Lending" keyword)
- ✅ Verifies iFund Cities exists (already exists as "i Fund Cities LLC")
- ✅ Inserts 2 orders with ALL workflow fields:
  - Scope of Work: Interior
  - Report Forms: 1004, 1025
  - Additional Forms: 1007, 216
  - Billing: Bill
  - Campaign: Client Selection
  - Regions: ORL-NE-PRIMARY, ORL-NW-PRIMARY
  - All other workflow fields
- ✅ Shows verification with complete data

---

## Expected Results

After running:

**New Client Created:**
- MoFin Lending (company) - 1 order - $300

**Total Orders Now:**
- Previous: 20 orders
- **New: 22 orders** (20 + 2)

**Client Distribution:**
| Client | Type | Orders | Revenue |
|--------|------|--------|---------|
| i Fund Cities LLC | Company | **7** ↑ | $3,750 |
| Applied Valuation Services | Company | 5 | $1,500 |
| Allstate Appraisal | Company | 3 | ~$1,300 |
| Consolidated Analytics | Company | 2 | $875 |
| Marcus Ellington | Individual | 1 | $450 |
| Yunior Castroy | Individual | 1 | $450 |
| **MoFin Lending** | **Company** | **1** ↑ | **$300** |
| PROPERTYRATE LLC | Company | 1 | $500 |
| ThinkLattice LLC | Company | 1 | $345 |

**New Total: 9 clients, 22 orders, ~$9,350 revenue!**

---

## Workflow Fields Populated

Both new orders will have complete workflow data:

**Order 1 (Delray Beach):**
- Scope: Interior
- Intended Use: Other (see description)
- Form: FHA 1004
- Additional: 1007 (Rent Survey)
- Billing: Bill
- Region: ORL-NE-PRIMARY
- Campaign: Client Selection

**Order 2 (Eustis):**
- Scope: Interior
- Intended Use: Other (see description)
- Form: 1025 (Multifamily)
- Additional: 216 (Operating Statement)
- Billing: Bill
- Region: ORL-NW-PRIMARY
- Campaign: Client Selection

---

## After Import

1. **Refresh browser** to see the new orders
2. **Go to Orders page** - should show 22 orders
3. **View either new order** - see complete workflow details
4. **Click Edit** - all fields editable

---

## 🚀 Ready to Run!

Just run `INSERT-2-NEW-ORDERS.sql` in Supabase SQL Editor and you'll have 22 complete October orders!

Total time: 1 minute ⏱️

