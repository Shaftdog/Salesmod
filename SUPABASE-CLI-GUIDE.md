# Supabase CLI Setup Guide

## ✅ What's Been Done

1. ✅ Supabase CLI installed as a dev dependency
2. ✅ Project initialized with `supabase init`
3. ✅ Helper scripts created
4. ✅ npm scripts added for easy database management

## 📋 Next Steps

### Step 1: Link to Your Supabase Project

You need to link this local project to your hosted Supabase database. Run:

```bash
npm run db:setup
```

Or manually:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Where to find your project ref:**
- Your Supabase dashboard URL: `https://app.supabase.com/project/YOUR-PROJECT-REF`
- Or from your `NEXT_PUBLIC_SUPABASE_URL`: it's the part before `.supabase.co`
  - Example: `https://abcdefgh12345678.supabase.co` → project ref is `abcdefgh12345678`

### Step 2: Pull Current Schema

After linking, pull your current database schema as a baseline:

```bash
npm run db:pull
```

This creates a migration file in `supabase/migrations/` that represents your current database state. This prevents re-running old migrations.

### Step 3: Archive Old Migration Files

Move your manually created `.sql` files to an archive folder:

```bash
./archive-old-migrations.sh
```

These files are already applied to your database, so we're just keeping them for reference.

## 🚀 Daily Workflow

### Creating a New Migration

When you need to make database changes:

```bash
# Create a new migration file
npm run db:new your_feature_name

# This creates: supabase/migrations/20231014123456_your_feature_name.sql
# Edit the file with your SQL changes
```

### Applying Migrations

Push your migration to Supabase:

```bash
npm run db:push
```

That's it! No more copy-pasting into the Supabase dashboard. 🎉

### Generating TypeScript Types

After any schema changes, regenerate your types:

```bash
npm run db:types
```

This updates `src/lib/supabase/database.types.ts` with your latest schema.

## 📝 Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run db:setup` | One-time setup to link your project |
| `npm run db:pull` | Pull latest schema from Supabase |
| `npm run db:push` | Push local migrations to Supabase |
| `npm run db:new <name>` | Create a new migration file |
| `npm run db:types` | Generate TypeScript types from schema |
| `npm run db:start` | Start local Supabase (Docker required) |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset local database |

## 🤖 How AI Agents Will Use This

Once linked, I (or any AI agent) can:

1. **Create migrations automatically:**
   ```bash
   npm run db:new add_customer_notes
   ```

2. **Write the SQL directly to the file:**
   ```sql
   ALTER TABLE customers ADD COLUMN notes TEXT;
   ```

3. **Push to your database:**
   ```bash
   npm run db:push
   ```

4. **Update types:**
   ```bash
   npm run db:types
   ```

All without you needing to copy-paste anything! 🚀

## 🔒 Safety Features

- ✅ Migrations are tracked and versioned
- ✅ Can't accidentally re-run old migrations
- ✅ Can rollback changes if needed
- ✅ Baseline migration prevents conflicts with existing schema
- ✅ All changes are in version control

## 📁 Project Structure

```
/Users/sherrardhaugabrooks/Documents/Salesmod/
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── migrations/              # Your database migrations (tracked)
│   │   └── 20231014000000_remote_schema.sql  # Baseline (after db:pull)
│   └── archive/                 # Old manually-applied migrations (reference only)
│       ├── supabase-migration.sql
│       ├── supabase-crm-migration.sql
│       ├── supabase-phase2-migration.sql
│       ├── supabase-agent-migration.sql
│       ├── supabase-agent-rls-fix.sql
│       └── supabase-case-management-migration.sql
├── supabase-setup.sh            # Setup helper script
└── archive-old-migrations.sh    # Migration archiving script
```

## 🆘 Troubleshooting

### "Project not linked" error
Run `npm run db:setup` to link your project.

### Permission issues
Make sure you have the correct database password when linking.

### Migrations fail
Check the migration file for syntax errors before pushing.

### Types out of sync
Run `npm run db:types` after any schema changes.

## 🎯 What Changed

**Before:**
1. Write SQL in editor
2. Copy entire content
3. Go to Supabase dashboard
4. Paste into SQL editor
5. Run manually
6. Hope nothing breaks

**After:**
1. `npm run db:new feature_name`
2. Write SQL
3. `npm run db:push`
4. Done! ✨

---

**Ready to get started? Run `npm run db:setup` to link your project!**

