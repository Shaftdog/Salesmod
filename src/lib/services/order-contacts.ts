/**
 * Order Contacts Service
 * Handles creation and linking of contacts from order data
 *
 * Features:
 * - Validates contact info (Full Name + email or phone required)
 * - Apollo enrichment for incomplete contacts
 * - Links contacts to orders with appropriate roles
 * - Deduplication based on email/phone
 */

import { createClient } from '@/lib/supabase/server';
import {
  enrichContactWithApollo,
  getBestEmail,
  getBestPhone,
  type ApolloEnrichmentRequest
} from '@/lib/research/apollo-enrichment';

// Role codes for order contacts
export const ORDER_CONTACT_ROLES = {
  BORROWER: 'borrower',
  LOAN_OFFICER: 'loan_officer',
  PROCESSOR: 'processor',
  PROPERTY_CONTACT: 'property_contact',
  REALTOR: 'realtor',
  LISTING_AGENT: 'listing_agent',
  BUYING_AGENT: 'buying_agent',
  CC: 'cc',
  ORDERER: 'orderer',
} as const;

export type OrderContactRole = typeof ORDER_CONTACT_ROLES[keyof typeof ORDER_CONTACT_ROLES];

export interface OrderContactInput {
  fullName: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  role: OrderContactRole;
  companyName?: string | null;
}

export interface CreateOrderContactsInput {
  orderId: string;
  clientId: string;
  tenantId: string;
  contacts: OrderContactInput[];
}

export interface OrderContactResult {
  success: boolean;
  contactId?: string;
  isNew?: boolean;
  wasEnriched?: boolean;
  enrichmentFailed?: boolean;
  error?: string;
  role: OrderContactRole;
  fullName: string;
}

export interface CreateOrderContactsResult {
  success: boolean;
  results: OrderContactResult[];
  totalCreated: number;
  totalExisting: number;
  totalEnriched: number;
  totalFailed: number;
}

/**
 * Parse full name into first and last name
 */
function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');

  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '' };
  }

  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1),
  };
}

/**
 * Validate contact has minimum required info
 */
function validateContact(contact: OrderContactInput): { valid: boolean; error?: string } {
  if (!contact.fullName || contact.fullName.trim().length === 0) {
    return { valid: false, error: 'Full name is required' };
  }

  const hasEmail = contact.email && contact.email.trim().length > 0;
  const hasPhone = contact.phone && contact.phone.trim().length > 0;

  if (!hasEmail && !hasPhone) {
    return { valid: false, error: 'Email or phone is required' };
  }

  return { valid: true };
}

/**
 * Try to enrich contact via Apollo API
 */
async function enrichContact(
  contact: OrderContactInput
): Promise<{ email?: string; phone?: string; title?: string; enriched: boolean }> {
  const { firstName, lastName } = parseName(contact.fullName);

  // Only try enrichment if we have a company name for context
  if (!contact.companyName) {
    console.log(`[OrderContacts] Skipping enrichment for ${contact.fullName} - no company name`);
    return { enriched: false };
  }

  try {
    const request: ApolloEnrichmentRequest = {
      first_name: firstName,
      last_name: lastName,
      organization_name: contact.companyName,
    };

    const result = await enrichContactWithApollo(request);

    if (result.success && result.person) {
      const bestEmail = getBestEmail(result.person);
      const bestPhone = getBestPhone(result.person);

      console.log(`[OrderContacts] Enriched ${contact.fullName}: email=${bestEmail}, phone=${bestPhone}`);

      return {
        email: bestEmail || undefined,
        phone: bestPhone || undefined,
        title: result.person.title || undefined,
        enriched: true,
      };
    }

    console.log(`[OrderContacts] No Apollo match for ${contact.fullName}`);
    return { enriched: false };
  } catch (error) {
    console.error(`[OrderContacts] Enrichment error for ${contact.fullName}:`, error);
    return { enriched: false };
  }
}

/**
 * Map role code to order column name
 */
function getRoleColumnName(role: OrderContactRole): string | null {
  switch (role) {
    case ORDER_CONTACT_ROLES.BORROWER:
      return 'borrower_contact_id';
    case ORDER_CONTACT_ROLES.LOAN_OFFICER:
      return 'loan_officer_contact_id';
    case ORDER_CONTACT_ROLES.PROCESSOR:
      return 'processor_contact_id';
    case ORDER_CONTACT_ROLES.PROPERTY_CONTACT:
      return 'property_contact_id';
    case ORDER_CONTACT_ROLES.REALTOR:
    case ORDER_CONTACT_ROLES.LISTING_AGENT:
    case ORDER_CONTACT_ROLES.BUYING_AGENT:
      return 'realtor_contact_id';
    default:
      return null;
  }
}

/**
 * Create a single contact and link to order
 */
async function createSingleOrderContact(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  orderId: string,
  clientId: string,
  tenantId: string,
  contact: OrderContactInput
): Promise<OrderContactResult> {
  const { firstName, lastName } = parseName(contact.fullName);

  // Check validation
  const validation = validateContact(contact);

  // If invalid, try enrichment
  let enrichedData: { email?: string; phone?: string; title?: string; enriched: boolean } = { enriched: false };

  if (!validation.valid) {
    console.log(`[OrderContacts] Contact ${contact.fullName} missing info, trying enrichment`);
    enrichedData = await enrichContact(contact);

    // Re-validate with enriched data
    const enrichedContact = {
      ...contact,
      email: enrichedData.email || contact.email,
      phone: enrichedData.phone || contact.phone,
      title: enrichedData.title || contact.title,
    };

    const revalidation = validateContact(enrichedContact);
    if (!revalidation.valid) {
      return {
        success: false,
        error: `${revalidation.error}. Enrichment ${enrichedData.enriched ? 'attempted but insufficient data found' : 'failed'}`,
        enrichmentFailed: true,
        role: contact.role,
        fullName: contact.fullName,
      };
    }

    // Use enriched data
    contact = enrichedContact;
  }

  const email = contact.email?.trim() || null;
  const phone = contact.phone?.trim() || null;

  try {
    // Check for existing contact by email
    let existingContactId: string | null = null;

    if (email) {
      const { data: existingByEmail } = await supabase
        .from('contacts')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('email', email)
        .limit(1)
        .single();

      if (existingByEmail) {
        existingContactId = existingByEmail.id;
      }
    }

    // If no email match, check by name + phone
    if (!existingContactId && phone) {
      const { data: existingByPhone } = await supabase
        .from('contacts')
        .select('id')
        .eq('tenant_id', tenantId)
        .ilike('first_name', firstName)
        .ilike('last_name', lastName)
        .or(`phone.eq.${phone},mobile.eq.${phone}`)
        .limit(1)
        .single();

      if (existingByPhone) {
        existingContactId = existingByPhone.id;
      }
    }

    let contactId: string;
    let isNew = false;

    if (existingContactId) {
      // Update existing contact with any new info
      contactId = existingContactId;

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (contact.title) updateData.title = contact.title;
      if (!updateData.primary_role_code) updateData.primary_role_code = contact.role;

      await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId);

      console.log(`[OrderContacts] Updated existing contact ${contactId} for ${contact.fullName}`);
    } else {
      // Create new contact
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          client_id: clientId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          title: contact.title || null,
          primary_role_code: contact.role,
          is_primary: false,
          tenant_id: tenantId,
        })
        .select('id')
        .single();

      if (createError || !newContact) {
        throw new Error(createError?.message || 'Failed to create contact');
      }

      contactId = newContact.id;
      isNew = true;
      console.log(`[OrderContacts] Created new contact ${contactId} for ${contact.fullName}`);
    }

    // Link contact to order via order_contacts junction
    const { error: linkError } = await supabase
      .from('order_contacts')
      .upsert({
        order_id: orderId,
        contact_id: contactId,
        role_code: contact.role,
        is_primary: false,
        tenant_id: tenantId,
      }, {
        onConflict: 'order_id,contact_id',
      });

    if (linkError) {
      console.error(`[OrderContacts] Failed to link contact to order:`, linkError);
    }

    // Update direct reference on order
    const columnName = getRoleColumnName(contact.role);
    if (columnName) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ [columnName]: contactId })
        .eq('id', orderId);

      if (updateError) {
        console.error(`[OrderContacts] Failed to update order contact reference:`, updateError);
      }
    }

    return {
      success: true,
      contactId,
      isNew,
      wasEnriched: enrichedData.enriched,
      role: contact.role,
      fullName: contact.fullName,
    };
  } catch (error: any) {
    console.error(`[OrderContacts] Error creating contact ${contact.fullName}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      role: contact.role,
      fullName: contact.fullName,
    };
  }
}

/**
 * Create contacts from order data and link them to the order
 *
 * This is the main entry point for the order contacts service.
 * It processes multiple contacts, validates them, enriches if needed,
 * and links them to the order.
 */
export async function createOrderContacts(
  input: CreateOrderContactsInput
): Promise<CreateOrderContactsResult> {
  const supabase = await createClient();

  const results: OrderContactResult[] = [];
  let totalCreated = 0;
  let totalExisting = 0;
  let totalEnriched = 0;
  let totalFailed = 0;

  for (const contact of input.contacts) {
    // Skip contacts without names
    if (!contact.fullName || contact.fullName.trim().length === 0) {
      console.log(`[OrderContacts] Skipping contact with no name`);
      continue;
    }

    const result = await createSingleOrderContact(
      supabase,
      input.orderId,
      input.clientId,
      input.tenantId,
      contact
    );

    results.push(result);

    if (result.success) {
      if (result.isNew) totalCreated++;
      else totalExisting++;
      if (result.wasEnriched) totalEnriched++;
    } else {
      totalFailed++;
    }
  }

  console.log(`[OrderContacts] Processed ${results.length} contacts: ${totalCreated} new, ${totalExisting} existing, ${totalEnriched} enriched, ${totalFailed} failed`);

  return {
    success: totalFailed < results.length, // Success if at least one contact succeeded
    results,
    totalCreated,
    totalExisting,
    totalEnriched,
    totalFailed,
  };
}

/**
 * Extract contacts from order form data
 *
 * This helper extracts contact information from the standard order fields
 * and prepares them for contact creation.
 */
export function extractContactsFromOrderData(orderData: {
  borrowerName?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  loanOfficer?: string;
  loanOfficerEmail?: string;
  loanOfficerPhone?: string;
  processorName?: string;
  processorEmail?: string;
  processorPhone?: string;
  propertyContactName?: string;
  propertyContactEmail?: string;
  propertyContactPhone?: string;
  realtorName?: string;
  realtorEmail?: string;
  realtorPhone?: string;
  lenderName?: string;
}): OrderContactInput[] {
  const contacts: OrderContactInput[] = [];

  // Borrower
  if (orderData.borrowerName) {
    contacts.push({
      fullName: orderData.borrowerName,
      email: orderData.borrowerEmail || null,
      phone: orderData.borrowerPhone || null,
      role: ORDER_CONTACT_ROLES.BORROWER,
    });
  }

  // Loan Officer
  if (orderData.loanOfficer) {
    contacts.push({
      fullName: orderData.loanOfficer,
      email: orderData.loanOfficerEmail || null,
      phone: orderData.loanOfficerPhone || null,
      role: ORDER_CONTACT_ROLES.LOAN_OFFICER,
      companyName: orderData.lenderName || null, // For enrichment
    });
  }

  // Processor
  if (orderData.processorName) {
    contacts.push({
      fullName: orderData.processorName,
      email: orderData.processorEmail || null,
      phone: orderData.processorPhone || null,
      role: ORDER_CONTACT_ROLES.PROCESSOR,
      companyName: orderData.lenderName || null, // For enrichment
    });
  }

  // Property Contact
  if (orderData.propertyContactName) {
    contacts.push({
      fullName: orderData.propertyContactName,
      email: orderData.propertyContactEmail || null,
      phone: orderData.propertyContactPhone || null,
      role: ORDER_CONTACT_ROLES.PROPERTY_CONTACT,
    });
  }

  // Realtor
  if (orderData.realtorName) {
    contacts.push({
      fullName: orderData.realtorName,
      email: orderData.realtorEmail || null,
      phone: orderData.realtorPhone || null,
      role: ORDER_CONTACT_ROLES.REALTOR,
    });
  }

  return contacts;
}

/**
 * Get contacts linked to an order
 */
export async function getOrderContacts(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('order_contacts')
    .select(`
      contact_id,
      role_code,
      is_primary,
      contacts (
        id,
        first_name,
        last_name,
        email,
        phone,
        mobile,
        title,
        primary_role_code
      )
    `)
    .eq('order_id', orderId);

  if (error) {
    console.error('[OrderContacts] Error fetching order contacts:', error);
    return [];
  }

  return data || [];
}
