---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# ✅ Final Step: Backfill Workflow Fields

## Current Status

✅ Marcus Ellington order - **REASSIGNED** successfully!
✅ All 20 orders - **Assigned to 8 clients** (6 companies, 2 individuals)
✅ Client types - **All classified correctly**

**Remaining**: Populate the 14 workflow fields with data from CSV

---

## 🎯 One Last File to Run

**File**: `BACKFILL-WORKFLOW-FIELDS.sql`

**What it does:**
- Updates all 20 orders with workflow field data
- Populates: scope_of_work, intended_use, report_form_type, billing_method, sales_campaign, service_region, site_influence, etc.
- Matches each order by external_id (Task ID)
- Shows verification at the end

**Generated**: 20 UPDATE statements, one per order

---

## How to Run

1. Open **Supabase SQL Editor**
2. Copy/paste the **entire** `BACKFILL-WORKFLOW-FIELDS.sql` file
3. Click **Run**
4. Wait for completion (~5 seconds for 20 updates)

---

## Expected Results

After running, the verification query at the end will show:

| total_orders | has_scope | has_intended_use | has_report_form | has_billing | has_campaign | has_region |
|--------------|-----------|------------------|-----------------|-------------|--------------|------------|
| 20 | 20 | ~18 | 20 | 20 | 20 | 20 |

(Not all orders have intended_use, but most workflow fields should be 20/20)

---

## Sample Update (What's Being Applied)

```sql
-- Example for one order:
UPDATE orders SET
  scope_of_work = 'interior',
  intended_use = 'Purchase',
  report_form_type = '1004',
  additional_forms = ARRAY['1007']::text[],
  billing_method = 'bill',
  sales_campaign = 'client_selection',
  service_region = 'ORL - SE - EXTENDED',
  site_influence = 'none'
WHERE external_id = '1211674388034570';
```

This is applied to all 20 orders with their specific data from the CSV!

---

## After Backfill, Verify One Order

Check an order to confirm fields are populated:

```sql
SELECT 
  order_number,
  property_address,
  scope_of_work,
  intended_use,
  report_form_type,
  additional_forms,
  billing_method,
  sales_campaign,
  service_region,
  site_influence,
  is_multiunit,
  zoning_type,
  fee_amount
FROM orders
WHERE order_number = 'ORD-1761341947139'
LIMIT 1;
```

You should see all the workflow fields filled in!

---

## Then You're 100% Complete!

After this backfill:

✅ **20 orders** - Fully populated with all data
✅ **14 workflow fields** - All with correct values
✅ **8 clients** - Properly assigned and classified
✅ **Auto-import system** - Ready for future imports
✅ **Production-ready** - Everything working!

---

## What This Enables

With workflow fields populated, you can now:

✅ Filter orders by `scope_of_work`, `service_region`, `report_form_type`
✅ Build pricing calculator using `scope`, `site_influence`, `additional_forms`
✅ Route assignments by `service_region` and `scope_of_work`
✅ Track marketing ROI by `sales_campaign`
✅ Validate compliance (`intended_use` vs `report_form_type`)
✅ Analyze performance by region and order type

---

**🚀 Run BACKFILL-WORKFLOW-FIELDS.sql now and you're done!**

This is the last step. After this, all 20 orders will have complete data and your system is production-ready! 🎉

