/**
 * Copy Production Templates to All Users
 *
 * This script copies the default template to all users who don't have one yet.
 * Run with: node scripts/copy-templates-to-users.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// The source template ID (Rod's template with all the tasks)
const SOURCE_TEMPLATE_ID = 'dcc1b819-b2f0-4a21-a545-fed11d1fd675';

async function copyTemplateToUser(sourceTemplateId, targetUserId, targetEmail) {
  console.log(`\nCopying template to: ${targetEmail} (${targetUserId})`);

  // Get source template
  const { data: sourceTemplate } = await supabase
    .from('production_templates')
    .select('*')
    .eq('id', sourceTemplateId)
    .single();

  if (!sourceTemplate) {
    console.error('Source template not found');
    return false;
  }

  // Check if user already has a template
  const { data: existing } = await supabase
    .from('production_templates')
    .select('id')
    .eq('org_id', targetUserId)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log('  User already has a template, skipping');
    return false;
  }

  // Create new template for user
  const { data: newTemplate, error: templateError } = await supabase
    .from('production_templates')
    .insert({
      org_id: targetUserId,
      name: sourceTemplate.name,
      description: sourceTemplate.description,
      is_default: true,
      is_active: true,
      applicable_order_types: sourceTemplate.applicable_order_types,
      applicable_property_types: sourceTemplate.applicable_property_types,
      created_by: targetUserId,
    })
    .select()
    .single();

  if (templateError) {
    console.error('  Error creating template:', templateError.message);
    return false;
  }

  console.log(`  Created template: ${newTemplate.id}`);

  // Copy tasks
  const { data: sourceTasks } = await supabase
    .from('production_template_tasks')
    .select('*')
    .eq('template_id', sourceTemplateId)
    .order('sort_order');

  let taskCount = 0;
  let subtaskCount = 0;

  for (const task of sourceTasks || []) {
    const { data: newTask, error: taskError } = await supabase
      .from('production_template_tasks')
      .insert({
        template_id: newTemplate.id,
        stage: task.stage,
        title: task.title,
        description: task.description,
        default_role: task.default_role,
        estimated_minutes: task.estimated_minutes,
        is_required: task.is_required,
        sort_order: task.sort_order,
      })
      .select()
      .single();

    if (taskError) continue;
    taskCount++;

    // Copy subtasks
    const { data: sourceSubtasks } = await supabase
      .from('production_template_subtasks')
      .select('*')
      .eq('parent_task_id', task.id)
      .order('sort_order');

    if (sourceSubtasks && sourceSubtasks.length > 0) {
      const subtasksToInsert = sourceSubtasks.map(s => ({
        parent_task_id: newTask.id,
        title: s.title,
        description: s.description,
        default_role: s.default_role,
        estimated_minutes: s.estimated_minutes,
        is_required: s.is_required,
        sort_order: s.sort_order,
      }));

      const { data: insertedSubtasks } = await supabase
        .from('production_template_subtasks')
        .insert(subtasksToInsert)
        .select();

      subtaskCount += (insertedSubtasks || []).length;
    }
  }

  console.log(`  Copied ${taskCount} tasks, ${subtaskCount} subtasks`);
  return true;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Copy Production Templates to All Users');
  console.log('='.repeat(60));

  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, name');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    process.exit(1);
  }

  console.log(`Found ${users.length} users`);

  let copied = 0;
  let skipped = 0;

  for (const user of users) {
    const result = await copyTemplateToUser(SOURCE_TEMPLATE_ID, user.id, user.email);
    if (result) {
      copied++;
    } else {
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Done! Copied to ${copied} users, skipped ${skipped}`);
  console.log('='.repeat(60));
}

main();
