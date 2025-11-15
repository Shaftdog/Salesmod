---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# How to Import Clients with Multi-Part Addresses

## The Problem

When importing clients with separate address columns (Street, City, State, Zip), only the first address line was imported because the fields weren't mapped correctly to the composite address fields.

## The Solution

The system **does** support composite address fields. You just need to map them correctly during the import process.

### Step-by-Step Instructions

1. **Start a New Import**
   - Go to Migrations → Import Wizard
   - Upload your CSV file
   - Select entity: **Clients**

2. **On the Field Mapping Step**
   
   Look for these fields in the "Database Field" dropdown:
   - `address.street` (composite)
   - `address.city` (composite)
   - `address.state` (composite)
   - `address.zip` (composite)

3. **Map Your CSV Columns**

   | Your CSV Column | Map To |
   |----------------|---------|
   | Street (or Address Line 1) | `address.street` |
   | City | `address.city` |
   | State | `address.state` |
   | Zip (or ZIP Code) | `address.zip` |

4. **The system will automatically combine** these into a single address:
   ```
   123 Main St, New York, NY, 10001
   ```

### Alternative: Use the Asana Contacts Preset

If you're importing AMC/client data with split addresses:

1. **On the Preset Selection step**, choose **"Asana Contacts (AMC)"**
2. This preset automatically maps common split address columns:
   - `Street` → `address.street`
   - `City` → `address.city`
   - `State` → `address.state`
   - `Zip` → `address.zip`

### What If the Fields Don't Show Up?

If you don't see the composite address fields in the dropdown:

1. **Make sure you're importing to "Clients"** (not Contacts or Orders)
2. **Scroll through the entire dropdown** - the fields might be lower in the list
3. **Look for fields marked with "(composite)"** in the description
4. **Try refreshing the page** and starting the import again

### To Fix Existing Incomplete Imports

You have two options:

#### Option 1: Re-Import with Update Strategy (Recommended)
1. Re-import the same CSV file
2. Map the fields correctly using the composite address fields
3. **Select "Update Existing"** as the duplicate strategy
4. This will update the addresses for all existing clients

#### Option 2: Manual Editing
1. Go to the Clients list
2. Edit each client individually to add the missing address parts

### Example CSV Structure

```csv
Company Name,Street,City,State,Zip,Phone,Email
Acme Corp,123 Main St,New York,NY,10001,555-1234,info@acme.com
Beta LLC,456 Oak Ave,Los Angeles,CA,90001,555-5678,hello@beta.com
```

**Map as:**
- Company Name → `company_name`
- Street → `address.street`
- City → `address.city`
- State → `address.state`
- Zip → `address.zip`
- Phone → `phone`
- Email → `email`

**Result:**
```
Company Name: Acme Corp
Address: 123 Main St, New York, NY, 10001
Phone: 555-1234
Email: info@acme.com
```

### Technical Details

The composite address fields are defined in `/src/app/api/migrations/targets/route.ts` (lines 66-69) and the combination logic is in `/src/app/api/migrations/run/route.ts` (lines 562-577).

The system automatically combines composite address fields before saving to the database, so you don't need to do anything special - just map the fields correctly!

## Need Help?

If you're still having trouble seeing the composite address fields:
1. Check the browser console for any errors
2. Make sure you're on the latest version of the code
3. Try a different browser
4. Take a screenshot of the field mapping dropdown and share it for debugging
