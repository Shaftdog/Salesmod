/**
 * Job Task Planner
 * Generates incremental batches of tasks for jobs
 * Expands high-level tasks into multiple kanban cards (1:many)
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  Job,
  JobTask,
  JobParams,
  TaskKind,
  DraftEmailTaskInput,
} from '@/types/jobs';

// ============================================================================
// EMAIL FORMATTING
// ============================================================================

/**
 * Format email body with proper HTML
 * Converts plain text with line breaks into proper HTML paragraphs and lists
 */
function formatEmailBody(body: string): string {
  if (!body) return body;
  
  // If already has substantial HTML tags, return as-is
  if (body.includes('<p>') && body.includes('</p>')) {
    return body;
  }
  
  // Detect bullet lists (• or - or *)
  const hasBulletList = /^[\s]*[•\-\*]\s+/m.test(body);
  
  if (hasBulletList) {
    const lines = body.split(/\n/);
    let result = '';
    let inList = false;
    let currentParagraph = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^[•\-\*]\s+/.test(trimmed)) {
        if (currentParagraph) {
          result += `<p>${currentParagraph.trim()}</p>`;
          currentParagraph = '';
        }
        if (!inList) {
          result += '<ul>';
          inList = true;
        }
        const item = trimmed.replace(/^[•\-\*]\s+/, '');
        result += `<li>${item}</li>`;
      } else if (trimmed) {
        if (inList) {
          result += '</ul>';
          inList = false;
        }
        currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
      } else if (currentParagraph && !inList) {
        // Empty line - end paragraph
        result += `<p>${currentParagraph.trim()}</p>`;
        currentParagraph = '';
      }
    });
    
    if (currentParagraph) {
      result += `<p>${currentParagraph.trim()}</p>`;
    }
    if (inList) result += '</ul>';
    return result;
  }
  
  // No lists - format as paragraphs
  // Split by double line breaks
  const paragraphs = body.split(/\n\n+/);
  if (paragraphs.length > 1) {
    return paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p.replace(/\n/g, ' ')}</p>`)
      .join('');
  }
  
  // Single paragraph - just wrap it
  return `<p>${body.trim()}</p>`;
}

// ============================================================================
// TYPES
// ============================================================================

interface PlanNextBatchResult {
  tasks: Array<Omit<JobTask, 'id' | 'created_at' | 'started_at' | 'finished_at' | 'error_message' | 'retry_count'>>;
  batch_number: number;
}

interface ExpandTaskResult {
  cards: Array<{
    job_id: string;
    task_id: number | null;
    type: string;
    title: string;
    description: string | null;
    rationale: string;
    priority: string;
    state: string;
    action_payload: Record<string, any>;
    client_id: string | null;
    contact_id: string | null;
  }>;
}

interface TargetContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  client_id: string;
  company_name: string;
}

// ============================================================================
// MAIN PLANNER FUNCTIONS
// ============================================================================

/**
 * Plan the next batch of tasks for a job
 * Called by the runner to generate incremental work
 */
export async function planNextBatch(
  job: Job,
  currentBatch: number = 0
): Promise<PlanNextBatchResult> {
  const params = job.params;
  const nextBatch = currentBatch + 1;
  const tasks: PlanNextBatchResult['tasks'] = [];

  const templateKeys = Object.keys(params.templates || {});
  if (templateKeys.length === 0) {
    return { tasks: [], batch_number: nextBatch };
  }

  // Sort template keys by day number (e.g., "Day 0", "Day 4", "Day 10", "Day 21")
  const sortedTemplateKeys = templateKeys.sort((a, b) => {
    const dayA = parseInt(a.match(/Day (\d+)/)?.[1] || '999', 10);
    const dayB = parseInt(b.match(/Day (\d+)/)?.[1] || '999', 10);
    return dayA - dayB;
  });

  let templateName: string;
  let dayIndex: number;

  // BULK MODE: Process all contacts with the same template, ignoring cadence
  if (params.bulk_mode) {
    // Always use the first template (typically "Day 0")
    templateName = sortedTemplateKeys[0];
    console.log(`[planNextBatch] BULK MODE - Batch ${nextBatch}: Using template "${templateName}"`);

    // We'll continue until getTargetContacts returns 0 contacts
    // (which happens when all contacts have been processed)
  }
  // CADENCE MODE: Process contacts on different days with different templates
  else {
    const cadence = params.cadence;
    if (!cadence) {
      // No cadence defined, return empty
      return { tasks: [], batch_number: nextBatch };
    }

    // Calculate which day we should be processing based on batch
    const cadenceDays = getCadenceDays(cadence);
    dayIndex = currentBatch < cadenceDays.length ? currentBatch : -1;

    if (dayIndex === -1) {
      // No more cadence steps
      return { tasks: [], batch_number: nextBatch };
    }

    // Select template for this batch based on cadence day
    templateName = sortedTemplateKeys[dayIndex % sortedTemplateKeys.length];
    console.log(`[planNextBatch] CADENCE MODE - Batch ${nextBatch}: Using template "${templateName}" (dayIndex: ${dayIndex}, available: ${sortedTemplateKeys.join(', ')})`);
  }

  // Create draft_email task
  tasks.push({
    job_id: job.id,
    step: 0,
    batch: nextBatch,
    kind: 'draft_email',
    input: {
      target_type: 'contact_group',
      target_filter: params.target_filter || {},
      contact_ids: params.target_contact_ids || [],
      template: templateName,
      variables: {},
      job_id: job.id, // Pass job_id to filter out already-processed contacts
    } as DraftEmailTaskInput,
    output: null,
    status: 'pending',
  });

  // Create follow-up send_email task
  tasks.push({
    job_id: job.id,
    step: 1,
    batch: nextBatch,
    kind: 'send_email',
    input: {
      depends_on_step: 0, // Wait for draft to be approved
    },
    output: null,
    status: 'pending',
  });

  // Add portal checks if enabled
  if (params.portal_checks && params.portal_urls) {
    tasks.push({
      job_id: job.id,
      step: 2,
      batch: nextBatch,
      kind: 'check_portal',
      input: {
        portal_urls: params.portal_urls,
      },
      output: null,
      status: 'pending',
    });
  }

  return { tasks, batch_number: nextBatch };
}

/**
 * Expand a high-level task into multiple kanban cards
 * One task (e.g., "email all AMCs") creates multiple cards (one per contact)
 */
export async function expandTaskToCards(
  task: JobTask,
  job: Job
): Promise<ExpandTaskResult> {
  const supabase = createServiceRoleClient();
  const params = job.params;

  switch (task.kind) {
    case 'draft_email':
      return await expandDraftEmailTask(task, job, params, supabase);

    case 'send_email':
      return await expandSendEmailTask(task, job, supabase);

    case 'create_task':
      return await expandCreateTaskTask(task, job, params, supabase);

    case 'check_portal':
      return await expandCheckPortalTask(task, job, params, supabase);

    default:
      // Other task kinds can be expanded as needed
      return { cards: [] };
  }
}

// ============================================================================
// TASK EXPANSION FUNCTIONS
// ============================================================================

/**
 * Expand draft_email task into multiple email cards (one per contact)
 */
async function expandDraftEmailTask(
  task: JobTask,
  job: Job,
  params: JobParams,
  supabase: any
): Promise<ExpandTaskResult> {
  const input = task.input as DraftEmailTaskInput;

  console.log(`[expandDraftEmailTask] Task ${task.id}: Getting target contacts...`);
  console.log(`[expandDraftEmailTask] Input:`, JSON.stringify(input));

  // Get target contacts
  const targets = await getTargetContacts(input, params, supabase, job.org_id);
  
  console.log(`[expandDraftEmailTask] Found ${targets.length} target contacts`);

  if (targets.length === 0) {
    console.error(`[expandDraftEmailTask] No target contacts found!`);
    return { cards: [] };
  }

  // Get email template
  const template = params.templates?.[input.template];
  if (!template) {
    console.error(`[expandDraftEmailTask] Template ${input.template} not found in job params`);
    console.error(`[expandDraftEmailTask] Available templates:`, Object.keys(params.templates || {}));
    return { cards: [] };
  }
  
  console.log(`[expandDraftEmailTask] Using template: ${input.template}`);

  // Create one card per contact
  const cards = targets.map((contact) => {
    // Replace variables in template
    const subject = replaceVariables(template.subject, {
      first_name: contact.first_name,
      last_name: contact.last_name,
      company_name: contact.company_name,
      ...input.variables,
    });

    let body = replaceVariables(template.body, {
      first_name: contact.first_name,
      last_name: contact.last_name,
      company_name: contact.company_name,
      ...input.variables,
    });
    
    // Format body with proper HTML paragraphs and lists
    body = formatEmailBody(body);

    // Determine card state based on job settings:
    // - edit_mode: Cards created in "in_review" state (allows editing before approval)
    // - review_mode: Cards created in "suggested" state (requires approval)
    // - auto_approve: Cards go directly to "approved" state
    let cardState: string;
    if (params.edit_mode) {
      cardState = 'in_review';
    } else if (params.review_mode) {
      cardState = 'suggested';
    } else {
      cardState = 'approved';
    }

    return {
      job_id: job.id,
      task_id: task.id,
      type: 'send_email',
      title: `Email: ${contact.first_name} ${contact.last_name} - ${subject.substring(0, 50)}`,
      description: `Send email to ${contact.email}`,
      rationale: `Job "${job.name}" - ${input.template} template (batch ${task.batch})`,
      priority: 'medium',
      state: cardState,
      action_payload: {
        to: contact.email,
        subject,
        body,
        from_name: 'Your Team', // TODO: Get from settings
        from_email: process.env.RESEND_FROM_EMAIL || '',
      },
      client_id: contact.client_id,
      contact_id: contact.id,
    };
  });

  return { cards };
}

/**
 * Expand send_email task (executes previously created email cards)
 */
async function expandSendEmailTask(
  task: JobTask,
  job: Job,
  supabase: any
): Promise<ExpandTaskResult> {
  // This task doesn't create new cards, it triggers execution of existing ones
  // The executor will handle this
  return { cards: [] };
}

/**
 * Expand create_task task into task cards
 */
async function expandCreateTaskTask(
  task: JobTask,
  job: Job,
  params: JobParams,
  supabase: any
): Promise<ExpandTaskResult> {
  const input = task.input;

  // Get target contacts
  const targets = await getTargetContacts(input, params, supabase, job.org_id);

  // Determine card state based on job settings
  let cardState: string;
  if (params.edit_mode) {
    cardState = 'in_review';
  } else if (params.review_mode) {
    cardState = 'suggested';
  } else {
    cardState = 'approved';
  }

  const cards = targets.map((contact) => ({
    job_id: job.id,
    task_id: task.id,
    type: 'create_task',
    title: `Follow-up: ${contact.first_name} ${contact.last_name}`,
    description: input.task_description || 'Follow-up task',
    rationale: `Job "${job.name}" - automated follow-up (batch ${task.batch})`,
    priority: 'medium',
    state: cardState,
    action_payload: {
      title: input.task_title || `Follow up with ${contact.first_name}`,
      description: input.task_description || '',
      due_date: input.due_date || null,
    },
    client_id: contact.client_id,
    contact_id: contact.id,
  }));

  return { cards };
}

/**
 * Expand check_portal task into portal check cards
 */
async function expandCheckPortalTask(
  task: JobTask,
  job: Job,
  params: JobParams,
  supabase: any
): Promise<ExpandTaskResult> {
  const portalUrls = params.portal_urls || {};
  const companyIds = Object.keys(portalUrls);

  if (companyIds.length === 0) {
    return { cards: [] };
  }

  // Fetch client info for each company
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, company_name')
    .in('id', companyIds);

  if (error || !clients) {
    console.error('Failed to fetch clients for portal checks:', error);
    return { cards: [] };
  }

  // Determine card state based on job settings
  let cardState: string;
  if (params.edit_mode) {
    cardState = 'in_review';
  } else if (params.review_mode) {
    cardState = 'suggested';
  } else {
    cardState = 'approved';
  }

  const cards = clients.map((client: any) => ({
    job_id: job.id,
    task_id: task.id,
    type: 'research', // Use research type for portal checks
    title: `Check Portal: ${client.company_name}`,
    description: `Verify portal access at ${portalUrls[client.id]}`,
    rationale: `Job "${job.name}" - portal verification (batch ${task.batch})`,
    priority: 'low',
    state: cardState,
    action_payload: {
      type: 'portal_check',
      portal_url: portalUrls[client.id],
      company_id: client.id,
    },
    client_id: client.id,
    contact_id: null,
  }));

  return { cards };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get target contacts based on filter criteria
 */
async function getTargetContacts(
  input: any,
  params: JobParams,
  supabase: any,
  orgId: string
): Promise<TargetContact[]> {
  console.log(`[getTargetContacts] Called with input:`, JSON.stringify(input));
  console.log(`[getTargetContacts] Params filter:`, JSON.stringify(params.target_filter));
  
  // If explicit contact IDs provided, use those
  if (input.contact_ids && input.contact_ids.length > 0) {
    console.log(`[getTargetContacts] Using explicit contact_ids: ${input.contact_ids.length} IDs`);
    
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        client_id,
        clients!contacts_client_id_fkey!inner(company_name)
      `)
      .in('id', input.contact_ids)
      .not('email', 'is', null);

    // TODO: Add org_id filter after migration is complete
    // .eq('clients.org_id', orgId)

    if (error) {
      console.error('[getTargetContacts] Failed to fetch contacts by IDs:', error);
      return [];
    }

    return (contacts || []).map((c: any) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      client_id: c.client_id,
      company_name: c.clients.company_name,
    }));
  }

  // Otherwise, use target_filter
  const filter = params.target_filter || input.target_filter;
  console.log(`[getTargetContacts] Using target_filter:`, JSON.stringify(filter));

  if (!filter) {
    console.error('[getTargetContacts] No filter provided!');
    return [];
  }

  // Check target type - default to 'contacts' for backwards compatibility
  const targetType = params.target_type || 'contacts';
  console.log(`[getTargetContacts] Target type: ${targetType}`);

  // If targeting CLIENTS, query clients table directly
  if (targetType === 'clients') {
    console.log(`[getTargetContacts] Querying clients table`);

    let clientQuery = supabase
      .from('clients')
      .select('id, company_name, client_type, is_active, email, primary_contact')
      .not('email', 'is', null);

    // TODO: Add org_id filter after migration is complete
    // .eq('org_id', orgId)

    // Apply filters
    if (filter.client_type) {
      console.log(`[getTargetContacts] Filtering by client_type: ${filter.client_type}`);
      clientQuery = clientQuery.eq('client_type', filter.client_type);
    }
    if (filter.is_active !== undefined) {
      console.log(`[getTargetContacts] Filtering by is_active: ${filter.is_active}`);
      clientQuery = clientQuery.eq('is_active', filter.is_active);
    }
    if (filter.active !== undefined) {
      console.log(`[getTargetContacts] Filtering by active (compat): ${filter.active}`);
      clientQuery = clientQuery.eq('is_active', filter.active);
    }

    // Exclude clients that already have cards
    if (input.job_id) {
      const { data: existingCards } = await supabase
        .from('kanban_cards')
        .select('client_id')
        .eq('job_id', input.job_id)
        .not('client_id', 'is', null);

      if (existingCards && existingCards.length > 0) {
        const excludedClientIds = existingCards.map((card: any) => card.client_id).filter(Boolean);
        console.log(`[getTargetContacts] Excluding ${excludedClientIds.length} clients that already have cards`);

        if (excludedClientIds.length > 0) {
          clientQuery = clientQuery.not('id', 'in', `(${excludedClientIds.join(',')})`);
        }
      }
    }

    const batchSize = params.batch_size || 10;
    clientQuery = clientQuery.limit(batchSize);

    const { data: clients, error: clientError } = await clientQuery;

    if (clientError) {
      console.error('[getTargetContacts] Failed to fetch clients:', clientError);
      return [];
    }

    console.log(`[getTargetContacts] Found ${clients?.length || 0} clients`);

    // Convert clients to TargetContact format (using company email/name)
    return (clients || []).map((client: any) => ({
      id: client.id, // Using client_id as the "contact" id for client-level targeting
      first_name: client.primary_contact || client.company_name, // Use company name as first name
      last_name: '', // Empty last name for company targeting
      email: client.email,
      client_id: client.id,
      company_name: client.company_name,
    }));
  }

  // Otherwise, target CONTACTS (default behavior)
  console.log(`[getTargetContacts] Querying contacts table`);

  let query = supabase
    .from('contacts')
    .select(`
      id,
      first_name,
      last_name,
      email,
      primary_role_code,
      client_id,
      clients!contacts_client_id_fkey!inner(
        id,
        company_name,
        client_type,
        is_active
      )
    `)
    .not('email', 'is', null);

  // TODO: Add org_id filter after migration is complete
  // .eq('clients.org_id', orgId)

  // Apply filters
  if (filter.client_type) {
    console.log(`[getTargetContacts] Filtering by client_type: ${filter.client_type}`);
    query = query.eq('clients.client_type', filter.client_type);
  }
  if (filter.primary_role_code) {
    console.log(`[getTargetContacts] Filtering by contact primary_role_code: ${filter.primary_role_code}`);
    // Filter on the CONTACT's primary_role_code, not the client's
    query = query.eq('primary_role_code', filter.primary_role_code);
  }
  if (filter.is_active !== undefined) {
    console.log(`[getTargetContacts] Filtering by client is_active: ${filter.is_active}`);
    query = query.eq('clients.is_active', filter.is_active);
  }

  // Backwards compatibility
  if (filter.active !== undefined) {
    console.log(`[getTargetContacts] Filtering by active (compat): ${filter.active}`);
    query = query.eq('clients.is_active', filter.active);
  }

  // Limit to batch size
  const batchSize = params.batch_size || 10;

  console.log(`[getTargetContacts] Executing query with batch size: ${batchSize}`);

  // If job_id is provided, exclude contacts that already have cards from this job
  let excludedContactIds: string[] = [];
  if (input.job_id) {
    const { data: existingCards } = await supabase
      .from('kanban_cards')
      .select('contact_id')
      .eq('job_id', input.job_id)
      .not('contact_id', 'is', null);

    if (existingCards && existingCards.length > 0) {
      excludedContactIds = existingCards.map((card: any) => card.contact_id).filter(Boolean);
      console.log(`[getTargetContacts] Excluding ${excludedContactIds.length} contacts that already have cards from this job`);

      if (excludedContactIds.length > 0) {
        query = query.not('id', 'in', `(${excludedContactIds.join(',')})`);
      }
    }
  }

  query = query.limit(batchSize);

  const { data: contacts, error } = await query;

  if (error) {
    console.error('[getTargetContacts] Failed to fetch contacts with filter:', error);
    console.error('[getTargetContacts] Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return [];
  }

  console.log(`[getTargetContacts] Query returned ${contacts?.length || 0} contacts (${excludedContactIds.length} excluded)`);

  // Fetch avoidance rules from agent_memories
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user?.id;

  let avoidanceRules: any[] = [];
  if (orgId) {
    const { data: memories } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('org_id', orgId)
      .or('scope.eq.card_feedback,key.ilike.%rejection_%,key.ilike.%deletion_%')
      .gte('importance', 0.7); // Only high-importance feedback

    if (memories) {
      avoidanceRules = memories
        .filter((m: any) => m.content?.rule || m.content?.pattern)
        .map((m: any) => ({
          rule: m.content.rule,
          pattern: m.content.pattern,
          reason: m.content.reason,
        }));

      if (avoidanceRules.length > 0) {
        console.log(`[getTargetContacts] Found ${avoidanceRules.length} avoidance rules to apply`);
      }
    }
  }

  // Filter contacts based on avoidance rules
  const mappedContacts = (contacts || []).map((c: any) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    client_id: c.client_id,
    company_name: c.clients.company_name,
  }));

  if (avoidanceRules.length === 0) {
    return mappedContacts;
  }

  // Apply avoidance rules
  const filteredContacts = mappedContacts.filter((contact: any) => {
    for (const rule of avoidanceRules) {
      // Check if contact matches any avoidance pattern
      if (rule.pattern) {
        try {
          const regex = new RegExp(rule.pattern, 'i');

          // Check first name
          if (contact.first_name && regex.test(contact.first_name)) {
            console.log(`[getTargetContacts] Filtered out contact ${contact.first_name} ${contact.last_name} - matches pattern: ${rule.pattern} (${rule.reason})`);
            return false;
          }

          // Check last name
          if (contact.last_name && regex.test(contact.last_name)) {
            console.log(`[getTargetContacts] Filtered out contact ${contact.first_name} ${contact.last_name} - matches pattern: ${rule.pattern} (${rule.reason})`);
            return false;
          }

          // Check full name
          const fullName = `${contact.first_name} ${contact.last_name}`;
          if (regex.test(fullName)) {
            console.log(`[getTargetContacts] Filtered out contact ${fullName} - matches pattern: ${rule.pattern} (${rule.reason})`);
            return false;
          }
        } catch (e) {
          // Invalid regex, skip this rule
          console.error(`[getTargetContacts] Invalid regex pattern: ${rule.pattern}`);
        }
      }
    }
    return true; // Keep contact
  });

  console.log(`[getTargetContacts] After applying avoidance rules: ${filteredContacts.length}/${mappedContacts.length} contacts remaining`);

  return filteredContacts;
}

/**
 * Escape HTML entities to prevent injection
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Replace template variables with HTML-escaped values
 */
function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    // Escape HTML entities to prevent injection attacks
    const escapedValue = escapeHtml(value || '');
    result = result.replace(regex, escapedValue);
  });

  return result;
}

/**
 * Extract cadence days from cadence config
 */
function getCadenceDays(cadence: any): number[] {
  const days: number[] = [];

  if (cadence.day0) days.push(0);
  if (cadence.day4) days.push(4);
  if (cadence.day10) days.push(10);
  if (cadence.day21) days.push(21);
  if (cadence.custom_days) {
    days.push(...cadence.custom_days);
  }

  return days.sort((a, b) => a - b);
}
