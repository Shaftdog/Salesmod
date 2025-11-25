/**
 * Seed default production template for testing
 * Run with: node scripts/seed-default-production-template.js <user-id>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Get user ID from command line or use first user
async function getUserId() {
  if (process.argv[2]) {
    return process.argv[2];
  }

  // Get first user from auth.users table using pg
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const client = await pool.connect();
    const { rows } = await client.query(`
      SELECT id, email
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 1;
    `);
    client.release();
    await pool.end();

    if (!rows || rows.length === 0) {
      console.error('No users found. Please provide a user ID as argument.');
      process.exit(1);
    }

    console.log(`Using user: ${rows[0].email}`);
    return rows[0].id;
  } catch (error) {
    console.error('Error getting user:', error.message);
    console.error('Please provide a user ID as argument: node seed-default-production-template.js <user-id>');
    process.exit(1);
  }
}

async function seedDefaultTemplate() {
  const userId = await getUserId();

  console.log(`\nCreating default production template for user: ${userId}\n`);

  // Create template
  const { data: template, error: templateError } = await supabase
    .from('production_templates')
    .insert({
      org_id: userId,
      name: 'Standard Residential Appraisal',
      description: 'Default workflow for standard residential appraisals',
      is_default: true,
      is_active: true,
      applicable_order_types: ['appraisal'],
      applicable_property_types: ['residential'],
      created_by: userId,
    })
    .select()
    .single();

  if (templateError) {
    console.error('❌ Failed to create template:', templateError);
    process.exit(1);
  }

  console.log('✅ Created template:', template.name);

  // Define tasks for each stage
  const tasks = [
    // INTAKE stage
    { stage: 'INTAKE', title: 'Review order details', role: 'admin', minutes: 15, order: 1 },
    { stage: 'INTAKE', title: 'Verify property information', role: 'admin', minutes: 10, order: 2 },
    { stage: 'INTAKE', title: 'Check client requirements', role: 'admin', minutes: 10, order: 3 },

    // SCHEDULING stage
    { stage: 'SCHEDULING', title: 'Contact homeowner', role: 'admin', minutes: 15, order: 1 },
    { stage: 'SCHEDULING', title: 'Schedule inspection', role: 'admin', minutes: 10, order: 2 },

    // SCHEDULED stage
    { stage: 'SCHEDULED', title: 'Confirm appointment', role: 'appraiser', minutes: 5, order: 1 },
    { stage: 'SCHEDULED', title: 'Prepare inspection materials', role: 'appraiser', minutes: 10, order: 2 },

    // INSPECTED stage
    { stage: 'INSPECTED', title: 'Upload inspection photos', role: 'appraiser', minutes: 30, order: 1 },
    { stage: 'INSPECTED', title: 'Complete property data sheet', role: 'appraiser', minutes: 20, order: 2 },
    { stage: 'INSPECTED', title: 'Research comparable sales', role: 'appraiser', minutes: 45, order: 3 },

    // FINALIZATION stage
    { stage: 'FINALIZATION', title: 'Complete appraisal report', role: 'appraiser', minutes: 120, order: 1 },
    { stage: 'FINALIZATION', title: 'Review for accuracy', role: 'reviewer', minutes: 30, order: 2 },
    { stage: 'FINALIZATION', title: 'Address reviewer comments', role: 'appraiser', minutes: 30, order: 3, required: false },

    // READY_FOR_DELIVERY stage
    { stage: 'READY_FOR_DELIVERY', title: 'Final QC check', role: 'admin', minutes: 10, order: 1 },
    { stage: 'READY_FOR_DELIVERY', title: 'Package for delivery', role: 'admin', minutes: 5, order: 2 },

    // DELIVERED stage
    { stage: 'DELIVERED', title: 'Send to client', role: 'admin', minutes: 5, order: 1 },
    { stage: 'DELIVERED', title: 'Confirm receipt', role: 'admin', minutes: 5, order: 2 },

    // CORRECTION stage
    { stage: 'CORRECTION', title: 'Review correction request', role: 'appraiser', minutes: 15, order: 1 },
    { stage: 'CORRECTION', title: 'Make required corrections', role: 'appraiser', minutes: 45, order: 2 },

    // REVISION stage
    { stage: 'REVISION', title: 'Review revision request', role: 'appraiser', minutes: 20, order: 1 },
    { stage: 'REVISION', title: 'Complete revision', role: 'appraiser', minutes: 60, order: 2 },

    // WORKFILE stage
    { stage: 'WORKFILE', title: 'Archive documents', role: 'admin', minutes: 10, order: 1 },
    { stage: 'WORKFILE', title: 'Update records', role: 'admin', minutes: 5, order: 2 },
  ];

  console.log(`\nCreating ${tasks.length} template tasks...\n`);

  let createdCount = 0;
  for (const task of tasks) {
    const { error: taskError } = await supabase
      .from('production_template_tasks')
      .insert({
        template_id: template.id,
        stage: task.stage,
        title: task.title,
        default_role: task.role,
        estimated_minutes: task.minutes,
        is_required: task.required !== false,
        sort_order: task.order,
      });

    if (taskError) {
      console.error(`❌ Failed to create task "${task.title}":`, taskError.message);
    } else {
      createdCount++;
      console.log(`✅ Created task: [${task.stage}] ${task.title}`);
    }
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   Template: ${template.name}`);
  console.log(`   Tasks created: ${createdCount}/${tasks.length}`);
  console.log(`   Template ID: ${template.id}`);
}

seedDefaultTemplate().catch(console.error);
