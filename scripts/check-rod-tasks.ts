import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zqhenxhgcjxslpfezybm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGVueGhnY2p4c2xwZmV6eWJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3MTY4MywiZXhwIjoyMDc1OTQ3NjgzfQ.BKuVqBZ25zT5wsmp3flVudi9fXaLOz5wJCR9JEMctEg'
);

async function checkRodTasks() {
  const rodId = 'bde00714-427d-4024-9fbd-6f895824f733';

  // Get all tasks assigned to Rod (parent tasks only)
  const { data: tasks, error } = await supabase
    .from('production_tasks')
    .select('id, title, status, stage, parent_task_id')
    .eq('assigned_to', rodId)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Rod\'s parent tasks:');
  tasks?.forEach(t => {
    console.log(`- [${t.status}] ${t.title} (stage: ${t.stage})`);
  });

  // Check which have subtasks
  const taskIds = tasks?.map(t => t.id) || [];

  const { data: subtasks } = await supabase
    .from('production_tasks')
    .select('parent_task_id')
    .in('parent_task_id', taskIds);

  const tasksWithSubtasks = [...new Set(subtasks?.map(s => s.parent_task_id) || [])];
  console.log('\nTasks with subtasks:', tasksWithSubtasks.length);

  // Show which ones have subtasks
  tasks?.forEach(t => {
    if (tasksWithSubtasks.includes(t.id)) {
      console.log(`- "${t.title}" has subtasks`);
    }
  });
}

checkRodTasks();
