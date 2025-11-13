/**
 * Email Bounce Testing - Test Data Setup
 *
 * This script sets up and tears down test data for email bounce testing.
 * Run before and after test suites to ensure clean state.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test contact IDs (fixed UUIDs for consistent testing)
export const TEST_CONTACTS = {
  HARD_BOUNCE: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'hardbounce@example.com',
    first_name: 'Hard',
    last_name: 'Bounce',
  },
  SOFT_BOUNCE: {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'softbounce@example.com',
    first_name: 'Soft',
    last_name: 'Bounce',
  },
  VALID_CONTACT: {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'valid@example.com',
    first_name: 'Valid',
    last_name: 'Contact',
  },
  MULTIPLE_BOUNCE: {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'multiplebounce@example.com',
    first_name: 'Multiple',
    last_name: 'Bounce',
  },
  SUPPRESSED: {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'suppressed@example.com',
    first_name: 'Suppressed',
    last_name: 'Contact',
  },
};

export const TEST_CLIENT = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  company_name: 'Test Bounce Client',
  client_type: 'company',
  is_active: true,
  primary_contact: 'Test Contact',
  email: 'testclient@example.com',
  phone: '555-0100',
  address: '123 Test St, Test City, FL 12345',
  billing_address: '123 Test St, Test City, FL 12345',
};

/**
 * Set up test client and contacts
 */
export async function setupTestData(orgId: string) {
  console.log('Setting up test data for email bounce tests...');

  try {
    // 1. Create test client
    const { error: clientError } = await supabase
      .from('clients')
      .upsert({
        ...TEST_CLIENT,
        org_id: orgId,
      });

    if (clientError) {
      console.error('Error creating test client:', clientError);
      throw clientError;
    }

    console.log('✓ Test client created');

    // 2. Create test contacts
    const contacts = Object.values(TEST_CONTACTS).map(contact => ({
      ...contact,
      client_id: TEST_CLIENT.id,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: contactsError } = await supabase
      .from('contacts')
      .upsert(contacts);

    if (contactsError) {
      console.error('Error creating test contacts:', contactsError);
      throw contactsError;
    }

    console.log(`✓ ${contacts.length} test contacts created`);

    // 3. Clean up any existing test data (notifications, suppressions)
    await cleanupTestArtifacts();

    console.log('✓ Test data setup complete');

    return {
      clientId: TEST_CLIENT.id,
      contacts: TEST_CONTACTS,
    };
  } catch (error) {
    console.error('Failed to set up test data:', error);
    throw error;
  }
}

/**
 * Clean up test artifacts (notifications, suppressions, cards)
 * Leaves contacts and client in place for reuse
 */
export async function cleanupTestArtifacts() {
  console.log('Cleaning up test artifacts...');

  const contactIds = Object.values(TEST_CONTACTS).map(c => c.id);

  try {
    // Delete notifications
    const { error: notifError } = await supabase
      .from('email_notifications')
      .delete()
      .in('contact_id', contactIds);

    if (notifError) console.error('Error deleting notifications:', notifError);

    // Delete suppressions
    const { error: suppressError } = await supabase
      .from('email_suppressions')
      .delete()
      .in('contact_id', contactIds);

    if (suppressError) console.error('Error deleting suppressions:', suppressError);

    // Delete kanban cards
    const { error: cardsError } = await supabase
      .from('kanban_cards')
      .delete()
      .in('contact_id', contactIds);

    if (cardsError) console.error('Error deleting cards:', cardsError);

    // Reset contact tags
    const { error: tagsError } = await supabase
      .from('contacts')
      .update({ tags: [] })
      .in('id', contactIds);

    if (tagsError) console.error('Error resetting tags:', tagsError);

    console.log('✓ Test artifacts cleaned up');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

/**
 * Completely remove all test data (client, contacts, artifacts)
 */
export async function teardownTestData() {
  console.log('Tearing down all test data...');

  try {
    await cleanupTestArtifacts();

    const contactIds = Object.values(TEST_CONTACTS).map(c => c.id);

    // Delete contacts
    const { error: contactsError } = await supabase
      .from('contacts')
      .delete()
      .in('id', contactIds);

    if (contactsError) console.error('Error deleting contacts:', contactsError);

    // Delete client
    const { error: clientError } = await supabase
      .from('clients')
      .delete()
      .eq('id', TEST_CLIENT.id);

    if (clientError) console.error('Error deleting client:', clientError);

    console.log('✓ All test data removed');
  } catch (error) {
    console.error('Error during teardown:', error);
  }
}

/**
 * Verify test data is properly set up
 */
export async function verifyTestData() {
  console.log('Verifying test data...');

  const contactIds = Object.values(TEST_CONTACTS).map(c => c.id);

  // Check client exists
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', TEST_CLIENT.id)
    .single();

  if (clientError || !client) {
    console.error('❌ Test client not found');
    return false;
  }

  // Check contacts exist
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('*')
    .in('id', contactIds);

  if (contactsError || !contacts || contacts.length !== contactIds.length) {
    console.error(`❌ Expected ${contactIds.length} contacts, found ${contacts?.length || 0}`);
    return false;
  }

  // Verify all contacts have clean state
  const hasTaggedContacts = contacts.some(c => c.tags && c.tags.length > 0);
  if (hasTaggedContacts) {
    console.warn('⚠ Some contacts have tags (not clean state)');
  }

  // Check for existing suppressions
  const { data: suppressions } = await supabase
    .from('email_suppressions')
    .select('*')
    .in('contact_id', contactIds);

  if (suppressions && suppressions.length > 0) {
    console.warn(`⚠ Found ${suppressions.length} existing suppressions`);
  }

  // Check for existing notifications
  const { data: notifications } = await supabase
    .from('email_notifications')
    .select('*')
    .in('contact_id', contactIds);

  if (notifications && notifications.length > 0) {
    console.warn(`⚠ Found ${notifications.length} existing notifications`);
  }

  console.log('✓ Test data verified');
  console.log(`  Client: ${client.company_name}`);
  console.log(`  Contacts: ${contacts.length}`);
  console.log(`  Suppressions: ${suppressions?.length || 0}`);
  console.log(`  Notifications: ${notifications?.length || 0}`);

  return true;
}

/**
 * Create a specific bounce state for testing
 */
export async function createBounceState(
  contactId: string,
  state: 'hard_bounce' | 'soft_bounce_1' | 'soft_bounce_2' | 'soft_bounce_3' | 'suppressed'
) {
  console.log(`Creating ${state} state for contact ${contactId}...`);

  const contact = Object.values(TEST_CONTACTS).find(c => c.id === contactId);
  if (!contact) {
    throw new Error(`Unknown contact ID: ${contactId}`);
  }

  // Get org_id from client
  const { data: client } = await supabase
    .from('clients')
    .select('org_id')
    .eq('id', TEST_CLIENT.id)
    .single();

  if (!client) {
    throw new Error('Test client not found');
  }

  const orgId = client.org_id;

  switch (state) {
    case 'hard_bounce':
      // Add hard bounce tag
      await supabase.rpc('add_contact_tag', {
        p_contact_id: contactId,
        p_tag: 'email_bounced_hard',
      });

      // Create suppression
      await supabase.from('email_suppressions').insert({
        org_id: orgId,
        contact_id: contactId,
        email: contact.email,
        reason: 'bounce',
        bounce_type: 'Permanent',
        bounce_count: 1,
        last_bounce_at: new Date().toISOString(),
      });

      // Create notification
      await supabase.from('email_notifications').insert({
        org_id: orgId,
        contact_id: contactId,
        type: 'bounce_hard',
        email: contact.email,
        title: `Hard Bounce: ${contact.first_name} ${contact.last_name}`,
        message: 'Email permanently bounced',
        is_read: false,
      });
      break;

    case 'soft_bounce_1':
    case 'soft_bounce_2':
      const bounceCount = state === 'soft_bounce_1' ? 1 : 2;

      // Create tracking suppression (not fully suppressed yet)
      await supabase.from('email_suppressions').upsert({
        org_id: orgId,
        contact_id: contactId,
        email: contact.email,
        reason: 'soft_bounce_tracking',
        bounce_type: 'Transient',
        bounce_count: bounceCount,
        last_bounce_at: new Date().toISOString(),
      });
      // No tag or notification yet
      break;

    case 'soft_bounce_3':
      // Add soft bounce tag
      await supabase.rpc('add_contact_tag', {
        p_contact_id: contactId,
        p_tag: 'email_bounced_soft',
      });

      // Create suppression
      await supabase.from('email_suppressions').upsert({
        org_id: orgId,
        contact_id: contactId,
        email: contact.email,
        reason: 'bounce',
        bounce_type: 'Transient',
        bounce_count: 3,
        last_bounce_at: new Date().toISOString(),
      });

      // Create notification
      await supabase.from('email_notifications').insert({
        org_id: orgId,
        contact_id: contactId,
        type: 'bounce_soft',
        email: contact.email,
        title: `Soft Bounce (3x): ${contact.first_name} ${contact.last_name}`,
        message: 'Email bounced 3 times',
        is_read: false,
      });
      break;

    case 'suppressed':
      // Create manual suppression
      await supabase.from('email_suppressions').upsert({
        org_id: orgId,
        contact_id: contactId,
        email: contact.email,
        reason: 'manual',
        details: 'Manually suppressed for testing',
      });
      break;
  }

  console.log(`✓ ${state} state created`);
}

/**
 * Get current state of a contact
 */
export async function getContactState(contactId: string) {
  const { data: contact } = await supabase
    .from('contacts')
    .select('tags')
    .eq('id', contactId)
    .single();

  const { data: suppression } = await supabase
    .from('email_suppressions')
    .select('*')
    .eq('contact_id', contactId)
    .single();

  const { data: notifications } = await supabase
    .from('email_notifications')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  return {
    tags: contact?.tags || [],
    suppression: suppression || null,
    notifications: notifications || [],
    hasHardBounceTag: contact?.tags?.includes('email_bounced_hard') || false,
    hasSoftBounceTag: contact?.tags?.includes('email_bounced_soft') || false,
    isSuppressed: !!suppression,
    suppressionReason: suppression?.reason,
    bounceCount: suppression?.bounce_count || 0,
    notificationCount: notifications?.length || 0,
  };
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  const orgId = process.argv[3];

  if (!orgId) {
    console.error('Usage: ts-node setup-test-data.ts <command> <org_id>');
    console.error('Commands: setup, cleanup, teardown, verify');
    process.exit(1);
  }

  (async () => {
    switch (command) {
      case 'setup':
        await setupTestData(orgId);
        break;
      case 'cleanup':
        await cleanupTestArtifacts();
        break;
      case 'teardown':
        await teardownTestData();
        break;
      case 'verify':
        await verifyTestData();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  })();
}
