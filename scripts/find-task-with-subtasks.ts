import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zqhenxhgcjxslpfezybm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaGVueGhnY2p4c2xwZmV6eWJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM3MTY4MywiZXhwIjoyMDc1OTQ3NjgzfQ.BKuVqBZ25zT5wsmp3flVudi9fXaLOz5wJCR9JEMctEg'
);

async function findTaskWithSubtasks() {
  // Get the parent task with subtasks
  const parentTaskId = 'ba95390d-0cdc-40da-8e88-a6be5bc267c2';

  const { data: parentTask, error } = await supabase
    .from('production_tasks')
    .select(`
      id, title, assigned_to, status,
      assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
    `)
    .eq('id', parentTaskId)
    .single();

  if (error) {
    console.error('Error finding parent task:', error);
    return;
  }

  console.log('Parent task with subtasks:');
  console.log(parentTask);

  // Find Rod's user ID
  const { data: rodProfile } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('email', 'rod@myroihome.com')
    .single();

  console.log('\nRod profile:', rodProfile);

  // If task isn't assigned to Rod, assign it
  if (parentTask && rodProfile && parentTask.assigned_to !== rodProfile.id) {
    console.log('\nAssigning task to Rod...');
    const { error: updateError } = await supabase
      .from('production_tasks')
      .update({ assigned_to: rodProfile.id })
      .eq('id', parentTaskId);

    if (updateError) {
      console.error('Error assigning:', updateError);
    } else {
      console.log('Task assigned to Rod successfully!');
    }
  } else if (parentTask.assigned_to === rodProfile?.id) {
    console.log('\nTask is already assigned to Rod.');
  }
}

findTaskWithSubtasks();
