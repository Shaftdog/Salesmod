import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zqhenxhgcjxslpfezybm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGVueGhnY2p4c2xwZmV6eWJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3MTY4MywiZXhwIjoyMDc1OTQ3NjgzfQ.BKuVqBZ25zT5wsmp3flVudi9fXaLOz5wJCR9JEMctEg'
);

async function addSubtasksToPendingTask() {
  const rodId = 'bde00714-427d-4024-9fbd-6f895824f733';

  // Get a pending task
  const { data: pendingTask } = await supabase
    .from('production_tasks')
    .select('id, title, stage, production_card_id')
    .eq('assigned_to', rodId)
    .is('parent_task_id', null)
    .eq('status', 'pending')
    .limit(1)
    .single();

  if (!pendingTask) {
    console.log('No pending tasks found');
    return;
  }

  console.log('Adding subtasks to:', pendingTask.title);

  // Get tenant_id from an existing subtask
  const { data: existingTask } = await supabase
    .from('production_tasks')
    .select('tenant_id')
    .not('tenant_id', 'is', null)
    .limit(1)
    .single();

  console.log('Using tenant_id:', existingTask?.tenant_id);

  const subtasks = [
    { title: 'Review current report content', description: 'Check all existing sections for accuracy', estimated_minutes: 15 },
    { title: 'Identify missing elements', description: 'List any items that need to be added', estimated_minutes: 10 },
    { title: 'Make required changes', description: 'Apply the revision changes to the report', estimated_minutes: 30 },
    { title: 'Quality check completed work', description: 'Verify all changes are correct', estimated_minutes: 10 },
  ];

  for (let i = 0; i < subtasks.length; i++) {
    const sub = subtasks[i];
    const { error } = await supabase
      .from('production_tasks')
      .insert({
        parent_task_id: pendingTask.id,
        production_card_id: pendingTask.production_card_id,
        title: sub.title,
        description: sub.description,
        stage: pendingTask.stage,
        role: 'appraiser',
        status: i === 0 ? 'in_progress' : 'pending',
        sort_order: i + 1,
        assigned_to: rodId,
        estimated_minutes: sub.estimated_minutes,
        tenant_id: existingTask?.tenant_id,
      });

    if (error) {
      console.error('Error adding subtask:', error);
    } else {
      console.log(`Added subtask: ${sub.title}`);
    }
  }

  console.log('\nDone! Refresh My Tasks page to see the collapsible subtasks.');
}

addSubtasksToPendingTask();
