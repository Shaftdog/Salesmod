/**
 * Seed Task Library from existing Standard Appraisal Workflow template
 *
 * This script extracts all tasks and subtasks from the existing
 * "Standard Appraisal Workflow" production template and creates
 * corresponding entries in the task_library and task_library_subtasks tables.
 *
 * Run with: node scripts/seed-task-library.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTaskLibrary() {
  console.log('🌱 Starting Task Library Seed...\n');

  // Step 1: Find the Standard Appraisal Workflow template
  console.log('📋 Finding Standard Appraisal Workflow template...');
  const { data: templates, error: templateError } = await supabase
    .from('production_templates')
    .select('*')
    .ilike('name', '%Standard Appraisal%')
    .limit(1);

  if (templateError) {
    console.error('❌ Error finding template:', templateError.message);
    process.exit(1);
  }

  if (!templates || templates.length === 0) {
    console.error('❌ No "Standard Appraisal Workflow" template found.');
    console.error('   Please run the seed-task-templates.js script first.');
    process.exit(1);
  }

  const template = templates[0];
  console.log(`✅ Found template: "${template.name}" (ID: ${template.id})`);
  console.log(`   Org ID: ${template.org_id}\n`);

  // Step 2: Get all tasks from the template
  console.log('📝 Fetching template tasks...');
  const { data: templateTasks, error: tasksError } = await supabase
    .from('production_template_tasks')
    .select('*')
    .eq('template_id', template.id)
    .order('stage')
    .order('sort_order');

  if (tasksError) {
    console.error('❌ Error fetching tasks:', tasksError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${templateTasks.length} template tasks\n`);

  // Step 3: Get all subtasks
  console.log('📝 Fetching template subtasks...');
  const taskIds = templateTasks.map(t => t.id);
  const { data: templateSubtasks, error: subtasksError } = await supabase
    .from('production_template_subtasks')
    .select('*')
    .in('parent_task_id', taskIds)
    .order('sort_order');

  if (subtasksError) {
    console.error('❌ Error fetching subtasks:', subtasksError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${templateSubtasks.length} template subtasks\n`);

  // Group subtasks by parent task
  const subtasksByTask = {};
  templateSubtasks.forEach(st => {
    if (!subtasksByTask[st.parent_task_id]) {
      subtasksByTask[st.parent_task_id] = [];
    }
    subtasksByTask[st.parent_task_id].push(st);
  });

  // Step 4: Check if library already has entries for this org
  console.log('🔍 Checking existing task library entries...');
  const { data: existingLibrary, error: existingError } = await supabase
    .from('task_library')
    .select('id')
    .eq('org_id', template.org_id)
    .limit(1);

  if (existingError && !existingError.message.includes('does not exist')) {
    console.error('❌ Error checking library:', existingError.message);
    process.exit(1);
  }

  if (existingLibrary && existingLibrary.length > 0) {
    console.log('⚠️  Task library already has entries for this org.');
    console.log('   Skipping seed to prevent duplicates.');
    console.log('   To reseed, first delete existing entries.\n');
    return;
  }

  console.log('✅ Library is empty, proceeding with seed...\n');

  // Step 5: Create library tasks and subtasks
  console.log('🚀 Creating task library entries...\n');

  let tasksCreated = 0;
  let subtasksCreated = 0;
  const taskIdMapping = {}; // old template_task_id -> new library_task_id

  // Group tasks by stage for reporting
  const tasksByStage = {};
  templateTasks.forEach(task => {
    if (!tasksByStage[task.stage]) {
      tasksByStage[task.stage] = [];
    }
    tasksByStage[task.stage].push(task);
  });

  for (const stage of Object.keys(tasksByStage)) {
    const stageTasks = tasksByStage[stage];
    console.log(`  📁 ${stage} (${stageTasks.length} tasks)`);

    for (const task of stageTasks) {
      // Create library task
      const { data: newTask, error: createError } = await supabase
        .from('task_library')
        .insert({
          org_id: template.org_id,
          stage: task.stage,
          title: task.title,
          description: task.description,
          default_role: task.default_role,
          estimated_minutes: task.estimated_minutes,
          is_required: task.is_required,
          sort_order: task.sort_order,
          is_active: true,
          created_by: template.created_by,
        })
        .select()
        .single();

      if (createError) {
        console.error(`     ❌ Error creating task "${task.title}":`, createError.message);
        continue;
      }

      taskIdMapping[task.id] = newTask.id;
      tasksCreated++;
      console.log(`     ✓ ${task.title}`);

      // Create subtasks
      const subtasks = subtasksByTask[task.id] || [];
      for (const subtask of subtasks) {
        const { error: subtaskError } = await supabase
          .from('task_library_subtasks')
          .insert({
            library_task_id: newTask.id,
            title: subtask.title,
            description: subtask.description,
            default_role: subtask.default_role,
            estimated_minutes: subtask.estimated_minutes,
            is_required: subtask.is_required,
            sort_order: subtask.sort_order,
          });

        if (subtaskError) {
          console.error(`       ❌ Error creating subtask "${subtask.title}":`, subtaskError.message);
          continue;
        }

        subtasksCreated++;
      }

      if (subtasks.length > 0) {
        console.log(`       + ${subtasks.length} subtasks`);
      }
    }
    console.log('');
  }

  // Step 6: Update template tasks to link to library
  console.log('🔗 Linking template tasks to library...');
  let linked = 0;

  for (const [oldId, newId] of Object.entries(taskIdMapping)) {
    const { error: linkError } = await supabase
      .from('production_template_tasks')
      .update({ library_task_id: newId })
      .eq('id', oldId);

    if (linkError) {
      console.error(`   ❌ Error linking task ${oldId}:`, linkError.message);
      continue;
    }
    linked++;
  }

  console.log(`✅ Linked ${linked} template tasks to library\n`);

  // Summary
  console.log('═'.repeat(50));
  console.log('📊 SEED SUMMARY');
  console.log('═'.repeat(50));
  console.log(`   Library Tasks Created: ${tasksCreated}`);
  console.log(`   Library Subtasks Created: ${subtasksCreated}`);
  console.log(`   Template Tasks Linked: ${linked}`);
  console.log('═'.repeat(50));
  console.log('\n✅ Task Library seed complete!\n');
}

// Run the seed
seedTaskLibrary().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
