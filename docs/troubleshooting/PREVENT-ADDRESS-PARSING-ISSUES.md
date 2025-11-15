---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Prevent Address Parsing Issues in Future Imports

## What Caused the 6 Unlinked Orders

**Root Cause**: Addresses in CSV lacked proper comma separation

**Examples:**
- ❌ "10 N Ohio St Orlando, FL 32805" (missing comma after "St")
- ✅ "10 N Ohio St, Orlando, FL 32805" (correct format)

**Impact**: Parser couldn't separate street from city, so:
- Street became: "10 N Ohio St Orlando"
- City became: "Unknown" (fallback)
- Property creation skipped due to missing city

---

## Solutions Implemented

### 1. **Enhanced Address Parser** ✅

**Updated**: `src/lib/migrations/transforms.ts`

**New Features:**
- ✅ Detects 70+ common Florida cities by name
- ✅ Extracts city even when comma is missing
- ✅ Handles "Street CityName, State Zip" format
- ✅ Multiple fallback patterns
- ✅ Smarter parsing logic

**Now Handles:**
```javascript
// Before: Failed
"10 N Ohio St Orlando, FL 32805"

// After: Succeeds!
splitUSAddress("10 N Ohio St Orlando, FL 32805")
→ { street: "10 N Ohio St", city: "Orlando", state: "FL", zip: "32805" }
```

### 2. **City Detection List**

Added 70+ Florida cities to detection:
- Orlando, Tampa, Miami, Jacksonville
- Ocoee, Eustis, Lady Lake (your specific cities)
- Delray Beach, Fort Myers, Sanford
- And many more...

**Benefit**: Even with malformed addresses, city gets extracted!

---

## Prevention Strategies for Future Imports

### Strategy 1: **Fix at Source (Asana Form)** ⭐ BEST

Update your Asana form to capture address components separately:

**Current (Problematic):**
```
Field: "Appraised Property Address" (single text field)
User enters: "10 N Ohio St Orlando FL 32805" (inconsistent formatting)
```

**Recommended (Cleaner):**
```
Field 1: "Street Address" → "10 N Ohio St"
Field 2: "City" → "Orlando"
Field 3: "State" → Dropdown: FL, GA, AL, etc.
Field 4: "ZIP Code" → "32805"
```

**Benefits:**
- ✅ Always correctly parsed (no guessing)
- ✅ Validation at entry time
- ✅ Consistent data quality
- ✅ 100% property linking success

**How to Implement in Asana:**
1. Edit your ORDERS form
2. Replace single "Appraised Property Address" field
3. Add 4 separate fields: Street, City, State (dropdown), ZIP
4. Update preset mapping to use 4 fields

### Strategy 2: **Enforce Format in Form Instructions** ⭐ GOOD

If you keep single field, add clear instructions:

```
Field: "Appraised Property Address"
Instructions: "Format: Street, City, State ZIP
Example: 123 Main St, Orlando, FL 32805
IMPORTANT: Include comma after street!"
```

Add validation in Asana form rules if possible.

### Strategy 3: **Manual Review Step** ⭐ OK

Add a validation step in migration wizard:

**UI Enhancement Idea:**
```tsx
<Alert variant="warning">
  ⚠️ 6 addresses couldn't be parsed. Review and fix:
  - 10 N Ohio St Orlando → Needs comma after "St"
  - Click "Fix Addresses" to manually correct
</Alert>
```

Would require UI changes to migration wizard.

### Strategy 4: **Post-Import Cleanup** ⭐ CURRENT

What we're doing now:
- Import orders (some unlinked)
- Run cleanup SQL to fix parsing
- Create missing properties
- Link everything

**Automated Version:**
```sql
-- Create a scheduled job to auto-fix unlinked orders
-- Runs daily to catch and fix any import issues
```

---

## Recommended Approach: Multi-Layer Defense

### Layer 1: **Better Source Data** (Asana Form)
- Use 4 separate fields for address components
- OR enforce format with clear instructions
- Validate at entry time

### Layer 2: **Smarter Parser** (Already Done!) ✅
- Enhanced parser with city detection
- Multiple fallback patterns
- 70+ Florida cities recognized

### Layer 3: **Import Validation**
- Dry run shows address parsing results
- Warn about unparseable addresses
- Allow manual correction before import

### Layer 4: **Auto-Cleanup** (What We Did)
- SQL scripts to fix common issues
- Manual property creation if needed
- Post-import linking

---

## Update Your Asana Form (Recommended)

### Current Field Structure:
```
Single Field: "Appraised Property Address"
↓
User types: "10 N Ohio St Orlando FL 32805"
↓
Parser tries to split → sometimes fails
```

### Recommended New Structure:
```
Field 1: "Street Address" (text)
  Example: "10 N Ohio St"

Field 2: "Unit/Apt #" (optional text)
  Example: "Unit 305", "Apt 2B"

Field 3: "City" (text or dropdown)
  Example: "Orlando"

Field 4: "State" (dropdown)
  Options: FL, GA, AL, SC, NC, TN

Field 5: "ZIP Code" (text, 5 digits)
  Example: "32805"
```

**Then update the preset:**
```typescript
// In Asana Orders preset
{ sourceColumn: 'Street Address', targetField: 'property_address' },
{ sourceColumn: 'Unit/Apt #', targetField: 'props.unit' },
{ sourceColumn: 'City', targetField: 'property_city' },
{ sourceColumn: 'State', targetField: 'property_state' },
{ sourceColumn: 'ZIP Code', targetField: 'property_zip' },
```

**Result**: 100% parsing success rate!

---

## Alternative: Add Validation to Current Field

If you want to keep single field, add JavaScript validation to Asana form:

```javascript
// Pseudo-code for Asana form validation
function validateAddress(address) {
  const hasCommaAfterStreet = /^.+,\s*.+,/.test(address);
  const hasStateAndZip = /[A-Z]{2}\s+\d{5}/.test(address);
  
  if (!hasCommaAfterStreet) {
    return "Please add comma after street: '123 Main St, City, State ZIP'";
  }
  
  if (!hasStateAndZip) {
    return "Missing state or ZIP code";
  }
  
  return true; // Valid
}
```

---

## Immediate Action Items

### ✅ Already Done:
1. Enhanced parser with city detection
2. Created fix script for 6 unlinked orders

### 🔨 Recommended This Week:
1. **Run** `FIX-6-UNLINKED-ORDERS.sql` to link the 6 orders
2. **Update** Asana form to use 4 separate address fields
3. **Test** new form with a dummy order

### 🎯 Long-term:
1. **Migrate** all existing Asana tasks to new field structure
2. **Add** validation to import preview (show parsing results)
3. **Create** auto-cleanup job for future imports

---

## Testing the Enhanced Parser

The improved parser now handles:

✅ "10 N Ohio St, Orlando, FL 32805" (standard)
✅ "10 N Ohio St Orlando, FL 32805" (missing comma - **NOW WORKS!**)
✅ "1012 Diego Ct Lady Lake, FL 32159" (missing comma - **NOW WORKS!**)
✅ "635 Kingbird Cir, Delray Beach, FL 33444" (standard)

**Future imports will have much better success rate!**

---

## Summary

### Problem:
- 6/22 orders unlinked due to address parsing failures
- Caused by inconsistent comma placement in CSV

### Solutions:
1. ✅ **Enhanced parser** - Detects cities intelligently (code update done)
2. ✅ **Fix script** - Links the 6 unlinked orders (SQL ready)
3. 🔨 **Source fix** - Update Asana form (recommended)
4. 🔨 **Validation** - Add import preview warnings (future)

### Next:
Run `FIX-6-UNLINKED-ORDERS.sql` to complete linking!

---

**The enhanced parser is now live in your code!**

Future imports will automatically handle addresses like "10 N Ohio St Orlando, FL 32805" correctly! 🎉

