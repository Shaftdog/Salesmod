# Archived Migrations - December 2025

These migrations were already applied directly to the production database but were never committed to the repository. They are archived here for reference.

## Why Archived

These migrations were applied manually during development sessions using direct database connections or the Supabase dashboard. Since they're already in production, committing them to `supabase/migrations/` would cause conflicts when running `supabase db push`.

## Files

### Order Status Alignment (Dec 12, 2025)

| File | Purpose |
|------|---------|
| `20251212000000_align_order_status_with_production_stages.sql` | Aligned order status enum with production Kanban stages |
| `20251212000001_order_status_migration_applied.sql` | Marker migration confirming status alignment was applied |
| `20251212000002_sync_order_status_with_production_card.sql` | Trigger to sync order status when production card stage changes |
| `20251212000003_fix_production_cards_rls_insert.sql` | Fixed RLS policy for production_cards INSERT operations |

### Production Task Automation (Dec 13, 2025)

| File | Purpose |
|------|---------|
| `20251213000003_auto_complete_subtasks.sql` | Auto-complete subtasks when parent task is completed |
| `20251213000004_can_move_only_checks_parent_tasks.sql` | can_move_to_stage() only checks parent tasks, not subtasks |
| `20251213000005_move_card_generates_stage_tasks.sql` | Moving a card to a new stage auto-generates tasks for that stage |

## Date Archived

December 13, 2025

## Notes

If you need to recreate these migrations on a fresh database, you can copy them back to `supabase/migrations/` and run `supabase db push`. However, check that the changes aren't already present in more recent consolidated migrations.
