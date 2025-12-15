/**
 * Inspect the Thanksgiving/End of Month job
 * Run with: node scripts/inspect-thanksgiving-job.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectJob() {
  console.log('='.repeat(60));
  console.log('INSPECTING THANKSGIVING/END OF MONTH JOB');
  console.log('='.repeat(60));
  console.log();

  // Find jobs with "Thanksgiving" or "End of" in the name
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .or('name.ilike.%Thanksgiving%,name.ilike.%End of%')
    .order('created_at', { ascending: false });

  if (jobsError) {
    console.error('Error fetching jobs:', jobsError);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('No jobs found matching "Thanksgiving" or "End of"');
    console.log();

    // List all jobs
    const { data: allJobs } = await supabase
      .from('jobs')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('Recent jobs:');
    console.log('-'.repeat(40));
    allJobs?.forEach(j => {
      console.log(`- ${j.name} [${j.status}] (${j.id})`);
    });
    return;
  }

  for (const job of jobs) {
    console.log('JOB DETAILS');
    console.log('-'.repeat(40));
    console.log(`Name: ${job.name}`);
    console.log(`ID: ${job.id}`);
    console.log(`Status: ${job.status}`);
    console.log(`Description: ${job.description || 'None'}`);
    console.log(`Created: ${job.created_at}`);
    console.log(`Started: ${job.started_at || 'Never'}`);
    console.log(`Last Run: ${job.last_run_at || 'Never'}`);
    console.log(`Finished: ${job.finished_at || 'Not finished'}`);
    console.log();

    // Check job params
    console.log('JOB PARAMETERS');
    console.log('-'.repeat(40));
    const params = job.params;
    console.log(`Target Type: ${params.target_type || 'contacts'}`);
    console.log(`Target Group: ${params.target_group || 'Unknown'}`);
    console.log(`Batch Size: ${params.batch_size || 10}`);
    console.log(`Bulk Mode: ${params.bulk_mode || false}`);
    console.log(`Review Mode: ${params.review_mode ?? true}`);
    console.log(`Edit Mode: ${params.edit_mode || false}`);
    console.log();

    // Check templates
    console.log('TEMPLATES');
    console.log('-'.repeat(40));
    const templates = params.templates || {};
    const templateKeys = Object.keys(templates);
    if (templateKeys.length === 0) {
      console.log('⚠️  NO TEMPLATES CONFIGURED - This will cause 0 cards!');
    } else {
      templateKeys.forEach(key => {
        const template = templates[key];
        console.log(`- ${key}:`);
        console.log(`    Subject: ${template.subject}`);
        console.log(`    Body length: ${template.body?.length || 0} chars`);
      });
    }
    console.log();

    // Check cadence
    console.log('CADENCE CONFIGURATION');
    console.log('-'.repeat(40));
    const cadence = params.cadence;
    if (!cadence) {
      console.log('No cadence configured - will use bulk mode or fail');
    } else {
      const days = [];
      if (cadence.day0) days.push('Day 0');
      if (cadence.day4) days.push('Day 4');
      if (cadence.day10) days.push('Day 10');
      if (cadence.day21) days.push('Day 21');
      if (cadence.custom_days?.length) days.push(...cadence.custom_days.map(d => `Day ${d}`));
      console.log(`Active days: ${days.join(', ') || 'None'}`);
    }
    console.log();

    // Check target filter
    console.log('TARGET FILTER');
    console.log('-'.repeat(40));
    const filter = params.target_filter;
    if (!filter) {
      console.log('No target filter configured');
      if (!params.target_contact_ids?.length) {
        console.log('⚠️  No target_contact_ids either - no contacts will be found!');
      }
    } else {
      console.log(`Client Type: ${filter.client_type || 'Any'}`);
      console.log(`Is Active: ${filter.is_active ?? filter.active ?? 'Any'}`);
      console.log(`Target Role Codes: ${filter.target_role_codes?.join(', ') || 'Any'}`);
      console.log(`State: ${filter.state || 'Any'}`);
    }
    console.log();

    // Check tasks
    console.log('RECENT TASKS');
    console.log('-'.repeat(40));
    const { data: tasks } = await supabase
      .from('job_tasks')
      .select('*')
      .eq('job_id', job.id)
      .order('batch', { ascending: false })
      .order('step', { ascending: true })
      .limit(10);

    if (!tasks || tasks.length === 0) {
      console.log('No tasks created yet');
    } else {
      tasks.forEach(t => {
        console.log(`- Batch ${t.batch}, Step ${t.step}: ${t.kind} [${t.status}]`);
        if (t.error_message) {
          console.log(`    Error: ${t.error_message}`);
        }
        if (t.output?.cards_created !== undefined) {
          console.log(`    Cards created: ${t.output.cards_created}`);
        }
      });
    }
    console.log();

    // Check cards
    console.log('CARDS CREATED BY THIS JOB');
    console.log('-'.repeat(40));
    const { data: cards, error: cardsError } = await supabase
      .from('kanban_cards')
      .select('id, title, state, created_at')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (cardsError) {
      console.log('Error fetching cards:', cardsError.message);
    } else if (!cards || cards.length === 0) {
      console.log('⚠️  NO CARDS CREATED');
    } else {
      cards.forEach(c => {
        console.log(`- ${c.title}`);
        console.log(`    State: ${c.state}, Created: ${c.created_at}`);
      });

      // Count total cards
      const { count } = await supabase
        .from('kanban_cards')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', job.id);
      console.log();
      console.log(`Total cards: ${count}`);
    }
    console.log();

    // Check if there are contacts that match the filter
    if (filter) {
      console.log('MATCHING CONTACTS');
      console.log('-'.repeat(40));

      let query = supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          clients!contacts_client_id_fkey!inner(
            id,
            company_name,
            client_type,
            is_active,
            org_id
          )
        `, { count: 'exact' })
        .eq('clients.org_id', job.org_id)
        .not('email', 'is', null);

      if (filter.client_type) {
        query = query.eq('clients.client_type', filter.client_type);
      }
      if (filter.is_active !== undefined) {
        query = query.eq('clients.is_active', filter.is_active);
      }
      if (filter.target_role_codes?.length) {
        query = query.in('primary_role_code', filter.target_role_codes);
      }

      const { data: contacts, count, error: contactsError } = await query.limit(5);

      if (contactsError) {
        console.log('Error fetching contacts:', contactsError.message);
      } else {
        console.log(`Total matching contacts: ${count}`);
        if (contacts && contacts.length > 0) {
          console.log('Sample contacts:');
          contacts.forEach(c => {
            console.log(`- ${c.first_name} ${c.last_name} <${c.email}> (${c.clients.company_name})`);
          });
        }
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log();
  }
}

inspectJob().catch(console.error);
