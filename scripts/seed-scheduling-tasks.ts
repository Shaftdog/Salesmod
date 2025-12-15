/**
 * Seed Scheduling Tasks to Task Library
 *
 * Run with: npx tsx scripts/seed-scheduling-tasks.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TaskWithSubtasks {
  stage: string;
  title: string;
  description?: string;
  default_role: string;
  estimated_minutes: number;
  is_required: boolean;
  sort_order: number;
  subtasks: {
    title: string;
    sort_order: number;
  }[];
}

const schedulingTasks: TaskWithSubtasks[] = [
  {
    stage: 'SCHEDULING',
    title: '1ST ATTEMPT (WITHIN 2 HRS OF ACCEPTANCE)',
    description: 'First contact attempt to schedule inspection - must be made within 2 hours of order acceptance',
    default_role: 'appraiser',
    estimated_minutes: 15,
    is_required: true,
    sort_order: 0,
    subtasks: [
      { title: '1ST ATTEMPT:', sort_order: 0 },
      { title: 'Call Borrower Contact', sort_order: 1 },
      { title: 'Text Property Contact', sort_order: 2 },
      { title: 'Email Property Contact', sort_order: 3 },
      { title: 'Notify Client of Attempt', sort_order: 4 },
    ],
  },
  {
    stage: 'SCHEDULING',
    title: '2ND ATTEMPT (WITHIN 12 HRS OF 1ST ATTEMPT)',
    description: 'Second contact attempt - must be made within 12 hours of first attempt',
    default_role: 'appraiser',
    estimated_minutes: 15,
    is_required: true,
    sort_order: 1,
    subtasks: [
      { title: '2ND ATTEMPT', sort_order: 0 },
      { title: 'Call Borrower Contact', sort_order: 1 },
      { title: 'Text Property Contact', sort_order: 2 },
      { title: 'Email Property Contact', sort_order: 3 },
      { title: 'Notify Client of Attempt and request additional contact information', sort_order: 4 },
    ],
  },
  {
    stage: 'SCHEDULING',
    title: '3RD ATTEMPT (WITHIN 12 HRS OF 2ND ATTEMPT)',
    description: 'Third contact attempt - must be made within 12 hours of second attempt',
    default_role: 'appraiser',
    estimated_minutes: 15,
    is_required: true,
    sort_order: 2,
    subtasks: [
      { title: '3RD ATTEMPT', sort_order: 0 },
      { title: 'Call Borrower Contact', sort_order: 1 },
      { title: 'Text Property Contact', sort_order: 2 },
      { title: 'Email Property Contact', sort_order: 3 },
      { title: 'Notify Client of Attempt', sort_order: 4 },
    ],
  },
  {
    stage: 'SCHEDULING',
    title: '4TH ATTEMPT (WITHIN 12 HRS OF 3RD ATTEMPT)',
    description: 'Fourth contact attempt - must be made within 12 hours of third attempt',
    default_role: 'appraiser',
    estimated_minutes: 15,
    is_required: true,
    sort_order: 3,
    subtasks: [
      { title: '4TH ATTEMPT', sort_order: 0 },
      { title: 'Call Borrower Contact', sort_order: 1 },
      { title: 'Text Property Contact', sort_order: 2 },
      { title: 'Email Property Contact', sort_order: 3 },
      { title: 'Notify Client of Attempt and request additional contact information', sort_order: 4 },
    ],
  },
];

const scheduledTasks: TaskWithSubtasks[] = [
  {
    stage: 'SCHEDULED',
    title: 'Notify Client of appointment day and time',
    description: 'Inform the client when the inspection has been scheduled',
    default_role: 'appraiser',
    estimated_minutes: 5,
    is_required: true,
    sort_order: 0,
    subtasks: [],
  },
  {
    stage: 'SCHEDULED',
    title: 'Post Completed Appointment Questionnaire into Calendar Task & Comment Section',
    description: 'Document appointment details from questionnaire in calendar',
    default_role: 'appraiser',
    estimated_minutes: 10,
    is_required: true,
    sort_order: 1,
    subtasks: [],
  },
  {
    stage: 'SCHEDULED',
    title: 'MAKE SURE ACCESS INSTRUCTIONS ARE SPECIFIC',
    description: 'Verify that property access instructions are clear and detailed',
    default_role: 'appraiser',
    estimated_minutes: 5,
    is_required: true,
    sort_order: 2,
    subtasks: [],
  },
  {
    stage: 'SCHEDULED',
    title: 'MAKE SURE TO PUT DRIVING TIME TO SUBSEQUENT APPOINTMENTS (IF AVAILABLE)',
    description: 'Add travel time between appointments to calendar',
    default_role: 'appraiser',
    estimated_minutes: 5,
    is_required: false,
    sort_order: 3,
    subtasks: [],
  },
  {
    stage: 'SCHEDULED',
    title: 'MAKE SURE THAT THE ADDRESS FOR THE APPOINTMENT IS IN THE LOCATION SECTION OF THE CALENDAR APPOINTMENT',
    description: 'Ensure property address is in the calendar location field for navigation',
    default_role: 'appraiser',
    estimated_minutes: 2,
    is_required: true,
    sort_order: 4,
    subtasks: [],
  },
];

async function seedTasks() {
  console.log('Starting to seed scheduling tasks...\n');

  // Get the org_id from profiles (first profile)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();

  if (profileError || !profileData) {
    console.error('Could not find profile:', profileError);
    process.exit(1);
  }

  const org_id = profileData.id;
  console.log(`Using org_id (profile): ${org_id}\n`);

  const allTasks = [...schedulingTasks, ...scheduledTasks];

  for (const task of allTasks) {
    console.log(`Creating task: ${task.title}`);

    // Insert the main task
    const { data: taskData, error: taskError } = await supabase
      .from('task_library')
      .insert({
        org_id,
        stage: task.stage,
        title: task.title,
        description: task.description,
        default_role: task.default_role,
        estimated_minutes: task.estimated_minutes,
        is_required: task.is_required,
        sort_order: task.sort_order,
        is_active: true,
      })
      .select()
      .single();

    if (taskError) {
      console.error(`  Error creating task: ${taskError.message}`);
      continue;
    }

    console.log(`  Created task with ID: ${taskData.id}`);

    // Insert subtasks
    if (task.subtasks.length > 0) {
      for (const subtask of task.subtasks) {
        const { error: subtaskError } = await supabase
          .from('task_library_subtasks')
          .insert({
            library_task_id: taskData.id,
            title: subtask.title,
            default_role: task.default_role,
            estimated_minutes: 5,
            is_required: true,
            sort_order: subtask.sort_order,
          });

        if (subtaskError) {
          console.error(`    Error creating subtask "${subtask.title}": ${subtaskError.message}`);
        } else {
          console.log(`    Created subtask: ${subtask.title}`);
        }
      }
    }

    console.log('');
  }

  console.log('Done seeding scheduling tasks!');
}

seedTasks().catch(console.error);
