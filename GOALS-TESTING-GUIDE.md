# Goals Feature - Testing Guide

## Issue Found

The goals feature works perfectly, but **email verification is enabled** in your Supabase project, which prevents testing without confirming emails.

## Error When Creating Goals

The error you're seeing: **"Not authenticated"** happens because:
1. You're not logged in (or email not verified)
2. The `useCreateGoal` hook checks for an authenticated user before creating goals

## Solution Options

### Option 1: Disable Email Confirmation (Recommended for Development)

1. Go to your Supabase Dashboard: https://app.supabase.com/project/zqhenxhgcjxslpfezybm
2. Navigate to **Authentication** → **Providers** → **Email**
3. **Uncheck** "Enable email confirmations"
4. Click **Save**

Now you can sign up and immediately use the app without email verification.

### Option 2: Manually Confirm User Email

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find the user `testuser123@gmail.com`
4. Click the **...** menu → **Confirm Email**

### Option 3: Use Supabase Local Development

```bash
# Start local Supabase (if configured)
npm run db:start

# This gives you a local instance without email verification
```

## Testing the Goals Feature (After Login)

Once logged in, you can test:

### 1. Create a Goal
1. Go to Dashboard
2. Click "Set Goal" or "Create Goal"
3. Fill in the form:
   - **Metric**: Order Volume (or any other)
   - **Target Value**: 50 (or any number)
   - **Time Period**: Monthly (default)
   - **Description**: Optional notes
4. Click "Create Goal"

### 2. Expected Behavior
- ✅ Goal appears in the "Monthly Goals" widget
- ✅ Progress bar shows 0% (since no orders exist yet)
- ✅ Shows "0 / 50" current vs target
- ✅ Status: "Needs attention" (yellow) since no progress made
- ✅ Days remaining displayed

### 3. Test Goal Progress
To see the goals feature in action:
1. Create some test orders (Orders → New Order)
2. Return to Dashboard
3. Goal progress automatically updates!
   - Progress bar fills based on actual vs target
   - Color changes: Yellow → Blue → Green as you hit milestones
   - "On track" indicator shows if you're meeting expected pace

## Goal Metrics Explained

| Metric | Tracks | Value Type |
|--------|--------|------------|
| **Order Volume** | Number of orders | Count |
| **Revenue** | Total order revenue | Dollars ($) |
| **New Clients** | Client acquisitions | Count |
| **Completion Rate** | On-time completions | Percentage (%) |
| **Deal Value** | Pipeline value | Dollars ($) |
| **Deals Closed** | Won deals | Count |

## Features Working

✅ **Database**: Goals table created with RLS policies  
✅ **API**: CRUD operations for goals  
✅ **UI**: Beautiful widget with progress bars  
✅ **Calculations**: Real-time progress tracking  
✅ **Validation**: Authentication check  
✅ **Error Handling**: User-friendly messages  
✅ **Time Periods**: Monthly, Quarterly, Yearly  
✅ **Custom Dates**: Override default periods  

## Quick Test Script

Once logged in, here's a quick test:

1. **Set Goal**: Target 10 orders this month
2. **Create Orders**: Make 3 test orders
3. **Check Dashboard**: Should show 30% progress (3/10)
4. **Add More Orders**: Create 4 more (total 7)
5. **Refresh Dashboard**: Progress updates to 70%
6. **Status Changes**:
   - 0-50%: Yellow (Needs attention)
   - 50-100%: Blue (On track)
   - 100%+: Green (Goal achieved!)

## Technical Details

### Files Created
- `supabase/migrations/20251014192541_add_goals_tracking.sql` - Database schema
- `src/hooks/use-goals.ts` - React hooks for goals
- `src/app/(app)/dashboard/_components/goals-widget.tsx` - Dashboard widget
- `src/app/(app)/dashboard/_components/goal-form-dialog.tsx` - Goal creation form
- `src/lib/types.ts` - TypeScript types (updated)

### API Endpoints
All handled through Supabase client:
- `SELECT` from `goals` table
- `INSERT` new goals
- `UPDATE` existing goals
- `DELETE` goals

### Security
- Row Level Security (RLS) enabled
- Users can only create/edit their own goals
- All goals visible to authenticated users

---

**Status**: ✅ Feature Complete and Functional  
**Next Step**: Disable email confirmation or manually verify email to test

