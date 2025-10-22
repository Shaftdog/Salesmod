# Quick Start: Address Mapping for Your CSV

## Your Questions
> "How will the system deal with addresses because all I see is one field for address. The CSV is split up into address city state zip."
> 
> "How will it handle Address, Address 2 and Address 3?"

## The Answer
**The system now automatically combines BOTH patterns!** 🎉

The system supports:
1. ✅ **Multi-line addresses** (Address, Address 2, Address 3)
2. ✅ **Component addresses** (Street, City, State, Zip)

## What You'll See

### Pattern 1: Multi-Line Addresses

**Before (Your CSV):**
```csv
company_name,email,phone,Address,Address 2,Address 3
"AMC Contact","test@example.com","(949) 555-1010","1200 Main St","Suite 400","Irvine, CA 92614"
```

**After (In Database):**
```
address: "1200 Main St, Suite 400, Irvine, CA 92614"
```

### Pattern 2: Component Addresses

**Before (Your CSV):**
```csv
company_name,email,phone,Street,City,State,Zip
"AMC Contact","test@example.com","(949) 555-1010","1200 Main St Ste 400","Irvine","CA","92614"
```

**After (In Database):**
```
address: "1200 Main St Ste 400, Irvine CA 92614"
```

## Step-by-Step

### 1. Upload Your CSV
Just upload your file with the split address columns.

### 2. Auto-Detection
The system will detect the pattern and show:
> ✓ **Detected preset: Asana Contacts (AMC)**
> Field mappings will be pre-filled in the next step.

### 3. Field Mapping Screen
You'll see your address columns mapped to special composite fields:

**For Multi-Line Addresses:**
| CSV Column | → | Database Field | Status |
|------------|---|----------------|--------|
| Address | → | address.line1 (composite) | Mapped |
| Address 2 | → | address.line2 (composite) | Mapped |
| Address 3 | → | address.line3 (composite) | Mapped |

**For Component Addresses:**
| CSV Column | → | Database Field | Status |
|------------|---|----------------|--------|
| Street | → | address.street (composite) | Mapped |
| City | → | address.city (composite) | Mapped |
| State | → | address.state (composite) | Mapped |
| Zip | → | address.zip (composite) | Mapped |

### 4. Combination Alert
A blue alert box will show what's being combined:

**Multi-Line:**
> ℹ️ **Address fields will be combined:**
> 
> Address (line1) + Address 2 (line2) + Address 3 (line3) → **address**

**Component:**
> ℹ️ **Address fields will be combined:**
> 
> Street (street) + City (city) + State (state) + Zip (zip) → **address**

### 5. Import
When you run the import, the system automatically combines all address parts into a single `address` field in the database.

## What If I Need to Change It?

You can manually adjust the mappings:

**Option 1: Use Multi-Line Composite Fields (For Address/Address 2/Address 3)**
- Map Address → `address.line1`
- Map Address 2 → `address.line2`
- Map Address 3 → `address.line3`

**Option 2: Use Component Composite Fields (For Street/City/State/Zip)**
- Map Street → `address.street`
- Map City → `address.city`
- Map State → `address.state`  
- Map Zip → `address.zip`

**Option 3: Use First Line Only**
- Map Address → `address` (use as-is)
- Map Address 2 → Don't import
- Map Address 3 → Don't import

**Option 4: Store Separately in Custom Fields**
- Map Address → `props.address_line1`
- Map Address 2 → `props.address_line2`
- Map Address 3 → `props.address_line3`
- Combine manually later if needed

## How to Test Before Full Import

1. **Upload CSV** ✓
2. **Map fields** ✓
3. **Click "Validate"** - Run a dry-run
4. **Review results** - See exactly what will be imported
5. **Check addresses** - Verify the combined format looks good
6. **Then import** - Execute the real import

## Troubleshooting

### "I don't see address.line1 or address.street in the dropdown"
- Make sure you're importing to **Clients** (not Contacts or Orders)
- The composite fields only appear for the Clients entity
- You should see both `address.line1` (multi-line) and `address.street` (component) options

### "The addresses aren't combining"
- Check that your columns are mapped to `address.line1/line2/line3` OR `address.street/city/state/zip`
- Make sure you're not also mapping to the plain `address` field directly
- Look for the blue "Address fields will be combined" alert
- Don't mix patterns - use either line1/2/3 OR street/city/state/zip, not both

### "I want different formatting"
**Multi-line format:** `{line1}, {line2}, {line3}` (comma-separated)  
**Component format:** `{street}, {city} {state} {zip}`

If you need different formatting, you can:
1. Import with custom fields (`props.address_line1`, `props.address_line2`, etc.)
2. Manually build addresses later with your format
3. Or let us know what format you need

## Need More Info?

See the detailed guides:
- **Multi-Line Addresses:** `MULTI-LINE-ADDRESS-SUPPORT.md`
- **Full Implementation:** `ASANA-ADDRESS-MAPPING-IMPLEMENTATION.md`

---

**Bottom Line:** Whether you have Address/Address 2/Address 3 OR Street/City/State/Zip, the system automatically combines them into a single address field. Just upload and import! ✅

