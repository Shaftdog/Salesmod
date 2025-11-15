---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# ✅ Case Management Setup Checklist

## Quick Setup (5 minutes)

### Step 1: Database Migration ⚡
- [ ] Open your Supabase project dashboard
- [ ] Go to SQL Editor
- [ ] Copy contents of `supabase-case-management-migration.sql`
- [ ] Paste into SQL Editor
- [ ] Click "Run" (or Cmd/Ctrl + Enter)
- [ ] Verify success message (no errors)

### Step 2: Verify Installation 🔍
- [ ] Check that `cases` table exists in Database view
- [ ] Check that `case_comments` table exists
- [ ] Verify sample data (if you uncommented the sample section)

### Step 3: Start Dev Server 🚀
```bash
npm run dev
```

### Step 4: Test the Feature ✨
- [ ] Open your app in browser
- [ ] Look for **LifeBuoy icon** (🛟) in sidebar
- [ ] Click Cases in sidebar
- [ ] Click "New Case" button
- [ ] Fill out form and create a test case
- [ ] Verify case appears with auto-generated number (CASE-YYYY-NNNN)
- [ ] Click on case to view detail page
- [ ] Try adding a comment
- [ ] Try changing status/priority
- [ ] Test filtering and search

---

## Verification Tests

### Test 1: Create Case
```
1. Click "New Case"
2. Subject: "Test case"
3. Type: Support
4. Priority: Normal
5. Status: New
6. Click "Create Case"
✅ Case created with auto-generated number
```

### Test 2: Add Comment
```
1. Open case detail page
2. Go to "Comments" tab
3. Type a comment
4. Toggle "Internal comment" checkbox
5. Click "Add Comment"
✅ Comment appears in timeline
```

### Test 3: Resolve Case
```
1. Open case detail page
2. Go to "Resolution" tab
3. Enter resolution text
4. Click "Mark as Resolved"
✅ Status changes to "Resolved"
✅ resolved_at timestamp set
```

### Test 4: Filtering
```
1. Go to Cases list page
2. Use search box
3. Try status filter
4. Try priority filter
5. Try type filter
✅ Cases filter correctly
```

---

## Integration Tests

### Link to Client
- [ ] Create case with client selected
- [ ] Verify client name shows on case card
- [ ] Verify link to client detail page works

### Link to Order
- [ ] Create case with order selected
- [ ] Verify order number shows on case card
- [ ] Verify link to order detail page works

### Navigation
- [ ] Cases link appears in sidebar
- [ ] Cases link is highlighted when on cases pages
- [ ] Back buttons work correctly

---

## Common Issues & Solutions

### ❌ Cases link not showing in sidebar
**Solution:** Server restart required
```bash
# Stop server (Ctrl+C)
npm run dev
```

### ❌ Case number not generating
**Solution:** Verify trigger is active
```sql
-- Run in Supabase SQL Editor
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'set_case_number_trigger';
```

### ❌ Cannot create cases
**Solution:** Check RLS policies
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'cases';
```

### ❌ TypeScript errors
**Solution:** Restart TypeScript server in VS Code
```
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

---

## Files Created (Reference)

### Database
- `supabase-case-management-migration.sql`

### Code Files
- `src/lib/types.ts` (updated)
- `src/lib/supabase/transforms.ts` (updated)
- `src/hooks/use-cases.ts`
- `src/components/cases/case-form.tsx`
- `src/components/cases/case-card.tsx`
- `src/components/cases/case-status-badge.tsx`
- `src/components/cases/cases-list.tsx`
- `src/app/(app)/cases/page.tsx`
- `src/app/(app)/cases/[id]/page.tsx`
- `src/components/layout/sidebar.tsx` (updated)

### Documentation
- `CASE-MANAGEMENT-GUIDE.md`
- `CASE-MANAGEMENT-SUMMARY.md`
- `CASE-MANAGEMENT-CHECKLIST.md` (this file)

---

## Production Checklist

Before deploying to production:

### Security
- [ ] Review RLS policies for your needs
- [ ] Test with different user roles
- [ ] Verify data isolation (if needed)

### Performance
- [ ] Test with large datasets
- [ ] Verify indexes are working
- [ ] Check query performance

### UX
- [ ] Test on mobile devices
- [ ] Verify responsive design
- [ ] Test all buttons and links
- [ ] Check error handling

### Data
- [ ] Backup database before migration
- [ ] Test rollback procedure
- [ ] Document any custom modifications

---

## Support

### Documentation
1. `CASE-MANAGEMENT-GUIDE.md` - Complete user guide
2. `CASE-MANAGEMENT-SUMMARY.md` - Technical summary
3. Component files - Inline code docs

### Debugging
- Check browser console for errors
- Check Supabase logs for database errors
- Verify authentication is working
- Check network tab for failed requests

---

## ✅ Setup Complete!

Once all checkboxes above are checked, your Case Management system is ready to use!

**Happy case tracking!** 🎉




