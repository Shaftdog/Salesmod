import { createClient } from '@/lib/supabase/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Format email body with proper HTML
 */
function formatEmailBody(body: string): string {
  if (!body) return body;

  if (body.includes('<p>') && body.includes('</p>')) {
    return body;
  }

  const hasNumberedList = /\d+\.\s+[A-Z]/.test(body);
  const hasBulletList = /[•\-\*]\s+[A-Z]/.test(body);
  const hasWordedList = /(First|Second|Third|Fourth|Fifth)[\s\w]*:/gi.test(body);

  if (hasWordedList) {
    const listPattern = /((?:First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:[\s\S]*?)(?=(?:First|Second|Third|Fourth|Fifth|Next|Finally)[\s\w]*:|$)/gi;
    const listItems = body.match(listPattern);

    if (listItems && listItems.length > 1) {
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

      const lastItem = listItems[listItems.length - 1];
      const closingMatch = body.split(lastItem)[1];
      if (closingMatch && closingMatch.trim()) {
        result += `<p>${closingMatch.trim()}</p>`;
      }

      return result;
    }
  }

  return `<p>${body}</p>`;
}

/**
 * Execute a tool by name with the given input
 */
export async function executeAnthropicTool(
  toolName: string,
  toolInput: any,
  userId: string
): Promise<any> {
  const supabase = await createClient();

  console.log(`[Tool Executor] Executing: ${toolName}`, toolInput);

  switch (toolName) {
    // ===== Search & Query Tools =====
    case 'searchClients': {
      const { query } = toolInput;
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, primary_contact, email, phone, is_active')
        .or(`company_name.ilike.%${query}%,primary_contact.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) return { error: error.message };

      return {
        clients: data || [],
        count: data?.length || 0,
      };
    }

    case 'searchContacts': {
      const { query, clientId } = toolInput;

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
          client:clients!contacts_client_id_fkey(id, company_name)
        `)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,title.ilike.%${query}%`)
        .limit(10);

      if (clientId) {
        queryBuilder = queryBuilder.eq('client_id', clientId);
      }

      const { data, error } = await queryBuilder;

      if (error) return { error: error.message };

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
        })),
        count: data?.length || 0,
      };
    }

    case 'getAllCards': {
      const { includeCompleted = false, limit = 50 } = toolInput;

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
        .eq('org_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!includeCompleted) {
        query = query.in('state', ['suggested', 'in_review', 'approved']);
      }

      const { data, error } = await query;

      if (error) return { error: error.message };

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
      };
    }

    case 'getPendingCards': {
      const { state } = toolInput;

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
        .eq('org_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (state) {
        query = query.eq('state', state);
      } else {
        query = query.in('state', ['suggested', 'in_review', 'approved']);
      }

      const { data, error } = await query;

      if (error) return { error: error.message };

      return {
        cards: data || [],
        count: data?.length || 0,
      };
    }

    case 'getClientActivity': {
      const { clientId, limit = 10 } = toolInput;

      const { data, error } = await supabase
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

      if (error) return { error: error.message };

      return {
        activities: data || [],
        count: data?.length || 0,
      };
    }

    // ===== Contact Management =====
    case 'createContact': {
      const { clientId, firstName, lastName, email, phone, mobile, title, department, isPrimary, notes } = toolInput;

      // Verify client exists
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        return { error: 'Client not found or access denied' };
      }

      // Create contact
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          client_id: clientId,
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null,
          mobile: mobile || null,
          title: title || null,
          department: department || null,
          is_primary: isPrimary || false,
          notes: notes || null,
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
          client:clients!contacts_client_id_fkey(id, company_name)
        `)
        .single();

      if (error) return { error: error.message };

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
          client: {
            id: (data.client as any)?.id,
            name: (data.client as any)?.company_name,
          },
        },
      };
    }

    case 'deleteContact': {
      const { contactId } = toolInput;

      const { data: contact, error: fetchError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('id', contactId)
        .single();

      if (fetchError || !contact) {
        return { error: 'Contact not found' };
      }

      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) return { error: deleteError.message };

      return {
        success: true,
        deleted: {
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          email: contact.email,
        },
      };
    }

    // ===== Client Management =====
    case 'createClient': {
      const {
        companyName,
        primaryContact,
        email,
        phone,
        address,
        billingAddress,
        paymentTerms,
        preferredTurnaround,
        specialRequirements
      } = toolInput;

      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_name: companyName,
          primary_contact: primaryContact,
          email,
          phone,
          address,
          billing_address: billingAddress || address,
          payment_terms: paymentTerms || 30,
          preferred_turnaround: preferredTurnaround,
          special_requirements: specialRequirements,
          is_active: true,
        })
        .select()
        .single();

      if (error) return { error: error.message };

      return {
        success: true,
        client: {
          id: data.id,
          companyName: data.company_name,
          email: data.email,
          primaryContact: data.primary_contact,
        },
      };
    }

    case 'deleteClient': {
      const { clientId } = toolInput;

      const { data: client, error: fetchError } = await supabase
        .from('clients')
        .select('id, company_name, email, primary_contact')
        .eq('id', clientId)
        .single();

      if (fetchError || !client) {
        return { error: 'Client not found' };
      }

      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (deleteError) return { error: deleteError.message };

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
    }

    // ===== Property Management =====
    case 'createProperty': {
      const { addressLine1, addressLine2, city, state, postalCode, propertyType, apn, yearBuilt, gla, lotSize } = toolInput;

      const addrHash = `${addressLine1.toUpperCase()}|${city.toUpperCase()}|${state.toUpperCase()}|${postalCode.substring(0, 5)}`;

      const { data, error } = await supabase
        .from('properties')
        .insert({
          org_id: userId,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state: state.toUpperCase(),
          postal_code: postalCode,
          property_type: propertyType,
          apn,
          year_built: yearBuilt,
          gla,
          lot_size: lotSize,
          addr_hash: addrHash,
        })
        .select()
        .single();

      if (error) return { error: error.message };

      return {
        success: true,
        property: {
          id: data.id,
          address: `${data.address_line1}, ${data.city}, ${data.state} ${data.postal_code}`,
          type: data.property_type,
        },
      };
    }

    case 'deleteProperty': {
      const { propertyId } = toolInput;

      const { data: property, error: fetchError } = await supabase
        .from('properties')
        .select('id, address_line1, city, state, postal_code, property_type')
        .eq('id', propertyId)
        .single();

      if (fetchError || !property) {
        return { error: 'Property not found' };
      }

      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (deleteError) return { error: deleteError.message };

      return {
        success: true,
        deleted: {
          id: property.id,
          address: `${property.address_line1}, ${property.city}, ${property.state} ${property.postal_code}`,
          propertyType: property.property_type,
        },
      };
    }

    // ===== Order Management =====
    case 'createOrder': {
      const {
        clientId,
        orderNumber,
        propertyAddress,
        propertyCity,
        propertyState,
        propertyZip,
        propertyType,
        orderType,
        borrowerName,
        dueDate,
        feeAmount,
        priority,
        notes
      } = toolInput;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          org_id: userId,
          client_id: clientId,
          order_number: orderNumber,
          property_address: propertyAddress,
          property_city: propertyCity,
          property_state: propertyState,
          property_zip: propertyZip,
          property_type: propertyType,
          order_type: orderType,
          borrower_name: borrowerName,
          due_date: dueDate,
          fee_amount: feeAmount,
          priority: priority || 'normal',
          status: 'pending',
          notes,
          created_by: userId,
        })
        .select()
        .single();

      if (error) return { error: error.message };

      return {
        success: true,
        order: {
          id: data.id,
          orderNumber: data.order_number,
          propertyAddress: data.property_address,
          status: data.status,
        },
      };
    }

    case 'deleteOrder': {
      const { orderId } = toolInput;

      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, order_number, status, order_type, client_id, client:clients(company_name)')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        return { error: 'Order not found' };
      }

      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', orderId);

      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (deleteError) return { error: deleteError.message };

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
    }

    // ===== Card Management =====
    case 'createCard': {
      const { type, clientId, title, rationale, priority, emailDraft, taskDetails } = toolInput;

      // Validate send_email actions have emailDraft
      if (type === 'send_email') {
        if (!emailDraft) {
          return { error: 'send_email actions must include emailDraft with subject, body, and to fields' };
        }
        if (!emailDraft.to || !emailDraft.to.includes('@')) {
          return { error: 'Email must include a valid to address' };
        }
        if (!emailDraft.subject || emailDraft.subject.length < 5) {
          return { error: 'Email subject must be at least 5 characters' };
        }
        if (!emailDraft.body || emailDraft.body.length < 20) {
          return { error: 'Email body must be at least 20 characters' };
        }
      }

      let actionPayload: any = {};
      if (emailDraft) {
        actionPayload = {
          ...emailDraft,
          body: formatEmailBody(emailDraft.body),
        };
      } else if (taskDetails) {
        actionPayload = taskDetails;
      }

      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          org_id: userId,
          client_id: clientId || null,
          type,
          title,
          rationale,
          priority: priority || 'medium',
          state: 'suggested',
          action_payload: actionPayload,
          created_by: userId,
        })
        .select()
        .single();

      if (error) return { error: error.message };

      return {
        success: true,
        card: {
          id: data.id,
          title: data.title,
          type: data.type,
          state: data.state,
        },
      };
    }

    case 'updateCard': {
      const { cardId, state, priority, title, rationale } = toolInput;

      const updates: any = {};
      if (state) updates.state = state;
      if (priority) updates.priority = priority;
      if (title) updates.title = title;
      if (rationale) updates.rationale = rationale;

      const { data, error } = await supabase
        .from('kanban_cards')
        .update(updates)
        .eq('id', cardId)
        .eq('org_id', userId)
        .select('id, title, type, state, priority')
        .single();

      if (error) return { error: error.message };

      return {
        success: true,
        card: data,
      };
    }

    case 'deleteCard': {
      const { cardId, priority, type, titleMatch, clientId } = toolInput;

      const { data: allCards, error: fetchError } = await supabase
        .from('kanban_cards')
        .select('id, title, type, priority, state, client_id, client:clients(company_name)')
        .eq('org_id', userId);

      if (fetchError) return { error: fetchError.message };

      if (!allCards || allCards.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: 'No cards found to delete',
        };
      }

      let cardsToDelete = allCards;

      if (cardId) cardsToDelete = cardsToDelete.filter(c => c.id === cardId);
      if (priority) cardsToDelete = cardsToDelete.filter(c => c.priority === priority);
      if (type) cardsToDelete = cardsToDelete.filter(c => c.type === type);
      if (titleMatch) {
        const searchTerm = titleMatch.toLowerCase();
        cardsToDelete = cardsToDelete.filter(c => c.title.toLowerCase().includes(searchTerm));
      }
      if (clientId) cardsToDelete = cardsToDelete.filter(c => c.client_id === clientId);

      if (cardsToDelete.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          message: 'No cards matched the criteria',
        };
      }

      const cardIds = cardsToDelete.map(c => c.id);
      const { error: deleteError } = await supabase
        .from('kanban_cards')
        .delete()
        .in('id', cardIds)
        .eq('org_id', userId);

      if (deleteError) return { error: deleteError.message };

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
    }

    // ===== Deal/Opportunity Management =====
    case 'deleteOpportunity': {
      const { opportunityId } = toolInput;

      const { data: opportunity, error: fetchError } = await supabase
        .from('deals')
        .select('id, name, amount, stage, client_id, client:clients(company_name)')
        .eq('id', opportunityId)
        .single();

      if (fetchError || !opportunity) {
        return { error: 'Opportunity not found' };
      }

      const { error: deleteError } = await supabase
        .from('deals')
        .delete()
        .eq('id', opportunityId);

      if (deleteError) return { error: deleteError.message };

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
    }

    // ===== Activity & Task Management =====
    case 'createActivity': {
      const { activityType, subject, description, clientId, contactId, orderId, outcome, scheduledAt } = toolInput;

      const { data, error } = await supabase
        .from('activities')
        .insert({
          activity_type: activityType,
          subject,
          description: description || '',
          status: 'completed',
          client_id: clientId || null,
          contact_id: contactId || null,
          order_id: orderId || null,
          outcome: outcome || null,
          scheduled_at: scheduledAt || new Date().toISOString(),
          created_by: userId,
        })
        .select()
        .single();

      if (error) return { error: error.message };

      return {
        success: true,
        activity: {
          id: data.id,
          type: data.activity_type,
          subject: data.subject,
          status: data.status,
        },
      };
    }

    case 'deleteTask': {
      const { taskId } = toolInput;

      const { data: task, error: fetchError } = await supabase
        .from('activities')
        .select('id, activity_type, subject, status')
        .eq('id', taskId)
        .single();

      if (fetchError || !task) {
        return { error: 'Task not found' };
      }

      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('id', taskId);

      if (deleteError) return { error: deleteError.message };

      return {
        success: true,
        deleted: {
          id: task.id,
          type: task.activity_type,
          subject: task.subject,
          status: task.status,
        },
      };
    }

    // ===== File Operations =====
    case 'readFile': {
      const { filePath } = toolInput;

      try {
        const projectRoot = process.cwd();
        const fullPath = path.join(projectRoot, filePath);

        if (!fullPath.startsWith(projectRoot)) {
          return { error: 'Access denied: path outside project root' };
        }

        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        return {
          success: true,
          filePath,
          content,
          lineCount: lines.length,
          size: Buffer.byteLength(content, 'utf-8'),
        };
      } catch (error: any) {
        return { error: error.message };
      }
    }

    case 'writeFile': {
      const { filePath, content, createDirs } = toolInput;

      try {
        const projectRoot = process.cwd();
        const fullPath = path.join(projectRoot, filePath);

        if (!fullPath.startsWith(projectRoot)) {
          return { error: 'Access denied: path outside project root' };
        }

        if (createDirs !== false) {
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
        }

        await fs.writeFile(fullPath, content, 'utf-8');

        return {
          success: true,
          filePath,
          size: Buffer.byteLength(content, 'utf-8'),
          message: `File written successfully: ${filePath}`,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    }

    case 'editFile': {
      const { filePath, oldText, newText, replaceAll } = toolInput;

      try {
        const projectRoot = process.cwd();
        const fullPath = path.join(projectRoot, filePath);

        if (!fullPath.startsWith(projectRoot)) {
          return { error: 'Access denied: path outside project root' };
        }

        const content = await fs.readFile(fullPath, 'utf-8');

        if (!content.includes(oldText)) {
          return { error: `Text not found in file: "${oldText.substring(0, 50)}..."` };
        }

        const newContent = replaceAll
          ? content.split(oldText).join(newText)
          : content.replace(oldText, newText);

        await fs.writeFile(fullPath, newContent, 'utf-8');

        return {
          success: true,
          filePath,
          replacements: replaceAll ? content.split(oldText).length - 1 : 1,
          message: `File edited successfully: ${filePath}`,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    }

    case 'listFiles': {
      const { pattern, maxResults } = toolInput;

      try {
        const { stdout } = await execAsync(
          `find . -type f -path "./${pattern}" | head -n ${maxResults || 50}`,
          { cwd: process.cwd(), maxBuffer: 1024 * 1024 }
        );

        const files = stdout
          .trim()
          .split('\n')
          .filter(f => f)
          .map(f => f.replace(/^\.\//, ''));

        return {
          success: true,
          pattern,
          files,
          count: files.length,
        };
      } catch (error: any) {
        return { error: error.message };
      }
    }

    case 'searchCode': {
      const { searchTerm, filePattern, maxResults, caseSensitive } = toolInput;

      try {
        const caseFlag = caseSensitive ? '' : '-i';
        const pattern = filePattern || '*';
        const max = maxResults || 20;

        const { stdout } = await execAsync(
          `grep -r ${caseFlag} -n "${searchTerm}" --include="${pattern}" . | head -n ${max}`,
          { cwd: process.cwd(), maxBuffer: 1024 * 1024 }
        );

        const results = stdout
          .trim()
          .split('\n')
          .filter(line => line)
          .map(line => {
            const match = line.match(/^\.\/([^:]+):(\d+):(.*)$/);
            if (match) {
              return {
                file: match[1],
                line: parseInt(match[2]),
                content: match[3].trim(),
              };
            }
            return null;
          })
          .filter(r => r !== null);

        return {
          success: true,
          searchTerm,
          results,
          count: results.length,
        };
      } catch (error: any) {
        if (error.code === 1) {
          return {
            success: true,
            searchTerm,
            results: [],
            count: 0,
          };
        }
        return { error: error.message };
      }
    }

    case 'runCommand': {
      const { command, timeout } = toolInput;

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: process.cwd(),
          timeout: timeout || 30000,
          maxBuffer: 1024 * 1024 * 5,
        });

        return {
          success: true,
          command,
          stdout: stdout || '(empty)',
          stderr: stderr || '(empty)',
        };
      } catch (error: any) {
        return {
          success: false,
          command,
          error: error.message,
          stdout: error.stdout || '',
          stderr: error.stderr || '',
          exitCode: error.code,
        };
      }
    }

    // ===== Card Review Specialized Tools =====
    case 'storeRejectionFeedback': {
      const { cardId, reason, rule, cardType } = toolInput;

      const { error } = await supabase
        .from('agent_memories')
        .insert({
          org_id: userId,
          scope: 'card_feedback',
          key: `rejection_${cardType || 'unknown'}_${Date.now()}`,
          content: {
            type: 'rejection_feedback',
            card_id: cardId,
            reason,
            rule,
            card_type: cardType,
            timestamp: new Date().toISOString(),
          },
          importance: 0.9,
          last_used_at: new Date().toISOString(),
        });

      if (error) return { error: error.message };

      return {
        success: true,
        message: 'Feedback stored successfully',
        stored: {
          cardId,
          reason,
          rule: rule || null,
        },
      };
    }

    case 'storeEmailClassificationRule': {
      const { cardId, patternType, patternValue, correctCategory, wrongCategory, reason, confidenceOverride } = toolInput;

      // ===== VALIDATION =====

      // Validate category
      const validCategories = [
        'AMC_ORDER',
        'OPPORTUNITY',
        'CASE',
        'STATUS',
        'SCHEDULING',
        'UPDATES',
        'AP',
        'AR',
        'INFORMATION',
        'NOTIFICATIONS',
        'REMOVE',
        'ESCALATE',
      ];

      if (!validCategories.includes(correctCategory)) {
        return {
          error: `Invalid category: ${correctCategory}. Must be one of: ${validCategories.join(', ')}`,
        };
      }

      // Validate pattern type
      const validPatternTypes = ['sender_email', 'sender_domain', 'subject_contains', 'subject_regex'];
      if (!validPatternTypes.includes(patternType)) {
        return {
          error: `Invalid pattern type: ${patternType}. Must be one of: ${validPatternTypes.join(', ')}`,
        };
      }

      // Validate pattern value
      if (!patternValue || patternValue.trim().length === 0) {
        return { error: 'Pattern value cannot be empty' };
      }

      if (patternValue.length > 300) {
        return { error: 'Pattern value too long (max 300 characters)' };
      }

      // For regex patterns, validate they're safe
      if (patternType === 'subject_regex') {
        try {
          new RegExp(patternValue);

          // Check for dangerous patterns
          if (patternValue.length > 200) {
            return { error: 'Regex pattern too long (max 200 characters)' };
          }

          // Check for nested quantifiers (ReDoS risk)
          if (/(\*|\+|\{)\s*(\*|\+|\{)/.test(patternValue)) {
            return {
              error: 'Regex pattern contains nested quantifiers (security risk)',
              suggestion: 'Simplify your pattern to avoid nested quantifiers like **, ++, *+, etc.',
            };
          }

          // Check for quantified groups with quantifiers inside
          if (/(\(.*[\*\+].*\))\s*[\*\+]/.test(patternValue)) {
            return {
              error: 'Regex pattern has quantified group containing quantifiers (ReDoS risk)',
              suggestion: 'Avoid patterns like (a+)+ or (.*)*',
            };
          }
        } catch (e) {
          return { error: `Invalid regex pattern: ${(e as Error).message}` };
        }
      }

      // Validate confidence override
      if (confidenceOverride !== undefined && confidenceOverride !== null) {
        if (confidenceOverride < 0 || confidenceOverride > 1) {
          return { error: 'Confidence override must be between 0 and 1' };
        }
      }

      // Validate reason
      if (!reason || reason.trim().length === 0) {
        return { error: 'Reason is required to explain why this rule is needed' };
      }

      if (reason.length > 1000) {
        return { error: 'Reason too long (max 1000 characters)' };
      }

      // ===== CHECK RULE COUNT LIMIT =====
      const { count: ruleCount } = await supabase
        .from('agent_memories')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', userId)
        .eq('scope', 'email_classification');

      if ((ruleCount || 0) >= 50) {
        return {
          error: 'Maximum classification rules reached (50).',
          suggestion: 'Please delete old or unused rules before adding new ones. You can disable rules instead of deleting them.',
        };
      }

      // ===== CHECK FOR DUPLICATES =====
      const { data: existingRules } = await supabase
        .from('agent_memories')
        .select('content, key')
        .eq('org_id', userId)
        .eq('scope', 'email_classification');

      const isDuplicate = existingRules?.some(
        (r: any) =>
          r.content.pattern_type === patternType &&
          r.content.pattern_value === patternValue &&
          r.content.correct_category === correctCategory
      );

      if (isDuplicate) {
        return {
          success: false,
          error: 'Duplicate rule already exists',
          message: `A rule for "${patternType}" = "${patternValue}" → ${correctCategory} already exists.`,
          suggestion: 'Use a different pattern, modify the existing rule, or choose a different category.',
        };
      }

      // ===== CREATE RULE =====

      // Generate a unique key for this rule based on pattern
      const sanitizedValue = patternValue.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      const ruleKey = `classification_${patternType}_${sanitizedValue}_${Date.now()}`;

      // Get the card to extract email details
      const { data: card } = await supabase
        .from('kanban_cards')
        .select('gmail_message_id, action_payload')
        .eq('id', cardId)
        .single();

      const { error } = await supabase
        .from('agent_memories')
        .insert({
          org_id: userId,
          scope: 'email_classification',
          key: ruleKey,
          content: {
            type: 'classification_rule',
            pattern_type: patternType,
            pattern_value: patternValue,
            correct_category: correctCategory,
            wrong_category: wrongCategory,
            reason,
            confidence_override: confidenceOverride || null,
            created_from_card_id: cardId,
            created_by: userId,
            example_email_id: card?.gmail_message_id || null,
            created_at: new Date().toISOString(),
            match_count: 0,
            last_matched_at: null,
            last_matched_email_id: null,
            enabled: true,
          },
          importance: 0.95, // High importance - these rules directly affect classification
          last_used_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[storeEmailClassificationRule] Database error:', error);
        return { error: `Failed to store rule: ${error.message}` };
      }

      // Invalidate rule cache for this org
      try {
        const { invalidateRuleCache } = await import('@/lib/agent/email-classifier');
        invalidateRuleCache(userId);
      } catch (err) {
        console.warn('[storeEmailClassificationRule] Failed to invalidate cache:', err);
      }

      console.log(`[storeEmailClassificationRule] Created rule ${ruleKey} for org ${userId}`);

      return {
        success: true,
        message: `✓ Classification rule created: "${patternType}" matching "${patternValue}" → ${correctCategory}`,
        rule: {
          key: ruleKey,
          patternType,
          patternValue,
          correctCategory,
          reason,
        },
        impact: `Future emails matching this pattern will be classified as ${correctCategory} instead of ${wrongCategory || 'other categories'}. Current rule count: ${(ruleCount || 0) + 1}/50`,
      };
    }

    case 'reviseCard': {
      const { cardId, changes, improvementNote } = toolInput;

      // Get original card
      const { data: originalCard, error: fetchError } = await supabase
        .from('kanban_cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (fetchError || !originalCard) {
        return { error: 'Original card not found' };
      }

      // Build updated action_payload
      const updatedPayload = { ...originalCard.action_payload };
      if (changes.subject) updatedPayload.subject = changes.subject;
      if (changes.body) updatedPayload.body = formatEmailBody(changes.body);

      // Create revised card
      const { data: revisedCard, error: createError } = await supabase
        .from('kanban_cards')
        .insert({
          org_id: userId,
          client_id: originalCard.client_id,
          type: originalCard.type,
          title: changes.title || originalCard.title,
          rationale: changes.rationale || originalCard.rationale,
          priority: changes.priority || originalCard.priority,
          state: 'suggested',
          action_payload: updatedPayload,
          created_by: userId,
        })
        .select()
        .single();

      if (createError) return { error: createError.message };

      // Mark original as superseded
      await supabase
        .from('kanban_cards')
        .update({ state: 'rejected' })
        .eq('id', cardId);

      // Store revision memory
      await supabase.from('agent_memories').insert({
        org_id: userId,
        scope: 'card_revision',
        key: `revision_${cardId}_${Date.now()}`,
        content: {
          original_card_id: cardId,
          revised_card_id: revisedCard.id,
          changes,
          improvement_note: improvementNote,
          timestamp: new Date().toISOString(),
        },
        importance: 0.85,
        last_used_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Card revised successfully',
        originalCard: { id: cardId, state: 'rejected' },
        revisedCard: {
          id: revisedCard.id,
          title: revisedCard.title,
          state: revisedCard.state,
        },
      };
    }

    case 'detectPatternAndSuggest': {
      const { limit = 20 } = toolInput;

      const { data: rejections } = await supabase
        .from('agent_memories')
        .select('*')
        .eq('org_id', userId)
        .eq('scope', 'card_feedback')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!rejections || rejections.length === 0) {
        return {
          success: true,
          patterns: [],
          message: 'No rejection patterns found yet',
        };
      }

      // Analyze patterns
      const reasons: Record<string, number> = {};
      const cardTypes: Record<string, number> = {};
      const rules: string[] = [];

      rejections.forEach((r: any) => {
        const content = r.content;
        if (content.reason) {
          reasons[content.reason] = (reasons[content.reason] || 0) + 1;
        }
        if (content.card_type) {
          cardTypes[content.card_type] = (cardTypes[content.card_type] || 0) + 1;
        }
        if (content.rule) {
          rules.push(content.rule);
        }
      });

      const topReasons = Object.entries(reasons)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));

      return {
        success: true,
        patterns: {
          totalRejections: rejections.length,
          topReasons,
          cardTypes,
          rules: rules.slice(0, 10),
        },
        suggestions: [
          'Consider creating rules for the most common rejection reasons',
          'Review card types with high rejection rates',
          'Use batch operations to handle similar cards efficiently',
        ],
      };
    }

    case 'analyzeRejectionTrends': {
      const { days = 30 } = toolInput;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data: rejections } = await supabase
        .from('agent_memories')
        .select('*')
        .eq('org_id', userId)
        .eq('scope', 'card_feedback')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });

      if (!rejections || rejections.length === 0) {
        return {
          success: true,
          trends: {},
          message: `No rejections in the past ${days} days`,
        };
      }

      // Group by day
      const byDay: Record<string, number> = {};
      const byCardType: Record<string, number> = {};

      rejections.forEach((r: any) => {
        const day = r.created_at.split('T')[0];
        byDay[day] = (byDay[day] || 0) + 1;

        const cardType = r.content?.card_type || 'unknown';
        byCardType[cardType] = (byCardType[cardType] || 0) + 1;
      });

      return {
        success: true,
        trends: {
          totalRejections: rejections.length,
          dailyBreakdown: byDay,
          cardTypeBreakdown: byCardType,
          averagePerDay: (rejections.length / days).toFixed(2),
        },
      };
    }

    case 'researchContact': {
      const { contactId, includeActivities = true, storeFindings = true } = toolInput;

      // Get contact details
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select(`
          *,
          client:clients!contacts_client_id_fkey(
            id,
            company_name,
            email
          )
        `)
        .eq('id', contactId)
        .single();

      if (contactError || !contact) {
        return { error: 'Contact not found' };
      }

      let activities = [];
      if (includeActivities) {
        const { data: activityData } = await supabase
          .from('activities')
          .select('*')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })
          .limit(10);

        activities = activityData || [];
      }

      // Get related cards
      const { data: cards } = await supabase
        .from('kanban_cards')
        .select('id, type, title, state, created_at')
        .eq('client_id', (contact.client as any)?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const findings = {
        contact: {
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          email: contact.email,
          title: contact.title,
          phone: contact.phone,
          isPrimary: contact.is_primary,
        },
        client: contact.client,
        recentActivities: activities.length,
        recentCards: cards?.length || 0,
        lastContact: activities[0]?.created_at || null,
      };

      if (storeFindings) {
        await supabase.from('agent_memories').insert({
          org_id: userId,
          scope: 'contact_research',
          key: `research_${contactId}_${Date.now()}`,
          content: {
            contact_id: contactId,
            findings,
            timestamp: new Date().toISOString(),
          },
          importance: 0.8,
          last_used_at: new Date().toISOString(),
        });
      }

      return {
        success: true,
        findings,
      };
    }

    case 'suggestSmartRule': {
      const { reason, cardType, cardTitle } = toolInput;

      // Detect common patterns in rejection reason
      const lowerReason = reason.toLowerCase();
      let suggestedRule = null;
      let pattern = null;

      if (lowerReason.includes('placeholder') || lowerReason.includes('john doe') || lowerReason.includes('test')) {
        suggestedRule = 'Reject cards with placeholder or test names (John Doe, Test User, etc.)';
        pattern = '(john\\s+doe|test\\s+user|placeholder|sample\\s+name)';
      } else if (lowerReason.includes('email domain') || lowerReason.includes('@example.com')) {
        suggestedRule = 'Reject cards with invalid email domains';
        pattern = '@(example\\.com|test\\.com|domain\\.com)';
      } else if (lowerReason.includes('timing') || lowerReason.includes('too soon') || lowerReason.includes('too early')) {
        suggestedRule = 'Avoid sending emails too soon after initial contact (wait at least 7 days)';
        pattern = null;
      } else if (lowerReason.includes('generic') || lowerReason.includes('not personalized')) {
        suggestedRule = 'Require personalization in email body (mention client name, specific context)';
        pattern = null;
      } else if (lowerReason.includes('wrong client') || lowerReason.includes('targeting')) {
        suggestedRule = 'Improve client targeting - ensure cards match client relationship stage';
        pattern = null;
      }

      // Check for similar existing rules
      const { data: existingFeedback } = await supabase
        .from('agent_memories')
        .select('*')
        .eq('org_id', userId)
        .eq('scope', 'card_feedback')
        .ilike('content->>rule', `%${suggestedRule?.substring(0, 20) || ''}%`)
        .limit(3);

      return {
        success: true,
        suggestedRule,
        pattern,
        reasoning: `Based on keywords in your feedback: "${reason.substring(0, 100)}"`,
        similarExistingRules: existingFeedback?.length || 0,
        recommendation: suggestedRule
          ? 'This rule can help prevent similar issues in future'
          : 'Consider creating a custom rule for this specific case',
      };
    }

    case 'detectSimilarFeedback': {
      const { reason, maxResults = 5 } = toolInput;

      // Extract keywords from reason
      const keywords = reason
        .toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 3);

      const { data: similarFeedback } = await supabase
        .from('agent_memories')
        .select('*')
        .eq('org_id', userId)
        .eq('scope', 'card_feedback')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!similarFeedback || similarFeedback.length === 0) {
        return {
          success: true,
          similar: [],
          count: 0,
        };
      }

      // Calculate similarity scores
      const scored = similarFeedback.map((fb: any) => {
        const fbReason = (fb.content?.reason || '').toLowerCase();
        const matches = keywords.filter((k: string) => fbReason.includes(k)).length;
        return {
          feedback: {
            id: fb.id,
            reason: fb.content?.reason,
            rule: fb.content?.rule,
            cardType: fb.content?.card_type,
            timestamp: fb.created_at,
          },
          similarity: matches / keywords.length,
        };
      });

      const similar = scored
        .filter(s => s.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults)
        .map(s => s.feedback);

      return {
        success: true,
        similar,
        count: similar.length,
        suggestion: similar.length > 0
          ? 'Consider merging or refining similar feedback'
          : 'This appears to be new feedback',
      };
    }

    case 'findSimilarCards': {
      const { issueType, pattern, limit = 20 } = toolInput;

      const { data: cards } = await supabase
        .from('kanban_cards')
        .select(`
          id,
          type,
          title,
          state,
          priority,
          action_payload,
          client:clients(company_name)
        `)
        .eq('org_id', userId)
        .eq('state', 'suggested')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!cards || cards.length === 0) {
        return {
          success: true,
          similarCards: [],
          count: 0,
        };
      }

      // Filter by issue type
      const similarCards = cards.filter((card: any) => {
        const payload = card.action_payload || {};
        const title = card.title || '';
        const body = payload.body || '';
        const email = payload.to || '';

        switch (issueType) {
          case 'placeholder_name':
            return /john\s+doe|test\s+user|placeholder|sample/i.test(title + body);
          case 'email_domain':
            if (pattern) {
              return email.includes(pattern);
            }
            return /@(example\.com|test\.com)/.test(email);
          case 'timing':
            // Would need creation date analysis
            return false;
          case 'targeting':
            // Would need client relationship analysis
            return false;
          case 'content_quality':
            return body.length < 100 || !body.includes(card.client?.company_name || '');
          default:
            return false;
        }
      }).slice(0, limit);

      return {
        success: true,
        similarCards: similarCards.map((c: any) => ({
          id: c.id,
          type: c.type,
          title: c.title,
          priority: c.priority,
          client: c.client?.company_name || null,
        })),
        count: similarCards.length,
      };
    }

    case 'batchApplyFeedback': {
      const { cardIds, action, reason, rule } = toolInput;

      if (cardIds.length > 20) {
        return { error: 'Maximum 20 cards can be processed in one batch' };
      }

      const results = [];

      for (const cardId of cardIds) {
        if (action === 'delete') {
          const { error } = await supabase
            .from('kanban_cards')
            .delete()
            .eq('id', cardId)
            .eq('org_id', userId);

          results.push({
            cardId,
            success: !error,
            error: error?.message,
          });
        } else if (action === 'reject') {
          const { error } = await supabase
            .from('kanban_cards')
            .update({ state: 'rejected' })
            .eq('id', cardId)
            .eq('org_id', userId);

          results.push({
            cardId,
            success: !error,
            error: error?.message,
          });
        }
      }

      // Store batch feedback
      await supabase.from('agent_memories').insert({
        org_id: userId,
        scope: 'card_feedback',
        key: `batch_${action}_${Date.now()}`,
        content: {
          type: 'batch_feedback',
          action,
          card_ids: cardIds,
          reason,
          rule,
          count: cardIds.length,
          timestamp: new Date().toISOString(),
        },
        importance: 0.95,
        last_used_at: new Date().toISOString(),
      });

      const successCount = results.filter(r => r.success).length;

      return {
        success: true,
        processed: cardIds.length,
        successful: successCount,
        failed: cardIds.length - successCount,
        results,
      };
    }

    // ===== Web Search =====
    case 'searchWeb': {
      const { query, maxResults = 5, searchDepth = 'basic' } = toolInput;

      console.log(`[Tool Executor] searchWeb called with query: "${query}"`);

      try {
        const tavilyApiKey = process.env.TAVILY_API_KEY;

        if (!tavilyApiKey) {
          console.log('[Tool Executor] searchWeb: No TAVILY_API_KEY found in environment');
          return {
            error: 'Web search is not configured. Please add TAVILY_API_KEY to environment variables.',
            suggestion: 'Get your free API key at https://tavily.com',
          };
        }

        console.log(`[Tool Executor] searchWeb: Calling Tavily API with ${maxResults} results, ${searchDepth} depth`);

        // Call Tavily API
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query,
            max_results: Math.min(maxResults, 10),
            search_depth: searchDepth,
            include_answer: true,
            include_raw_content: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            error: `Search API error: ${response.status} ${response.statusText}`,
            details: errorData,
          };
        }

        const data = await response.json();

        // Format results
        const results = (data.results || []).map((result: any) => ({
          title: result.title,
          url: result.url,
          content: result.content,
          score: result.score,
        }));

        return {
          success: true,
          query,
          answer: data.answer || null,
          results,
          resultsCount: results.length,
          message: `Found ${results.length} results for: "${query}"`,
        };
      } catch (error: any) {
        return {
          error: `Web search failed: ${error.message}`,
          query,
        };
      }
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
