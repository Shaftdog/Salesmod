import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { searchRAG } from './rag';
import { calculateGoalProgress } from '@/hooks/use-goals';
import { searchWeb as webSearchFunction } from '../research/web-search';
import {
  executeComputerUseTask,
  researchCompetitorPricing,
  deepCompanyResearch,
  isComputerUseAvailable,
  getComputerUseStatus
} from './computer-use';

/**
 * Format email body with proper HTML
 * Converts plain text or poorly formatted text into proper HTML
 */
function formatEmailBody(body: string): string {
  if (!body) return body;
  
  // If already has substantial HTML tags, return as-is
  if (body.includes('<p>') && body.includes('</p>')) {
    return body;
  }
  
  // Step 1: Detect and format bullet/numbered lists with various patterns
  // Pattern 1: "1. Item" or "• Item" style
  const hasNumberedList = /\d+\.\s+[A-Z]/.test(body);
  const hasBulletList = /[•\-\*]\s+[A-Z]/.test(body);
  
  // Pattern 2: "First bullet point", "Second bullet point" style
  const hasWordedList = /(First|Second|Third|Fourth|Fifth)[\s\w]*:/gi.test(body);
  
  let formatted = body;
  
  // Convert "First bullet point:", "Second bullet point:" to proper list
  if (hasWordedList) {
    // Split on sentence patterns that indicate list items
    const listPattern = /((?:First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:[\s\S]*?)(?=(?:First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:|$)/gi;
    const listItems = body.match(listPattern);
    
    if (listItems && listItems.length > 1) {
      // Find intro text before the list
      const introMatch = body.match(/^([\s\S]*?)(?=First|Second|Third|Fourth|Fifth)/i);
      let result = '';
      
      if (introMatch && introMatch[1].trim()) {
        result += `<p>${introMatch[1].trim()}</p>`;
      }
      
      result += '<ol>';
      listItems.forEach(item => {
        const cleanItem = item.replace(/^(First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:\s*/i, '').trim();
        if (cleanItem) {
          result += `<li>${cleanItem}</li>`;
        }
      });
      result += '</ol>';
      
      // Find closing text after the list
      const lastItem = listItems[listItems.length - 1];
      const closingMatch = body.split(lastItem)[1];
      if (closingMatch && closingMatch.trim()) {
        result += `<p>${closingMatch.trim()}</p>`;
      }
      
      return result;
    }
  }
  
  // Convert numbered lists (1. 2. 3. etc.)
  if (hasNumberedList) {
    const lines = body.split(/\.\s+(?=\d+\.|\w)/);
    let result = '';
    let inList = false;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (/^\d+\./.test(trimmed)) {
        if (!inList) {
          result += '<ol>';
          inList = true;
        }
        const item = trimmed.replace(/^\d+\.\s*/, '');
        result += `<li>${item}</li>`;
      } else if (trimmed) {
        if (inList) {
          result += '</ol>';
          inList = false;
        }
        result += `<p>${trimmed}</p>`;
      }
    });
    
    if (inList) result += '</ol>';
    return result;
  }
  
  // Convert bullet lists (• or - or *)
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
      }
    });
    
    if (currentParagraph) {
      result += `<p>${currentParagraph.trim()}</p>`;
    }
    if (inList) result += '</ul>';
    return result;
  }
  
  // No lists detected - format as paragraphs
  // Split by double line breaks first
  const paragraphs = body.split(/\n\n+/);
  if (paragraphs.length > 1) {
    return paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p.replace(/\n/g, ' ')}</p>`)
      .join('');
  }
  
  // Split by single line breaks and group as sentences
  const sentences = body.split(/\.\s+/);
  if (sentences.length > 3) {
    // Group every 2-3 sentences into a paragraph
    let result = '<p>';
    sentences.forEach((sentence, idx) => {
      result += sentence.trim();
      if (!sentence.trim().endsWith('.')) result += '.';
      
      // Start new paragraph every 2-3 sentences
      if ((idx + 1) % 2 === 0 && idx < sentences.length - 1) {
        result += '</p><p>';
      } else if (idx < sentences.length - 1) {
        result += ' ';
      }
    });
    result += '</p>';
    return result;
  }
  
  // Single paragraph - just wrap it
  return `<p>${body}</p>`;
}

/**
 * Agent tools for conversational interaction
 */
export const agentTools = {
  /**
   * Search for clients
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  searchClients: tool({
    description: 'Search for clients by name, email, or other criteria. Use this when user asks about specific clients or wants to find clients.',
    parameters: z.object({
      query: z.string().min(1).describe('Search term (company name, email, etc.)'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ query }: { query: string }) => {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          company_name,
          primary_contact,
          email,
          phone,
          is_active,
          created_at
        `)
        .or(`company_name.ilike.%${query}%,primary_contact.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) {
        return { error: error.message };
      }

      return {
        clients: data || [],
        count: data?.length || 0,
      };
    },
  }),

  /**
   * Search for contacts
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  searchContacts: tool({
    description: 'Search for individual contacts by name, email, title, or other criteria. Use this when user asks about specific people or wants to find contacts.',
    parameters: z.object({
      query: z.string().min(1).describe('Search term (first name, last name, email, title, etc.)'),
      clientId: z.string().optional().describe('Optional: filter by specific client UUID'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ query, clientId }: { query: string; clientId?: string }) => {
      const supabase = await createClient();

      let queryBuilder = supabase
        .from('contacts')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          title,
          is_primary,
          client_id,
          client:clients!contacts_client_id_fkey(
            id,
            company_name
          ),
          created_at
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,title.ilike.%${query}%`)
        .limit(10);

      if (clientId) {
        queryBuilder = queryBuilder.eq('client_id', clientId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        return { error: error.message };
      }

      return {
        contacts: (data || []).map((contact: any) => ({
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          title: contact.title,
          isPrimary: contact.is_primary,
          client: contact.client ? {
            id: contact.client.id,
            name: contact.client.company_name,
          } : null,
          createdAt: contact.created_at,
        })),
        count: data?.length || 0,
      };
    },
  }),

  /**
   * Create a new contact
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  createContact: tool({
    description: 'Create a new contact for a client. Use this when user wants to add a person to their contact database. You MUST have the client UUID - use searchClients first if you only have a company name.',
    parameters: z.object({
      clientId: z.string().uuid().describe('Client UUID to associate contact with (use searchClients to get this if you only have company name)'),
      firstName: z.string().min(1).describe('Contact first name'),
      lastName: z.string().min(1).describe('Contact last name'),
      email: z.string().email().optional().describe('Contact email address'),
      phone: z.string().optional().describe('Office phone number'),
      mobile: z.string().optional().describe('Mobile phone number'),
      title: z.string().optional().describe('Job title'),
      department: z.string().optional().describe('Department'),
      isPrimary: z.boolean().optional().default(false).describe('Is this the primary contact?'),
      primaryRoleCode: z.string().optional().describe('Primary role code'),
      notes: z.string().optional().describe('Additional notes'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return { error: 'Not authenticated' };

      // Verify client exists and user has access to it
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('id', params.clientId)
        .single();

      if (clientError || !client) {
        return { error: 'Client not found or access denied' };
      }

      // Create contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          client_id: params.clientId,
          first_name: params.firstName,
          last_name: params.lastName,
          email: params.email || null,
          phone: params.phone || null,
          mobile: params.mobile || null,
          title: params.title || null,
          department: params.department || null,
          is_primary: params.isPrimary || false,
          primary_role_code: params.primaryRoleCode || null,
          notes: params.notes || null,
        })
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          mobile,
          title,
          department,
          notes,
          is_primary,
          primary_role_code,
          client:clients!contacts_client_id_fkey(
            id,
            company_name
          )
        `)
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        success: true,
        contact: {
          id: data.id,
          name: `${data.first_name} ${data.last_name}`,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          mobile: data.mobile,
          title: data.title,
          department: data.department,
          notes: data.notes,
          isPrimary: data.is_primary,
          primaryRoleCode: data.primary_role_code,
          client: {
            id: (data.client as any)?.id,
            name: (data.client as any)?.company_name,
          },
        },
      };
    },
  }),

  /**
   * Get current goals and progress
   */
  getGoals: tool({
    description: 'Get active goals and their current progress. Use this when user asks about goals, targets, or performance.',
    parameters: z.object({}),
    // @ts-ignore
    execute: async (): Promise<any> => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('is_active', true)
        .order('period_start', { ascending: false });

      if (goalsError) {
        return { error: goalsError.message };
      }

      // Get orders and deals for progress calculation
      const { data: orders } = await supabase.from('orders').select('*');
      const { data: deals } = await supabase.from('deals').select('*');
      const { data: clients } = await supabase.from('clients').select('*');

      const goalsWithProgress = (goals || []).map((goal: any) => {
        const goalObj = {
          id: goal.id,
          createdBy: goal.created_by || user.id,
          metricType: goal.metric_type,
          targetValue: parseFloat(goal.target_value),
          periodType: goal.period_type,
          periodStart: goal.period_start,
          periodEnd: goal.period_end,
          description: goal.description,
          isActive: goal.is_active,
          createdAt: goal.created_at,
          updatedAt: goal.updated_at,
        };

        const progress = calculateGoalProgress(goalObj, orders || [], deals || undefined, clients || undefined);
        
        return {
          ...goalObj,
          currentValue: progress.currentValue,
          progress: progress.progress,
          isOnTrack: progress.isOnTrack,
          daysRemaining: progress.daysRemaining,
          gap: goalObj.targetValue - progress.currentValue,
        };
      });

      return {
        goals: goalsWithProgress,
        summary: {
          total: goalsWithProgress.length,
          onTrack: goalsWithProgress.filter((g: any) => g.isOnTrack).length,
          behind: goalsWithProgress.filter((g: any) => !g.isOnTrack).length,
        },
      };
    },
  }),

  /**
   * Create an action card
   */
  createCard: tool({
    description: 'Create a new action card on the Kanban board. Use this when user requests to create a task, draft an email, or propose an action. For calls/meetings, create a task instead. ClientId is optional - omit it for general strategic cards. IMPORTANT: For send_email type, you MUST include emailDraft with to, subject, and body. The rationale explains WHY, the emailDraft.body is the ACTUAL email message.',
    parameters: z.object({
      type: z.enum(['send_email', 'create_task', 'create_deal', 'follow_up', 'research']),
      clientId: z.string().optional().describe('UUID of the client (optional - omit for general strategic cards)'),
      title: z.string().describe('Brief title for the action'),
      rationale: z.string().describe('Why this action is recommended (business reasoning, NOT the email content)'),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
      emailDraft: z.object({
        to: z.string().describe('Recipient email address (REQUIRED)'),
        subject: z.string().min(5).describe('Complete email subject line'),
        body: z.string().min(20).describe('Complete HTML email body (the actual message to send)'),
        replyTo: z.string().optional().describe('Reply-to email address (optional)'),
      }).optional().describe('REQUIRED for send_email type. Must include to, subject, and body fields.'),
      taskDetails: z.object({
        description: z.string(),
        dueDate: z.string().optional(),
      }).optional(),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      // Validate send_email actions have emailDraft
      if (params.type === 'send_email') {
        if (!params.emailDraft) {
          console.error('ERROR: createCard called with send_email but no emailDraft!', {
            title: params.title,
            rationale: params.rationale,
          });
          return { error: 'send_email actions must include emailDraft with subject, body, and to fields' };
        }
        if (!params.emailDraft.to || !params.emailDraft.to.includes('@')) {
          console.error('ERROR: emailDraft missing or invalid to field!', params.emailDraft);
          return { error: 'Email must include a valid to address' };
        }
        if (!params.emailDraft.subject || params.emailDraft.subject.length < 5) {
          return { error: 'Email subject must be at least 5 characters' };
        }
        if (!params.emailDraft.body || params.emailDraft.body.length < 20) {
          return { error: 'Email body must be at least 20 characters' };
        }
      }

      // Build action payload
      let actionPayload: any = {};
      if (params.emailDraft) {
        actionPayload = {
          ...params.emailDraft,
          body: formatEmailBody(params.emailDraft.body),
        };
        console.log('Creating card via chat with emailDraft:', {
          title: params.title,
          to: params.emailDraft.to,
          hasSubject: !!params.emailDraft.subject,
          hasBody: !!params.emailDraft.body,
        });
      } else if (params.taskDetails) {
        actionPayload = params.taskDetails;
      }

      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          org_id: user.id,
          client_id: params.clientId || null, // Allow null for general strategic cards
          type: params.type,
          title: params.title,
          rationale: params.rationale,
          priority: params.priority,
          state: 'suggested',
          action_payload: actionPayload,
          created_by: user.id, // User created via chat
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        success: true,
        card: {
          id: data.id,
          title: data.title,
          type: data.type,
          state: data.state,
        },
      };
    },
  }),

  /**
   * Delete action card(s)
   */
  deleteCard: tool({
    description: 'Delete one or more action cards from the Kanban board. Use this when user asks to delete, remove, or dismiss cards. Can match by ID, priority, type, or title.',
    parameters: z.object({
      cardId: z.string().optional().describe('Specific card UUID to delete'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('Delete all cards with this priority'),
      type: z.enum(['send_email', 'create_task', 'create_deal', 'follow_up', 'research']).optional().describe('Delete all cards of this type'),
      titleMatch: z.string().optional().describe('Delete cards with titles containing this text'),
      clientId: z.string().optional().describe('Delete cards associated with this client'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      // Get all cards first to match
      const { data: allCards, error: fetchError } = await supabase
        .from('kanban_cards')
        .select('id, title, type, priority, state, client_id, client:clients(company_name)')
        .eq('org_id', user.id);

      if (fetchError) {
        return { error: fetchError.message };
      }

      if (!allCards || allCards.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: 'No cards found to delete',
        };
      }

      // Filter cards based on criteria
      let cardsToDelete = allCards;

      if (params.cardId) {
        cardsToDelete = cardsToDelete.filter(c => c.id === params.cardId);
      }
      
      if (params.priority) {
        cardsToDelete = cardsToDelete.filter(c => c.priority === params.priority);
      }
      
      if (params.type) {
        cardsToDelete = cardsToDelete.filter(c => c.type === params.type);
      }
      
      if (params.titleMatch) {
        const searchTerm = params.titleMatch.toLowerCase();
        cardsToDelete = cardsToDelete.filter(c => 
          c.title.toLowerCase().includes(searchTerm)
        );
      }
      
      if (params.clientId) {
        cardsToDelete = cardsToDelete.filter(c => c.client_id === params.clientId);
      }

      if (cardsToDelete.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: 'No cards matched the criteria',
        };
      }

      // Delete the matched cards
      const cardIds = cardsToDelete.map(c => c.id);
      const { error: deleteError } = await supabase
        .from('kanban_cards')
        .delete()
        .in('id', cardIds)
        .eq('org_id', user.id);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return {
        success: true,
        deletedCount: cardsToDelete.length,
        deletedCards: cardsToDelete.map(c => ({
          id: c.id,
          title: c.title,
          type: c.type,
          priority: c.priority,
          client: (c.client as any)?.company_name || null,
        })),
      };
    },
  }),

  /**
   * Update an existing action card
   */
  updateCard: tool({
    description: 'Update an existing action card. Use this to change priority, state, title, or move it to a different stage.',
    parameters: z.object({
      cardId: z.string().describe('Card UUID to update'),
      state: z.enum(['suggested', 'in_review', 'approved', 'rejected', 'completed']).optional().describe('New state for the card'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('New priority'),
      title: z.string().optional().describe('New title'),
      rationale: z.string().optional().describe('Updated rationale'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const updates: any = {};
      if (params.state) updates.state = params.state;
      if (params.priority) updates.priority = params.priority;
      if (params.title) updates.title = params.title;
      if (params.rationale) updates.rationale = params.rationale;

      const { data, error } = await supabase
        .from('kanban_cards')
        .update(updates)
        .eq('id', params.cardId)
        .eq('org_id', user.id)
        .select('id, title, type, state, priority')
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        success: true,
        card: data,
      };
    },
  }),

  /**
   * Create a case
   */
  createCase: tool({
    description: 'Create a new support case or issue. Use this when user reports a problem, asks to track an issue, or needs help with something.',
    parameters: z.object({
      subject: z.string().describe('Brief subject/title of the case'),
      description: z.string().describe('Detailed description of the issue or request'),
      caseType: z.enum(['support', 'billing', 'quality_concern', 'complaint', 'service_request', 'technical', 'feedback', 'other']).describe('Type of case'),
      priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']).default('normal'),
      clientId: z.string().optional().describe('Associated client UUID'),
      contactId: z.string().optional().describe('Associated contact UUID'),
      orderId: z.string().optional().describe('Related order UUID'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      // Generate case number
      const { data: lastCase } = await supabase
        .from('cases')
        .select('case_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let caseNumber = 'CASE-0001';
      if (lastCase?.case_number) {
        const lastNum = parseInt(lastCase.case_number.split('-')[1] || '0');
        caseNumber = `CASE-${String(lastNum + 1).padStart(4, '0')}`;
      }

      const { data, error } = await supabase
        .from('cases')
        .insert({
          case_number: caseNumber,
          subject: params.subject,
          description: params.description,
          case_type: params.caseType,
          priority: params.priority,
          status: 'new',
          client_id: params.clientId || null,
          contact_id: params.contactId || null,
          order_id: params.orderId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        success: true,
        case: {
          id: data.id,
          caseNumber: data.case_number,
          subject: data.subject,
          status: data.status,
          priority: data.priority,
        },
      };
    },
  }),

  /**
   * Update a case
   */
  updateCase: tool({
    description: 'Update an existing case status, priority, or add resolution notes. Use this to manage case lifecycle.',
    parameters: z.object({
      caseId: z.string().describe('Case UUID or case number to update'),
      status: z.enum(['new', 'open', 'pending', 'in_progress', 'resolved', 'closed', 'reopened']).optional().describe('New status'),
      priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']).optional().describe('New priority'),
      resolution: z.string().optional().describe('Resolution notes (if resolving or closing)'),
      assignTo: z.string().optional().describe('User UUID to assign the case to'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const updates: any = {};
      if (params.status) updates.status = params.status;
      if (params.priority) updates.priority = params.priority;
      if (params.resolution) updates.resolution = params.resolution;
      if (params.assignTo) updates.assigned_to = params.assignTo;

      if (params.status === 'resolved' && !updates.resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }
      if (params.status === 'closed' && !updates.closed_at) {
        updates.closed_at = new Date().toISOString();
      }

      // Handle both UUID and case number
      let query = supabase.from('cases').update(updates);
      
      if (params.caseId.includes('CASE-')) {
        query = query.eq('case_number', params.caseId);
      } else {
        query = query.eq('id', params.caseId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        return { error: error.message };
      }

      return {
        success: true,
        case: {
          id: data.id,
          caseNumber: data.case_number,
          subject: data.subject,
          status: data.status,
          priority: data.priority,
        },
      };
    },
  }),

  /**
   * Delete a case
   */
  deleteCase: tool({
    description: 'Delete a case. Use this when a case was created by mistake or is no longer needed.',
    parameters: z.object({
      caseId: z.string().describe('Case UUID or case number to delete'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      // Get case info first
      let query = supabase.from('cases').select('id, case_number, subject');
      
      if (params.caseId.includes('CASE-')) {
        query = query.eq('case_number', params.caseId);
      } else {
        query = query.eq('id', params.caseId);
      }

      const { data: caseData, error: fetchError } = await query.single();

      if (fetchError || !caseData) {
        return { error: 'Case not found' };
      }

      // Delete the case
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseData.id);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return {
        success: true,
        deleted: {
          id: caseData.id,
          caseNumber: caseData.case_number,
          subject: caseData.subject,
        },
      };
    },
  }),

  /**
   * Log an activity
   */
  createActivity: tool({
    description: 'Log a completed activity like a call, email, meeting, or note. Use this to record interactions with clients.',
    parameters: z.object({
      activityType: z.enum(['call', 'email', 'meeting', 'note', 'task']).describe('Type of activity'),
      subject: z.string().describe('Brief subject of the activity'),
      description: z.string().optional().describe('Detailed notes about the activity'),
      clientId: z.string().optional().describe('Related client UUID'),
      contactId: z.string().optional().describe('Related contact UUID'),
      orderId: z.string().optional().describe('Related order UUID'),
      outcome: z.string().optional().describe('Outcome or result of the activity'),
      scheduledAt: z.string().optional().describe('When the activity occurred (ISO date string)'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('activities')
        .insert({
          activity_type: params.activityType,
          subject: params.subject,
          description: params.description || '',
          status: 'completed',
          client_id: params.clientId || null,
          contact_id: params.contactId || null,
          order_id: params.orderId || null,
          outcome: params.outcome || null,
          scheduled_at: params.scheduledAt || new Date().toISOString(),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return {
        success: true,
        activity: {
          id: data.id,
          type: data.activity_type,
          subject: data.subject,
          status: data.status,
        },
      };
    },
  }),

  /**
   * Delete a contact
   */
  deleteContact: tool({
    description: 'Delete a contact from the system. Use this when a contact is no longer needed or was created by mistake.',
    parameters: z.object({
      contactId: z.string().describe('Contact UUID to delete'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return { error: 'Not authenticated' };

      // Get contact info first
      const { data: contact, error: fetchError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('id', params.contactId)
        .single();

      if (fetchError || !contact) {
        return { error: 'Contact not found' };
      }

      // Delete the contact
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', params.contactId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return {
        success: true,
        deleted: {
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          email: contact.email,
        },
      };
    },
  }),

  /**
   * Delete a client
   */
  deleteClient: tool({
    description: 'Delete a client from the system. WARNING: This will also affect related contacts, orders, and activities. Use this when a client is no longer needed or was created by mistake.',
    parameters: z.object({
      clientId: z.string().describe('Client UUID to delete'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return { error: 'Not authenticated' };

      // Get client info first
      const { data: client, error: fetchError } = await supabase
        .from('clients')
        .select('id, company_name, email, primary_contact')
        .eq('id', params.clientId)
        .single();

      if (fetchError || !client) {
        return { error: 'Client not found' };
      }

      // Count related records
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', params.clientId);

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', params.clientId);

      // Delete the client (cascade should handle related records)
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', params.clientId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return {
        success: true,
        deleted: {
          id: client.id,
          companyName: client.company_name,
          email: client.email,
          primaryContact: client.primary_contact,
        },
        relatedRecords: {
          contacts: contactsCount || 0,
          orders: ordersCount || 0,
        },
      };
    },
  }),

  /**
   * Delete a task/activity
   */
  deleteTask: tool({
    description: 'Delete a task or activity. Use this when a task is no longer needed or was created by mistake.',
    parameters: z.object({
      taskId: z.string().describe('Task/Activity UUID to delete'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return { error: 'Not authenticated' };

      // Get task info first
      const { data: task, error: fetchError } = await supabase
        .from('activities')
        .select('id, activity_type, subject, status')
        .eq('id', params.taskId)
        .single();

      if (fetchError || !task) {
        return { error: 'Task not found' };
      }

      // Delete the task
      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('id', params.taskId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return {
        success: true,
        deleted: {
          id: task.id,
          type: task.activity_type,
          subject: task.subject,
          status: task.status,
        },
      };
    },
  }),

  /**
   * Delete an opportunity/deal
   */
  deleteOpportunity: tool({
    description: 'Delete an opportunity or deal. Use this when a deal is no longer needed or was created by mistake.',
    parameters: z.object({
      opportunityId: z.string().describe('Opportunity/Deal UUID to delete'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return { error: 'Not authenticated' };

      // Get opportunity info first
      const { data: opportunity, error: fetchError } = await supabase
        .from('deals')
        .select('id, name, amount, stage, client_id, client:clients(company_name)')
        .eq('id', params.opportunityId)
        .single();

      if (fetchError || !opportunity) {
        return { error: 'Opportunity not found' };
      }

      // Delete the opportunity
      const { error: deleteError } = await supabase
        .from('deals')
        .delete()
        .eq('id', params.opportunityId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return {
        success: true,
        deleted: {
          id: opportunity.id,
          name: opportunity.name,
          amount: opportunity.amount,
          stage: opportunity.stage,
          client: (opportunity.client as any)?.company_name || null,
        },
      };
    },
  }),

  /**
   * Delete an order
   */
  deleteOrder: tool({
    description: 'Delete an order. WARNING: This may affect related properties and activities. Use this when an order is no longer needed or was created by mistake.',
    parameters: z.object({
      orderId: z.string().describe('Order UUID to delete'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return { error: 'Not authenticated' };

      // Get order info first
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, status, order_type, client_id, client:clients(company_name)')
        .eq('id', params.orderId)
        .single();

      if (fetchError || !order) {
        return { error: 'Order not found' };
      }

      // Count related properties
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', params.orderId);

      // Delete the order
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', params.orderId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return {
        success: true,
        deleted: {
          id: order.id,
          orderNumber: order.order_number,
          status: order.status,
          type: order.order_type,
          client: (order.client as any)?.company_name || null,
        },
        relatedRecords: {
          properties: propertiesCount || 0,
        },
      };
    },
  }),

  /**
   * Delete a property
   */
  deleteProperty: tool({
    description: 'Delete a property. Use this when a property is no longer needed or was created by mistake.',
    parameters: z.object({
      propertyId: z.string().describe('Property UUID to delete'),
    }),
    // @ts-ignore
    execute: async (params: any) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return { error: 'Not authenticated' };

      // Get property info first
      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('id, address, city, state, zip_code, property_type')
        .eq('id', params.propertyId)
        .single();

      if (fetchError || !property) {
        return { error: 'Property not found' };
      }

      // Delete the property
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', params.propertyId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      return {
        success: true,
        deleted: {
          id: property.id,
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zip_code,
          propertyType: property.property_type,
        },
      };
    },
  }),

  /**
   * Search knowledge base (RAG)
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  searchKnowledge: tool({
    description: 'Search the knowledge base for relevant information about clients, activities, notes, or past interactions. Use this to find specific information.',
    parameters: z.object({
      query: z.string().describe('What to search for'),
      limit: z.number().optional().default(5).describe('Maximum results to return'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ query, limit }: { query: string; limit?: number }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      const results = await searchRAG(user.id, query, limit);

      return {
        results: results.map(r => ({
          title: r.title,
          content: r.content.substring(0, 300) + '...', // Truncate for chat
          source: r.source,
          similarity: Math.round(r.similarity * 100),
        })),
        count: results.length,
      };
    },
  }),

  /**
   * Get recent activity for a client
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  getClientActivity: tool({
    description: 'Get recent activity and interaction history for a specific client.',
    parameters: z.object({
      clientId: z.string().describe('Client UUID'),
      limit: z.number().optional().default(10),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ clientId, limit = 10 }: { clientId: string; limit?: number }) => {
      const supabase = await createClient();

      const { data: activities, error } = await supabase
        .from('activities')
        .select(`
          id,
          activity_type,
          subject,
          description,
          status,
          outcome,
          created_at,
          scheduled_at
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { error: error.message };
      }

      return {
        activities: activities || [],
        count: activities?.length || 0,
      };
    },
  }),

  /**
   * Get pending action cards
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  getPendingCards: tool({
    description: 'Get pending action cards that need review or approval. Use when user asks "what\'s pending?" or "what needs my attention?"',
    parameters: z.object({
      state: z.enum(['suggested', 'in_review', 'approved']).optional(),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ state }: { state?: 'suggested' | 'in_review' | 'approved' }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      let query = supabase
        .from('kanban_cards')
        .select(`
          id,
          type,
          title,
          state,
          priority,
          rationale,
          created_at,
          client:clients(company_name)
        `)
        .eq('org_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (state) {
        query = query.eq('state', state);
      } else {
        query = query.in('state', ['suggested', 'in_review', 'approved']);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return {
        cards: data || [],
        count: data?.length || 0,
      };
    },
  }),

  /**
   * Get ALL current Kanban cards (including completed/rejected)
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  getAllCards: tool({
    description: 'Get all current Kanban cards across all states (suggested, in_review, approved, rejected, completed). Use this to see the complete current state of the Kanban board or when user asks "what cards do we have?" or "show me all cards".',
    parameters: z.object({
      includeCompleted: z.boolean().optional().default(false).describe('Include completed and rejected cards'),
      limit: z.number().optional().default(50).describe('Maximum number of cards to return'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ includeCompleted = false, limit = 50 }: { includeCompleted?: boolean; limit?: number }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { error: 'Not authenticated' };

      let query = supabase
        .from('kanban_cards')
        .select(`
          id,
          type,
          title,
          state,
          priority,
          rationale,
          created_at,
          client:clients(id, company_name)
        `)
        .eq('org_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!includeCompleted) {
        // Exclude completed and rejected
        query = query.in('state', ['suggested', 'in_review', 'approved']);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      // Format response with clean client data
      const formattedCards = (data || []).map(card => ({
        id: card.id,
        title: card.title,
        type: card.type,
        state: card.state,
        priority: card.priority,
        rationale: card.rationale,
        createdAt: card.created_at,
        client: (card.client as any)?.company_name || null,
        clientId: (card.client as any)?.id || null,
      }));

      return {
        cards: formattedCards,
        count: formattedCards.length,
        totalCards: formattedCards.length,
      };
    },
  }),

  /**
   * Get agent run history
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  getRunHistory: tool({
    description: 'Get recent agent run history and performance metrics.',
    parameters: z.object({
      limit: z.number().optional().default(5),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ limit = 5 }: { limit?: number }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return { error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('org_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { error: error.message };
      }

      return {
        runs: data || [],
        count: data?.length || 0,
      };
    },
  }),

  /**
   * Search the web
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  searchWeb: tool({
    description: 'Search the internet for information about companies, people, news, or any topic. Use this when the user asks you to search for something or when you need external information not available in the database.',
    parameters: z.object({
      query: z.string().describe('Search query - what to look up on the internet'),
      maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ query, maxResults }: { query: string; maxResults?: number }) => {
      try {
        const results = await webSearchFunction(query, maxResults);

        if (results.length === 0) {
          return {
            message: 'No search results found. Tavily API key may not be configured.',
            results: [],
            count: 0,
          };
        }

        return {
          results: results.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            score: r.score,
          })),
          count: results.length,
          query,
        };
      } catch (error: any) {
        return {
          error: error.message,
          message: 'Web search failed. Check Tavily API key configuration.',
          results: [],
          count: 0,
        };
      }
    },
  }),

  /**
   * Computer Use - Visual research task
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  computerUseTask: tool({
    description: 'Execute a computer use task for visual research. Use this for: browsing websites visually, extracting data from web pages, competitive research, or any task requiring actual web browsing. This is more expensive and slower than APIs, so only use when necessary.',
    parameters: z.object({
      instruction: z.string().describe('Detailed instruction for what to do (e.g., "Go to competitor.com and extract all pricing information")'),
      maxSteps: z.number().optional().default(15).describe('Maximum steps to execute (default: 15)'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ instruction, maxSteps }: { instruction: string; maxSteps?: number }) => {
      // Check if computer use is available
      const status = getComputerUseStatus();
      if (!status.available) {
        return {
          error: `Computer Use is not available: ${status.reason}`,
          message: 'Computer Use requires additional infrastructure setup.',
          requirements: status.requirements,
          available: false,
        };
      }

      try {
        const result = await executeComputerUseTask({
          instruction,
          maxSteps,
        });

        return {
          success: result.success,
          output: result.finalOutput,
          steps: result.steps,
          screenshots: result.screenshots?.length || 0,
          error: result.error,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          message: 'Computer Use task failed',
        };
      }
    },
  }),

  /**
   * Research competitor pricing
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  researchCompetitorPricing: tool({
    description: 'Research competitor pricing by visiting their website and extracting pricing information. Returns structured pricing data.',
    parameters: z.object({
      competitorUrl: z.string().describe('URL of the competitor website'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ competitorUrl }: { competitorUrl: string }) => {
      const status = getComputerUseStatus();
      if (!status.available) {
        return {
          error: `Computer Use is not available: ${status.reason}`,
          available: false,
        };
      }

      try {
        const result = await researchCompetitorPricing(competitorUrl);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          pricing: [],
          analysis: 'Failed to research competitor pricing',
        };
      }
    },
  }),

  /**
   * Deep company research
   */
  // @ts-ignore - AI SDK type mismatch in Vercel build
  deepCompanyResearch: tool({
    description: 'Perform deep research on a company by browsing their website and gathering information. Returns a comprehensive report.',
    parameters: z.object({
      companyName: z.string().describe('Name of the company to research'),
      companyWebsite: z.string().optional().describe('Company website URL (optional, will search if not provided)'),
    }),
    // @ts-ignore - AI SDK type mismatch
    execute: async ({ companyName, companyWebsite }: { companyName: string; companyWebsite?: string }) => {
      const status = getComputerUseStatus();
      if (!status.available) {
        return {
          error: `Computer Use is not available: ${status.reason}`,
          available: false,
          report: null,
        };
      }

      try {
        const report = await deepCompanyResearch(companyName, companyWebsite);
        return {
          success: true,
          company: companyName,
          report,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          company: companyName,
          report: null,
        };
      }
    },
  }),

  /**
   * Check Computer Use availability
   */
  checkComputerUseStatus: tool({
    description: 'Check if Computer Use capabilities are available and properly configured.',
    parameters: z.object({}),
    // @ts-ignore
    execute: async () => {
      const status = getComputerUseStatus();
      return {
        available: status.available,
        reason: status.reason,
        requirements: status.requirements,
        message: status.available
          ? 'Computer Use is available and ready to use'
          : `Computer Use is not available: ${status.reason}`,
      };
    },
  }),
};

