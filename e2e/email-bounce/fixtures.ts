/**
 * Email Bounce Testing - Playwright Fixtures
 *
 * Provides isolated test data for each test run to enable parallel execution.
 * Each test gets its own unique contacts and client.
 */

import { test as base } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generate a unique test ID for this test run
 */
function generateTestId(): string {
  return `test-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Generate a valid UUID
 */
function generateUuid(): string {
  return crypto.randomUUID();
}

/**
 * Test contact data structure
 */
export interface TestContact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  client_id: string;
}

/**
 * Test client data structure
 */
export interface TestClient {
  id: string;
  company_name: string;
  client_type: string;
  is_active: boolean;
  primary_contact: string;
  email: string;
  phone: string;
  address: string;
  billing_address: string;
  org_id: string;
}

/**
 * Test data for email bounce tests
 */
export interface BounceTestData {
  testId: string;
  client: TestClient;
  contacts: {
    HARD_BOUNCE: TestContact;
    SOFT_BOUNCE: TestContact;
    VALID_CONTACT: TestContact;
    MULTIPLE_BOUNCE: TestContact;
    SUPPRESSED: TestContact;
  };
}

/**
 * Create test data for a single test run
 */
async function createTestData(orgId: string): Promise<BounceTestData> {
  const testId = generateTestId();

  // Create unique client for this test
  const clientId = generateUuid();
  const client: TestClient = {
    id: clientId,
    company_name: `Bounce Test Client ${testId}`,
    client_type: 'company',
    is_active: true,
    primary_contact: 'Test Contact',
    email: `client-${testId}@example.com`,
    phone: '555-0100',
    address: '123 Test St, Test City, FL 12345',
    billing_address: '123 Test St, Test City, FL 12345',
    org_id: orgId,
  };

  // Insert client
  const { error: clientError } = await supabase
    .from('clients')
    .insert(client);

  if (clientError) {
    throw new Error(`Failed to create test client: ${clientError.message}`);
  }

  // Create unique contacts for this test
  const contacts = {
    HARD_BOUNCE: {
      id: generateUuid(),
      email: `hardbounce-${testId}@example.com`,
      first_name: 'Hard',
      last_name: `Bounce-${testId}`,
      client_id: clientId,
    },
    SOFT_BOUNCE: {
      id: generateUuid(),
      email: `softbounce-${testId}@example.com`,
      first_name: 'Soft',
      last_name: `Bounce-${testId}`,
      client_id: clientId,
    },
    VALID_CONTACT: {
      id: generateUuid(),
      email: `valid-${testId}@example.com`,
      first_name: 'Valid',
      last_name: `Contact-${testId}`,
      client_id: clientId,
    },
    MULTIPLE_BOUNCE: {
      id: generateUuid(),
      email: `multiplebounce-${testId}@example.com`,
      first_name: 'Multiple',
      last_name: `Bounce-${testId}`,
      client_id: clientId,
    },
    SUPPRESSED: {
      id: generateUuid(),
      email: `suppressed-${testId}@example.com`,
      first_name: 'Suppressed',
      last_name: `Contact-${testId}`,
      client_id: clientId,
    },
  };

  // Insert all contacts and return actual IDs from database
  const contactsArray = Object.values(contacts).map(contact => ({
    ...contact,
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data: insertedContacts, error: contactsError } = await supabase
    .from('contacts')
    .insert(contactsArray)
    .select();

  if (contactsError || !insertedContacts) {
    throw new Error(`Failed to create test contacts: ${contactsError?.message}`);
  }

  // Map inserted contacts back to our contact structure
  const insertedContactsMap = {
    HARD_BOUNCE: insertedContacts.find(c => c.email === contacts.HARD_BOUNCE.email)!,
    SOFT_BOUNCE: insertedContacts.find(c => c.email === contacts.SOFT_BOUNCE.email)!,
    VALID_CONTACT: insertedContacts.find(c => c.email === contacts.VALID_CONTACT.email)!,
    MULTIPLE_BOUNCE: insertedContacts.find(c => c.email === contacts.MULTIPLE_BOUNCE.email)!,
    SUPPRESSED: insertedContacts.find(c => c.email === contacts.SUPPRESSED.email)!,
  };

  return {
    testId,
    client,
    contacts: insertedContactsMap,
  };
}

/**
 * Clean up test data after test completion
 */
async function cleanupTestData(data: BounceTestData) {
  const contactIds = Object.values(data.contacts).map(c => c.id);

  try {
    // Delete notifications
    await supabase
      .from('email_notifications')
      .delete()
      .in('contact_id', contactIds);

    // Delete suppressions
    await supabase
      .from('email_suppressions')
      .delete()
      .in('contact_id', contactIds);

    // Delete kanban cards
    await supabase
      .from('kanban_cards')
      .delete()
      .in('contact_id', contactIds);

    // Delete contacts
    await supabase
      .from('contacts')
      .delete()
      .in('id', contactIds);

    // Delete client
    await supabase
      .from('clients')
      .delete()
      .eq('id', data.client.id);

    console.log(`✓ Test data cleaned up for ${data.testId}`);
  } catch (error) {
    console.error(`Error cleaning up test data for ${data.testId}:`, error);
  }
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

/**
 * Playwright test fixtures with isolated test data
 */
type BounceTestFixtures = {
  bounceTestData: BounceTestData;
  testContact: TestContact;
  webhookUrl: string;
};

/**
 * Get or create a test org_id from the profiles table
 */
async function getTestOrgId(): Promise<string> {
  // Check if TEST_ORG_ID is set in environment
  if (process.env.TEST_ORG_ID) {
    return process.env.TEST_ORG_ID;
  }

  // Try to get an existing profile/org
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();

  if (profiles?.id) {
    return profiles.id;
  }

  // If no profiles exist, create a test profile
  const testOrgId = generateUuid();
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: testOrgId,
      email: `test-org-${Date.now()}@example.com`,
      full_name: 'Test Organization',
    });

  if (error) {
    throw new Error(`Failed to create test profile: ${error.message}`);
  }

  return testOrgId;
}

/**
 * Extended test with email bounce fixtures
 */
export const test = base.extend<BounceTestFixtures>({
  // Provide unique test data for each test
  bounceTestData: async ({}, use) => {
    // Get a valid org_id that exists in the profiles table
    // This is required because email_suppressions has a foreign key constraint
    const orgId = await getTestOrgId();

    console.log('Creating isolated test data...');
    const data = await createTestData(orgId);
    console.log(`✓ Test data created: ${data.testId} (org: ${orgId})`);

    // Provide data to test
    await use(data);

    // Cleanup after test completes
    console.log(`Cleaning up test data: ${data.testId}`);
    await cleanupTestData(data);
  },

  // Provide hard bounce test contact by default
  testContact: async ({ bounceTestData }, use) => {
    await use(bounceTestData.contacts.HARD_BOUNCE);
  },

  // Provide webhook URL
  webhookUrl: async ({}, use) => {
    await use('http://localhost:9002/api/email/webhook');
  },
});

export { expect } from '@playwright/test';
