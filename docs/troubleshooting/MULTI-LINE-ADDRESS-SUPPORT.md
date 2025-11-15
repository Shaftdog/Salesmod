# Multi-Line Address Support - Implementation Complete ✅

## Overview

The migration system now supports **TWO address patterns**:

1. **Multi-Line Addresses** (Address, Address 2, Address 3)
2. **Component Addresses** (Street, City, State, Zip)

Both patterns automatically combine into a single database `address` field.

## Your Scenario: Multi-Line Addresses

If your CSV has columns like:
- `Address` → "1200 Main St"
- `Address 2` → "Suite 400"
- `Address 3` → "Irvine, CA 92614"

The system will **automatically combine** them into:
```
address: "1200 Main St, Suite 400, Irvine, CA 92614"
```

## How It Works

### Pattern 1: Multi-Line Address

**CSV Columns:**
```csv
company_name,email,phone,Address,Address 2,Address 3
"AMC Contact","info@amc.com","(949) 555-1010","1200 Main St","Suite 400","Irvine, CA 92614"
```

**Field Mapping:**
- `Address` → `address.line1` (composite)
- `Address 2` → `address.line2` (composite)
- `Address 3` → `address.line3` (composite)

**Result in Database:**
```javascript
{
  company_name: "AMC Contact",
  email: "info@amc.com",
  phone: "(949) 555-1010",
  address: "1200 Main St, Suite 400, Irvine, CA 92614"  // ← Combined!
}
```

### Pattern 2: Component Address

**CSV Columns:**
```csv
company_name,email,phone,Street,City,State,Zip
"AMC Contact","info@amc.com","(949) 555-1010","1200 Main St Ste 400","Irvine","CA","92614"
```

**Field Mapping:**
- `Street` → `address.street` (composite)
- `City` → `address.city` (composite)
- `State` → `address.state` (composite)
- `Zip` → `address.zip` (composite)

**Result in Database:**
```javascript
{
  company_name: "AMC Contact",
  email: "info@amc.com",
  phone: "(949) 555-1010",
  address: "1200 Main St Ste 400, Irvine CA 92614"  // ← Combined!
}
```

## Auto-Detection

The system will automatically detect your address pattern:

### Multi-Line Pattern Detection
If your CSV has:
- ✓ `company_name` (or `Company Name`)
- ✓ `phone`
- ✓ `email`
- ✓ `Address` AND (`Address 2` or `address_2`)

→ **Preset: "Asana Contacts (AMC)"** will be auto-applied

### Component Pattern Detection
If your CSV has:
- ✓ `company_name` (or `Company Name`)
- ✓ `phone`
- ✓ `email`
- ✓ `Street` AND `City`

→ **Preset: "Asana Contacts (AMC)"** will be auto-applied

## Available Field Options

When importing **Clients** (Companies), you'll see these composite field options:

### Multi-Line Address Options:
- `address.line1` - Address line 1 (will be combined)
- `address.line2` - Address line 2 (will be combined)
- `address.line3` - Address line 3 (will be combined)

### Component Address Options:
- `address.street` - Street address (will be combined)
- `address.city` - City (will be combined)
- `address.state` - State (will be combined)
- `address.zip` - ZIP code (will be combined)

### Same for Billing Address:
- `billing_address.line1`, `billing_address.line2`, `billing_address.line3`
- `billing_address.street`, `billing_address.city`, `billing_address.state`, `billing_address.zip`

## Visual Feedback

When you map address fields, you'll see an alert showing what will be combined:

### Multi-Line Example:
> ℹ️ **Address fields will be combined:**
> 
> Address (line1) + Address 2 (line2) + Address 3 (line3) → **address**

### Component Example:
> ℹ️ **Address fields will be combined:**
> 
> Street (street) + City (city) + State (state) + Zip (zip) → **address**

## Combination Logic

### Multi-Line Pattern (`line1`, `line2`, `line3`):
```
Result = [line1, line2, line3].filter(not empty).join(', ')
```

**Examples:**
- All lines present: `"123 Main St, Suite 400, Irvine CA 92614"`
- Only 2 lines: `"123 Main St, Irvine CA 92614"`
- Only 1 line: `"123 Main St"`

### Component Pattern (`street`, `city`, `state`, `zip`):
```
Result = street + ", " + [city, state, zip].filter(not empty).join(' ')
```

**Examples:**
- All components: `"123 Main St, Irvine CA 92614"`
- Missing state: `"123 Main St, Irvine 92614"`
- Only street: `"123 Main St"`

## Priority Rules

If you map **BOTH patterns** for the same address, the system prefers:

1. **Multi-Line** (line1, line2, line3) takes priority
2. **Component** (street, city, state, zip) is used if no lines present

This allows flexibility if your CSV has mixed columns.

## Manual Mapping

If auto-detection doesn't work, you can manually map:

### For Multi-Line Addresses:
1. Select entity: **Clients**
2. Map your CSV columns:
   - `Address` → `address.line1`
   - `Address 2` → `address.line2`
   - `Address 3` → `address.line3`
3. System auto-creates composite mapping

### For Component Addresses:
1. Select entity: **Clients**
2. Map your CSV columns:
   - `Street` → `address.street`
   - `City` → `address.city`
   - `State` → `address.state`
   - `Zip` → `address.zip`
3. System auto-creates composite mapping

## Testing Your Import

1. **Upload CSV** with your address columns
2. **Check preset detection** - Should see "Asana Contacts (AMC)"
3. **Verify field mappings** - Address columns should map to composite fields
4. **Look for alert** - Should show "Address fields will be combined"
5. **Run dry-run** - Preview the combined addresses
6. **Check sample output** - Verify format looks correct
7. **Execute import** - Run the real import

## Common Scenarios

### Scenario 1: Only Have Address Line 1
**CSV:**
```csv
Address,Address 2,Address 3
"1200 Main St, Irvine CA 92614","",""
```

**Mapping:**
- `Address` → `address.line1`
- `Address 2` → Don't import (or map to `address.line2` - system ignores empty)
- `Address 3` → Don't import

**Result:** `"1200 Main St, Irvine CA 92614"`

### Scenario 2: Have All Three Lines
**CSV:**
```csv
Address,Address 2,Address 3
"1200 Main St","Suite 400","Irvine, CA 92614"
```

**Mapping:**
- `Address` → `address.line1`
- `Address 2` → `address.line2`
- `Address 3` → `address.line3`

**Result:** `"1200 Main St, Suite 400, Irvine, CA 92614"`

### Scenario 3: Mixed - Some Have Line 2, Some Don't
**CSV:**
```csv
Address,Address 2,Address 3
"1200 Main St","Suite 400","Irvine, CA 92614"
"456 Oak Ave","","Tampa, FL 33602"
```

**Both will import correctly:**
- Row 1: `"1200 Main St, Suite 400, Irvine, CA 92614"`
- Row 2: `"456 Oak Ave, Tampa, FL 33602"`

The system automatically skips empty fields!

## Troubleshooting

### "I don't see address.line1 in the dropdown"
- ✓ Make sure you selected **Clients** as the entity (not Contacts or Orders)
- ✓ The composite fields only appear for Clients

### "The preset isn't auto-detecting"
- ✓ Check your column names: `Address`, `Address 2` (with space), or `address_2` (with underscore)
- ✓ Must have `company_name`, `phone`, and `email` columns too
- ✓ You can still map manually even if preset doesn't detect

### "Address format looks wrong"
The current format is comma-separated lines. If you need a different format:
- Store components separately in custom fields: `props.address_line1`, `props.address_line2`
- Combine them manually later with your preferred format
- Or request a custom format variation

### "Can I mix component and multi-line?"
**Not recommended.** Pick one pattern:
- Use `address.line1`, `line2`, `line3` for multi-line addresses
- OR use `address.street`, `city`, `state`, `zip` for components
- Don't map both for the same address field

## Code Reference

The combination logic is in:
```typescript
// src/lib/migrations/transforms.ts
export function combineAddress(params, fullRow) {
  // Checks for line1/line2/line3 first
  // Falls back to street/city/state/zip
  // Returns comma-separated result
}
```

## Summary

✅ **Supports multi-line addresses** (Address, Address 2, Address 3)  
✅ **Supports component addresses** (Street, City, State, Zip)  
✅ **Auto-detects your pattern**  
✅ **Combines automatically during import**  
✅ **Visual feedback in UI**  
✅ **Handles empty fields gracefully**  

**Just upload your CSV and go!** 🎉

