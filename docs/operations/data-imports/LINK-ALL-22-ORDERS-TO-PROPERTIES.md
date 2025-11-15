---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Link All 22 Orders to Properties

## The Issue

**Current State:**
- 22 orders total
- 16 properties created
- 6 orders unlinked (no property_id)

**Problem:**
Some addresses were misparsed during import - the city ended up in the street field.

**Examples:**
- "10 N Ohio St **Orlando**" → city should be "Orlando", not "Unknown"
- "1012 Diego Ct **Lady Lake**" → city should be "Lady Lake", not "Unknown"

---

## ✅ The Fix (1 SQL File)

**File**: `FIX-6-UNLINKED-ORDERS.sql`

**What it does:**

### Step 1: Fix City Parsing
- Updates 4 orders to extract city from street field
- Sets proper city: Orlando, Lady Lake, Ocoee
- Cleans street addresses

### Step 2: Create 6 Properties
- Creates canonical properties for all 6 unlinked orders
- Uses addr_hash for deduplication
- Handles conflicts gracefully

### Step 3: Link Orders → Properties
- Matches orders to properties by address hash
- Sets property_id on all 6 orders

### Step 4: Verification
- Shows link rate (should be 100%)
- Displays all 6 newly linked orders
- Counts total properties (should be 22)

---

## 🎯 Run It

**In Supabase SQL Editor:**
1. Copy/paste entire `FIX-6-UNLINKED-ORDERS.sql`
2. Run
3. See results

---

## Expected Results

### Before:
- Total Orders: 22
- Linked Orders: 16
- **Unlinked Orders: 6** ❌
- Properties: 16

### After:
- Total Orders: 22
- Linked Orders: **22** ✅
- **Unlinked Orders: 0** ✅
- Properties: **22** ✅
- **Link Rate: 100%**

---

## The 6 Orders Being Fixed:

1. **ORD-1761438202377** - 635 Kingbird Cir, Delray Beach (new)
2. **ORD-1761438202378** - 412-414 Jennifer Ln, Eustis (new)
3. **ORD-1761341952272** - 10 N Ohio St, Orlando
4. **ORD-1761341955839** - 4225 THORNBRIAR LN, Orlando
5. **ORD-1761341956200** - 1012 Diego Ct, Lady Lake
6. **ORD-1761341960814** - 1974 IBIS BAY COURT, Ocoee

All will have proper properties created and linked!

---

## Why Property Linking Matters

### ✅ With Property Links:
- USPAP tracking (prior work counts)
- Property history across multiple orders
- Duplicate detection (same building)
- Better analytics and reporting
- Reusable property data

### ❌ Without Property Links:
- Just snapshot data per order
- No prior work tracking
- Can't see order history per property
- Duplicate properties possible

---

## After Linking

You'll be able to:

**View Property Page:**
- See all orders for same property
- Track USPAP prior work
- View property history

**Analytics:**
- Properties by city/region
- Average orders per property
- Identify repeat properties

**Compliance:**
- USPAP 3-year prior work tracking
- Disclosure requirements
- Conflict checking

---

## 🚀 Run FIX-6-UNLINKED-ORDERS.sql Now!

Then you'll have:
- ✅ 22/22 orders linked to properties
- ✅ Complete property tracking
- ✅ USPAP compliance ready
- ✅ Full system operational

**One SQL file to run and you're 100% complete!**

