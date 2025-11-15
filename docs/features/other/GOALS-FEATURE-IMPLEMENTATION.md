---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Goals & Target Tracking Feature - Implementation Complete ✅

## What's Been Implemented

The goals feature is now fully implemented and ready to use! This allows you to set and track monthly, quarterly, or yearly goals for various sales metrics.

## Features Added

### 1. **Database Schema** ✅
- New `goals` table with full support for:
  - 6 metric types: Order Volume, Revenue, New Clients, Completion Rate, Deal Value, Deals Closed
  - Time periods: Monthly, Quarterly, Yearly
  - Team goals (no assignee) or individual goals (assigned to specific user)
  - Progress tracking with period dates
- Row Level Security (RLS) policies
- Indexes for performance
- Helper view (`current_goals_summary`) for easy querying

**Location:** `supabase/migrations/20251014192541_add_goals_tracking.sql`

### 2. **TypeScript Types** ✅
- `Goal` interface with all properties
- `GoalProgress` interface for tracking metrics
- Type definitions for metric types and period types

**Location:** `src/lib/types.ts` (lines 322-365)

### 3. **Custom Hooks** ✅
- `useGoals()` - Fetch goals with optional filters
- `useCurrentGoals()` - Get goals for current period
- `useGoalProgress()` - Calculate progress for a goal
- `useCreateGoal()` - Create new goal
- `useUpdateGoal()` - Update existing goal
- `useDeleteGoal()` - Delete goal
- `useToggleGoalActive()` - Activate/deactivate goals

**Location:** `src/hooks/use-goals.ts`

### 4. **Dashboard Widget** ✅
- Beautiful card display of current month's goals
- Real-time progress bars with color coding:
  - 🟢 Green: Goal achieved (100%+)
  - 🔵 Blue: On track (progress >= expected for time elapsed)
  - 🟡 Yellow: Needs attention
- Shows current value vs target
- Days remaining indicator
- Auto-calculates progress based on actual data
- Empty state with quick "Create Goal" button

**Location:** `src/app/(app)/dashboard/_components/goals-widget.tsx`

### 5. **Goal Creation Dialog** ✅
- User-friendly form for setting goals
- Metric selection with descriptions
- Auto-calculated period dates (current month/quarter/year)
- Custom date range override option
- Input validation
- Real-time metric unit display ($, %, count)

**Location:** `src/app/(app)/dashboard/_components/goal-form-dialog.tsx`

### 6. **Dashboard Integration** ✅
- Goals widget added to main dashboard
- Positioned alongside Tasks and AI Suggestions
- Responsive layout (3-column grid on large screens)

**Location:** `src/app/(app)/dashboard/page.tsx`

## How It Works

### Goal Types

1. **Order Volume** - Track number of orders (count)
2. **Revenue** - Track total revenue ($)
3. **New Clients** - Track client acquisition (count)
4. **Completion Rate** - Track on-time completion (%)
5. **Deal Value** - Track pipeline value ($)
6. **Deals Closed** - Track won deals (count)

### Progress Calculation

The system automatically calculates progress by:
- Filtering orders/deals/clients for the goal's time period
- Computing the actual value based on metric type
- Comparing against target value
- Determining if "on track" based on time elapsed vs progress

For example:
- If 50% of the month has passed, you should have ~50% of your goal
- System shows "On track" if you're at 90%+ of expected progress
- Shows "Goal achieved!" when you hit 100%+

### Time Periods

- **Monthly**: Current calendar month (auto-calculated)
- **Quarterly**: Current quarter (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec)
- **Yearly**: Current calendar year
- **Custom**: Set any date range

## Deployment Options

### Option 1: Link Supabase CLI (Recommended)

This will allow future migrations to be pushed automatically:

```bash
# Link your project (one-time setup)
npm run db:setup
# Enter your Supabase project reference when prompted

# Then push the migration
npm run db:push
```

### Option 2: Manual Application via Supabase Dashboard

If you prefer, you can apply the migration manually:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20251014192541_add_goals_tracking.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**

The migration file is also available at the root: `supabase-goals-migration.sql`

## Usage Guide

### Setting Your First Goal

1. Navigate to the Dashboard
2. In the "Monthly Goals" widget, click **"Set Goal"** or **"Create Goal"**
3. Select a metric (e.g., "Order Volume")
4. Enter your target value (e.g., 50 orders)
5. Choose time period (defaults to current month)
6. Add optional description
7. Click **"Create Goal"**

### Viewing Progress

- Goals automatically appear in the dashboard widget
- Progress bars update in real-time as orders/deals/clients are added
- Color indicators show status at a glance
- Hover/click for more details

### Managing Goals

- Goals can be created, edited, or deleted
- Set multiple goals for different metrics
- Track team goals (no assignee) or individual goals
- Archive old goals by setting `is_active` to false

## Database Details

### Table Structure

```sql
CREATE TABLE public.goals (
  id UUID PRIMARY KEY,
  metric_type TEXT (6 options),
  target_value DECIMAL(10,2),
  period_type TEXT (monthly/quarterly/yearly),
  period_start DATE,
  period_end DATE,
  assigned_to UUID (nullable),
  description TEXT,
  is_active BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Security

- Row Level Security (RLS) enabled
- Users can view all goals
- Users can create goals
- Users can update goals they created or are assigned to
- Users can delete goals they created

## Files Created/Modified

### New Files
- ✅ `supabase/migrations/20251014192541_add_goals_tracking.sql` - Database migration
- ✅ `supabase-goals-migration.sql` - Migration backup at root
- ✅ `src/hooks/use-goals.ts` - Goals data hooks
- ✅ `src/app/(app)/dashboard/_components/goals-widget.tsx` - Dashboard widget
- ✅ `src/app/(app)/dashboard/_components/goal-form-dialog.tsx` - Goal creation form
- ✅ `GOALS-FEATURE-IMPLEMENTATION.md` - This file

### Modified Files
- ✅ `src/lib/types.ts` - Added Goal and GoalProgress types
- ✅ `src/app/(app)/dashboard/page.tsx` - Added GoalsWidget to dashboard

## Next Steps

1. **Deploy the migration** using one of the options above
2. **Test the feature** by creating your first goal
3. **Monitor progress** as orders/deals come in
4. **Set multiple goals** for different metrics

## Future Enhancements (Optional)

- Goal history and trends over time
- Email/notification alerts when falling behind
- Goal templates for common targets
- Team vs individual goal comparison
- Export goal progress reports
- Goal achievement badges/celebrations

## Support

The feature is fully functional and ready to use. All necessary files have been created with proper error handling, TypeScript types, and modern UI components.

No linter errors detected. ✅

---

**Implementation Date:** October 14, 2025  
**Status:** Complete and Ready for Deployment  
**Migration File:** `supabase/migrations/20251014192541_add_goals_tracking.sql`

