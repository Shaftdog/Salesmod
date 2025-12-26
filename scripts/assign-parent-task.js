const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const testUserId = '314c0faf-0e4d-4517-b5d4-eec8b21fb20b';

async function assignParentTask() {
  console.log('Finding parent task to assign...\n');

  // Find a parent task (parent_task_id IS NULL) with a production card
  const { data: tasks, error: queryError } = await supabase
    .from('production_tasks')
    .select('id, title, status, assigned_to, parent_task_id, production_card_id')
    .is('parent_task_id', null)
    .not('production_card_id', 'is', null)
    .in('status', ['pending', 'in_progress'])
    .limit(5);

  if (queryError || !tasks || tasks.length === 0) {
    console.error('Error finding parent tasks:', queryError || 'No tasks found');
    process.exit(1);
  }

  console.log(`Found ${tasks.length} parent task(s):\n`);
  tasks.forEach((t, idx) => {
    console.log(`${idx + 1}. ${t.title || t.id}`);
    console.log(`   Status: ${t.status}, Assigned: ${t.assigned_to ? 'YES' : 'NO'}`);
  });

  // Assign the first unassigned one, or reassign the first one
  const taskToAssign = tasks.find(t => !t.assigned_to) || tasks[0];

  console.log(`\n→ Assigning task: ${taskToAssign.title || taskToAssign.id}`);

  const { data: updatedTask, error: updateError } = await supabase
    .from('production_tasks')
    .update({ assigned_to: testUserId })
    .eq('id', taskToAssign.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error assigning task:', updateError);
    process.exit(1);
  }

  console.log('\n✅ Parent task assigned successfully!');
  console.log(`  Task ID: ${updatedTask.id}`);
  console.log(`  Title: ${updatedTask.title}`);
  console.log(`  Status: ${updatedTask.status}`);
  console.log(`  Production Card ID: ${updatedTask.production_card_id}`);
  console.log('\n💡 Task should now appear in My Tasks page\n');
}

assignParentTask().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
