# Address Component Mapping - Implementation Complete ✅

## Overview

The migration system now supports **composite field mapping**, which allows multiple CSV columns (Street, City, State, Zip) to be automatically combined into a single database address field.

## The Problem

Your CSV has address data split into separate columns:
- `Street` → "1200 Main St Ste 400"
- `City` → "Irvine"
- `State` → "CA"
- `Zip` → "92614"

But the database `clients` table only has single text fields:
- `address` TEXT NOT NULL
- `billing_address` TEXT NOT NULL

The old system only supported **1:1 mapping** (one CSV column → one database field), making it impossible to properly map split addresses.

## The Solution

### 1. **Composite Field Type**

Added new field type `composite` to the field mapping system. When you map to fields like:
- `address.street`
- `address.city`
- `address.state`
- `address.zip`

The system automatically:
1. Detects these are address components
2. Creates a composite mapping
3. Combines them into the `address` field

### 2. **combineAddress Transform Function**

New transform function that intelligently combines address parts:

```typescript
combineAddress({ 
  street: 'Street',  // CSV column name
  city: 'City',      // CSV column name
  state: 'State',    // CSV column name
  zip: 'Zip'         // CSV column name
}, row)
```

**Output format:** `"1200 Main St Ste 400, Irvine CA 92614"`

### 3. **Automatic Detection & Preset**

Created `ASANA_CONTACTS_PRESET` that automatically:
- Detects CSV files with `company_name`, `phone`, `email`, `street`, `city` columns
- Pre-maps all address components correctly
- Shows a clear indicator in the UI that fields will be combined

## How It Works

### Step 1: Upload CSV
When you upload a CSV with split address fields, the system detects the pattern and suggests the Asana Contacts preset.

### Step 2: Field Mapping
The field mapper now shows:

**Available Database Fields:**
- `address` (text, required) - Company address (full)
- `address.street` (composite) - Street address (will be combined)
- `address.city` (composite) - City (will be combined)
- `address.state` (composite) - State (will be combined)
- `address.zip` (composite) - ZIP code (will be combined)

### Step 3: Visual Feedback
When composite fields are mapped, you'll see an alert:

> **Address fields will be combined:**
> 
> Street (street) + City (city) + State (state) + Zip (zip) → **address**

### Step 4: Processing
During migration, the system:
1. Reads all four CSV columns
2. Combines them: `"{street}, {city} {state} {zip}"`
3. Stores the result in the single `address` database field

## Example Mapping

**Your CSV:**
```csv
company_name,email,phone,Street,City,State,Zip,primary_contact
"AMC Contact","test@example.com","(949) 555-1010","1200 Main St Ste 400","Irvine","CA","92614","John Doe"
```

**After Processing:**
```javascript
{
  company_name: "AMC Contact",
  email: "test@example.com",
  phone: "(949) 555-1010",
  address: "1200 Main St Ste 400, Irvine CA 92614",  // ← Combined!
  primary_contact: "John Doe"
}
```

## Billing Address Support

The same system works for billing addresses:
- `billing_address.street`
- `billing_address.city`
- `billing_address.state`
- `billing_address.zip`

→ Combined into `billing_address` field

## Code Changes

### Files Modified

1. **`src/lib/migrations/types.ts`**
   - Added `combineAddress` to `TransformFunction` type
   - Enhanced `FieldMapping` interface documentation

2. **`src/lib/migrations/transforms.ts`**
   - Implemented `combineAddress()` function
   - Updated `applyTransform()` to accept full row for composite transforms

3. **`src/app/api/migrations/targets/route.ts`**
   - Added composite field definitions for `clients` entity
   - `address.street`, `address.city`, `address.state`, `address.zip`
   - `billing_address.*` components

4. **`src/components/migrations/field-mapper.tsx`**
   - Added `updateCompositeAddressMappings()` helper
   - Automatically creates composite mappings when components are detected
   - Shows visual indicator when addresses will be combined
   - Updated summary stats to show composite fields

5. **`src/app/api/migrations/run/route.ts`**
   - Updated `applyTransform()` calls to pass full row

6. **`src/app/api/migrations/dry-run/route.ts`**
   - Updated `applyTransform()` calls to pass full row

7. **`src/lib/migrations/presets.ts`**
   - Created `ASANA_CONTACTS_PRESET` with address component mappings
   - Updated `detectPreset()` to recognize split address pattern

## Usage Guide

### For Your Current Import

1. **Upload your CSV** with `Street`, `City`, `State`, `Zip` columns
2. **System auto-detects** "Asana Contacts (AMC)" preset
3. **Field mapper shows:**
   - Street → `address.street` (composite)
   - City → `address.city` (composite)
   - State → `address.state` (composite)
   - Zip → `address.zip` (composite)
4. **Alert shows:** "Address fields will be combined: Street + City + State + Zip → address"
5. **Proceed with import** - addresses will be automatically combined

### Manual Mapping

If the preset isn't detected, you can manually:

1. Map `Street` column to `address.street`
2. Map `City` column to `address.city`
3. Map `State` column to `address.state`
4. Map `Zip` column to `address.zip`

The system will automatically create the composite mapping.

### Alternative: Full Address Column

If your CSV has a **single full address column**, you can still map directly:
- `Address` CSV column → `address` database field (no transformation needed)

## Benefits

✅ **Flexible Input** - Handles both split and combined address formats
✅ **Automatic Detection** - Preset auto-applies for common patterns
✅ **Clear Feedback** - Visual indicators show what will happen
✅ **Consistent Output** - Standardized address format in database
✅ **Extensible** - Same pattern works for other composite fields

## Testing

To test the feature:

1. Upload the AMC Contact CSV with split address columns
2. Verify the "Asana Contacts (AMC)" preset is detected
3. Check that address components are mapped correctly
4. Look for the "Address fields will be combined" alert
5. Run a dry-run to validate the combined addresses
6. Execute the import and verify addresses in the database

## Future Enhancements

Potential improvements:
- Address validation/standardization API integration
- Support for international address formats
- Address parsing (if single field needs to be split)
- Custom composite field builder in UI

## Technical Notes

### Why This Approach?

- **Non-breaking** - Existing single-column mappings still work
- **Backward compatible** - Old presets continue to function
- **Database agnostic** - Works with any composite field, not just addresses
- **Transform-based** - Uses existing transform infrastructure
- **UI-friendly** - Clear visual feedback and error handling

### Transform Execution

Composite transforms are special:
- Execute before null checks
- Require full row access
- Can reference any source column
- Output goes to target field like normal transforms

### Composite Field Convention

Naming pattern: `{parentField}.{component}`
- `address.street`
- `address.city`
- `billing_address.state`

Internal mapping uses: `__composite_{parentField}__` as sourceColumn

## Summary

Your CSV with split address columns will now **automatically combine** into the single database `address` field during import. The system handles this intelligently with:

1. ✅ Auto-detection
2. ✅ Visual feedback
3. ✅ Proper formatting
4. ✅ Validation support

**No manual intervention needed** - just upload and import! 🎉
