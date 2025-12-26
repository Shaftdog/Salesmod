/**
 * Assign a task to the automated test user
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function assignTaskToTestUser() {
  console.log('🔧 Assigning task to automated test user...\n');

  const testEmail = 'automated-test@appraisetrack.com';

  // Get test user profile
  const { data: testUser, error: userError } = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('email', testEmail)
    .maybeSingle();

  if (userError || !testUser) {
    console.error('❌ Test user not found:', testEmail);
    console.error('   Run: node create-test-user.js first');
    process.exit(1);
  }

  console.log(`✓ Found test user: ${testUser.email} (ID: ${testUser.id})`);

  // Get any active production task (pending or in_progress)
  const { data: tasks, error: tasksError } = await supabase
    .from('production_tasks')
    .select('id, title, assigned_to, status')
    .in('status', ['pending', 'in_progress'])
    .limit(10);

  if (tasksError || !tasks || tasks.length === 0) {
    console.error('❌ No tasks found in database');
    console.error('   Create some production tasks first');
    process.exit(1);
  }

  console.log(`\n✓ Found ${tasks.length} task(s) in database`);

  // Find a task that's not assigned or assign the first one
  let taskToAssign = tasks.find(t => !t.assigned_to) || tasks[0];

  console.log(`\n→ Assigning task: ${taskToAssign.title || taskToAssign.id}`);
  console.log(`  Status: ${taskToAssign.status}`);
  console.log(`  Current assignee: ${taskToAssign.assigned_to || '(unassigned)'}`);

  // Assign the task to test user
  const { data: updatedTask, error: updateError } = await supabase
    .from('production_tasks')
    .update({ assigned_to: testUser.id })
    .eq('id', taskToAssign.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error assigning task:', updateError);
    process.exit(1);
  }

  console.log('\n✅ Task assigned successfully!');
  console.log(`  Task ID: ${updatedTask.id}`);
  console.log(`  Title: ${updatedTask.title || '(no title)'}`);
  console.log(`  Assigned to: ${testUser.email}`);
  console.log('\n💡 You can now run Playwright tests on the My Tasks page\n');
}

assignTaskToTestUser().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
