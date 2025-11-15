---
status: legacy
last_verified: 2025-11-15
updated_by: Claude Code
---

# 🔧 Phase 0 - Fix #1: validation_status Column

**Issue**: Database schema mismatch - code expects `validation_status` but migration created `verification_status`

**Error**:
```
Property upsert error: {
  code: 'PGRST204',
  message: "Could not find the 'validation_status' column of 'properties' in the schema cache"
}
```

---

## ✅ Quick Fix (2 minutes)

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**:
   - Go to: https://zqhenxhgcjxslpfezybm.supabase.co
   - Navigate to: **SQL Editor** (left sidebar)

2. **Run the SQL**:
   - Click "New Query"
   - Copy and paste the contents of `FIX-VALIDATION-STATUS.sql`
   - Click "Run" or press `Cmd+Enter`

3. **Verify**:
   - You should see output showing both columns exist
   - The errors in your dev server should stop

### Option 2: Supabase CLI (If you have credentials)

```bash
# Login to Supabase first
supabase login

# Then push the migration
cd /Users/sherrardhaugabrooks/Documents/Salesmod
npx supabase db push
```

---

## 📋 What the Fix Does

1. **Adds `validation_status` column** to the `properties` table
2. **Copies data** from `verification_status` to `validation_status`
3. **Creates indexes** for query performance
4. **Keeps both columns** for backward compatibility

---

## ✅ After Running the Fix

1. **Restart your dev server**:
   ```bash
   # Press Ctrl+C to stop the current server
   npm run dev
   ```

2. **Visit http://localhost:9002/properties**
   - The errors should be gone
   - Properties should load without schema errors

3. **Check the logs**:
   - No more "Could not find the 'validation_status' column" errors

---

## 🎯 Root Cause

**Mismatch between code and migration**:
- Migration file: `20251019000000_address_validation.sql` created `verification_status`
- Code files use: `validation_status` (8 references)

**Files using `validation_status`**:
- `src/app/api/migrations/run/route.ts`
- `src/app/api/admin/properties/backfill/route.ts`
- `src/app/(app)/properties/[id]/page.tsx`
- `src/app/(app)/properties/page.tsx`
- `src/app/api/validate-address/stats/route.ts`

---

## 🔄 Future Cleanup (Optional)

After confirming everything works, you could either:

**Option A**: Standardize on `validation_status` (current approach)
- Keep both columns for now
- Gradually migrate to using only `validation_status`

**Option B**: Update code to use `verification_status`
- Update all 8 code references
- More code changes but cleaner schema

**Recommendation**: Keep current fix (Option A) - less risky, works immediately.

---

## ✅ Verification Checklist

After running the SQL:

- [ ] SQL executed successfully in Supabase dashboard
- [ ] Restarted dev server
- [ ] Visited http://localhost:9002/properties
- [ ] No more PGRST204 errors in terminal
- [ ] Properties page loads correctly
- [ ] Can see properties data

---

**Status**: 🟡 Ready to apply (waiting for you to run SQL)  
**Time**: 2 minutes  
**Risk**: Low (adds column, doesn't modify existing data)

