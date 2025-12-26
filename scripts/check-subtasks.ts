import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zqhenxhgcjxslpfezybm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGVueGhnY2p4c2xwZmV6eWJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3MTY4MywiZXhwIjoyMDc1OTQ3NjgzfQ.BKuVqBZ25zT5wsmp3flVudi9fXaLOz5wJCR9JEMctEg'
);

async function checkSubtasks() {
  const { data: subtasks, error } = await supabase
    .from('production_tasks')
    .select('parent_task_id, title')
    .not('parent_task_id', 'is', null)
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Subtasks found:', subtasks?.length || 0);
  if (subtasks?.length > 0) {
    console.log('Sample subtasks:', subtasks);
  } else {
    console.log('No subtasks exist in the database yet.');
  }
}

checkSubtasks();
