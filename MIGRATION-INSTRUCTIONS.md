# 🚀 How to Run Database Migrations

## Quick Start

Since you're using a remote Supabase instance, you'll need to run the migrations through the Supabase Dashboard.

### Step-by-Step Instructions

#### 1. Open Supabase Dashboard
1. Go to your Supabase project: https://app.supabase.com
2. Select your project (the one with URL: `zqhenxhgcjxslpfezybm.supabase.co`)

#### 2. Open SQL Editor
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

#### 3. Run the Migration
1. Open the file: `RUN-THIS-IN-SUPABASE-MIGRATIONS.sql` (in your project root)
2. **Copy the entire contents** of that file
3. **Paste into the SQL Editor**
4. Click **"Run"** button (or press Cmd/Ctrl + Enter)

#### 4. Verify Success
You should see:
```
status: "Migrations completed successfully!"
```

If you see any errors, check:
- The `update_updated_at()` function exists (from previous migrations)
- You have admin access to the database
- No RLS conflicts

## What Gets Created

### Migration System
- ✅ `migration_jobs` table - tracks all import jobs
- ✅ `migration_errors` table - stores detailed errors
- ✅ `props` columns on contacts, clients, orders
- ✅ Indexes for performance (GIN, functional)
- ✅ RLS policies for security

### Contacts System
- ✅ `contact_companies` table - employment history
- ✅ Full-text search on contacts
- ✅ Unique constraints (email, domain)
- ✅ `transfer_contact_company()` function
- ✅ `get_contact_with_history()` function
- ✅ `contacts_with_company` view
- ✅ Data integrity triggers

## Features Enabled After Migration

### Migration System (/migrations page)
- Import from Asana (orders)
- Import from HubSpot (contacts/companies)
- Import from generic CSV
- Field mapping with presets
- Duplicate detection
- Company history tracking (on import)
- Cancel running imports
- Error reporting with CSV download

### Contacts System (/contacts page)
- View all contacts across companies
- Search contacts (full-text search)
- Contact detail pages
- Company history timeline
- Transfer contacts between companies
- Edit contact information
- Navigate from client pages

## Alternative: Manual Migration

If the combined file doesn't work, run each migration individually:

### Option A: Run Migration Files Separately

**1. Migration System:**
```bash
# Copy contents of: supabase/migrations/20251017000000_add_migration_system.sql
# Paste and run in SQL Editor
```

**2. Contacts System:**
```bash
# Copy contents of: supabase/migrations/20251017100000_add_contacts_system.sql
# Paste and run in SQL Editor
```

### Option B: CLI (if you get Supabase auth working)

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref zqhenxhgcjxslpfezybm

# Push migrations
npm run db:push
```

## Troubleshooting

### Error: "function update_updated_at does not exist"

This function should exist from previous migrations. If not, add it:

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "relation public.profiles does not exist"

Change `public.profiles` to your user table name, or create a profiles table if needed.

### Error: "permission denied"

Ensure you're logged in as the database owner or have SUPERUSER privileges.

## Verify Migration Success

After running migrations, check:

1. **Migration System**:
   - Go to `/migrations` in your app
   - Should see the wizard interface
   - Try downloading a CSV template

2. **Contacts System**:
   - Go to `/contacts` in your app
   - Should see contacts list with stats
   - Click on a contact
   - Try clicking "Company History" tab (should work now!)
   - Try "Transfer Company" button

3. **Database Tables**:
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('migration_jobs', 'migration_errors', 'contact_companies');
   ```

## Post-Migration

Once migrations are complete, you can:

1. **Test Migrations System**:
   - Navigate to `/migrations`
   - Download a contacts template
   - Upload a small CSV file
   - Test the full wizard flow

2. **Test Contacts Features**:
   - Transfer a contact between companies
   - View company history
   - Search contacts with full-text search

3. **Import Real Data**:
   - Export from Asana
   - Export from HubSpot
   - Use migration wizard to import

## Need Help?

If migrations fail:
1. Check error messages in SQL Editor
2. Verify `update_updated_at()` function exists
3. Run queries one section at a time
4. Check for existing tables/policies with same names

The combined SQL file is ready at: `RUN-THIS-IN-SUPABASE-MIGRATIONS.sql` 🚀

