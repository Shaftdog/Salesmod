# How to Fix Incomplete Client Addresses

## The Problem

Your client imports show incomplete addresses:
- **What you have**: `77 VAN NESS AVE STE 101`
- **What you should have**: `77 VAN NESS AVE STE 101, San Francisco, CA, 94102`

## Why This Happened

1. During import, you only mapped the "Address" column, not City, State, Zip
2. The composite address fields (`address.city`, `address.state`, `address.zip`) weren't being selected due to a bug
3. The bug has now been fixed, but your existing imports won't be affected

## Solution: Re-Import with Correct Mapping

### Step 1: Fix Stuck Migration Jobs

Your import history shows jobs stuck as "Processing". Run this SQL in Supabase:

```sql
-- Mark stuck jobs as completed
UPDATE migration_jobs
SET 
  status = 'completed',
  finished_at = NOW()
WHERE status = 'processing'
  AND created_at < NOW() - INTERVAL '10 minutes'
  AND (totals->>'inserted')::int > 0;
```

### Step 2: Refresh Your Browser

**Important!** The fix I just made requires a browser refresh:
1. Go to your migrations page
2. Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows) to hard refresh
3. This loads the new code with the bug fix

### Step 3: Re-Import Your Clients

1. **Go to Migrations** → New Import
2. **Select**:
   - Source: Generic CSV
   - Entity: **Companies (Clients)**
   - Upload your CSV file

3. **On the Field Mapping Step**, map ALL address fields:

   | Your CSV Column | Map To |
   |----------------|---------|
   | Name | `company_name` |
   | Address (or Street) | `address.street` |
   | City | `address.city` |
   | State | `address.state` |
   | Zip | `address.zip` |
   | Phone | `phone` |
   | Email | `email` |
   | Address2 | `address.line2` (if you have it) |
   | Address3 | `address.line3` (if you have it) |
   | Role | `_role` (for automatic role mapping) |

4. **Select Duplicate Strategy**: **"Update Existing"**
   - This will UPDATE your existing clients with the complete addresses
   - Won't create duplicates

5. **Complete the import**

### Step 4: Verify

After the import completes:
1. Go back to the client you showed (`@ HOME VMS`)
2. The address should now show: `77 VAN NESS AVE STE 101, City, State, Zip`

## Expected Result

Before:
```
Address: 77 VAN NESS AVE STE 101
```

After:
```
Address: 77 VAN NESS AVE STE 101, San Francisco, CA, 94102
```

## Important Notes

1. **The Fix is Live**: The bug preventing you from selecting composite address fields has been fixed
2. **You Must Refresh**: Hard refresh your browser (`Cmd+Shift+R`) to get the new code
3. **All Fields Will Work**: You'll now be able to select `address.city`, `address.state`, `address.zip` and they'll show as "Mapped"
4. **Use Update Strategy**: This prevents creating more duplicates
5. **System Combines Them**: The system automatically combines the fields into the single `address` field

## Troubleshooting

### "I still can't select the address fields"
- Did you hard refresh? (`Cmd+Shift+R`)
- Clear your browser cache
- Try a different browser

### "The fields show as 'Skipped' after I select them"
- This was the bug - it's now fixed
- Make sure you refreshed after the fix was deployed

### "I'm getting duplicates again"
- Make sure to select **"Update Existing"** as the duplicate strategy
- The system matches by domain or company name

### "Import is stuck on 'Processing'"
- Run the SQL script in `fix-stuck-migrations.sql` in Supabase
- Or wait 10 minutes and refresh - they'll auto-complete

## Summary

✅ Bug is fixed - composite address fields now work
✅ Re-import with correct mapping using "Update Existing" strategy  
✅ Your clients will have complete addresses
✅ No more duplicates will be created (if you use Update strategy)
