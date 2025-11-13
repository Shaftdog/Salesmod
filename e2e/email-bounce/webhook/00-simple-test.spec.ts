/**
 * Simplified webhook test to debug notification issue
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_CONTACT_ID = '11111111-1111-1111-1111-111111111111';
const ORG_ID = 'bde00714-427d-4024-9fbd-6f895824f733';

test.describe('Simplified Webhook Test', () => {
  test('debug notification creation', async ({ request }) => {
    console.log('=== SIMPLIFIED WEBHOOK TEST ===');

    // Step 1: Clean up
    console.log('\nStep 1: Cleanup...');
    await supabase.from('email_notifications').delete().eq('contact_id', TEST_CONTACT_ID);
    await supabase.from('email_suppressions').delete().eq('contact_id', TEST_CONTACT_ID);
    await supabase.from('contacts').update({ tags: [] }).eq('id', TEST_CONTACT_ID);

    // Verify clean
    const { data: beforeNotifs } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('contact_id', TEST_CONTACT_ID);
    console.log('Notifications before:', beforeNotifs?.length);
    expect(beforeNotifs?.length || 0).toBe(0);

    // Step 2: Send webhook
    console.log('\nStep 2: Sending webhook...');
    const response = await request.post('http://localhost:9002/api/email/webhook', {
      data: {
        type: 'email.bounced',
        data: {
          to: 'hardbounce@example.com',
          email_id: 'simple_test_001',
          bounce: {
            type: 'Permanent',
            subType: 'General',
            message: '550 Test',
          },
        },
      },
    });

    console.log('Response status:', response.status());
    const body = await response.json();
    console.log('Response body:', body);
    expect(response.status()).toBe(200);

    // Step 3: Wait
    console.log('\nStep 3: Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check everything
    console.log('\nStep 4: Checking results...');

    const { data: suppression } = await supabase
      .from('email_suppressions')
      .select('*')
      .eq('contact_id', TEST_CONTACT_ID)
      .single();
    console.log('Suppression found:', !!suppression);

    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', TEST_CONTACT_ID)
      .single();
    console.log('Contact tags:', contact?.tags);

    const { data: notifs, error: notifsError } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('contact_id', TEST_CONTACT_ID);
    console.log('Notifications query error:', notifsError);
    console.log('Notifications found:', notifs?.length);
    if (notifs && notifs.length > 0) {
      console.log('Notification details:', JSON.stringify(notifs[0], null, 2));
    }

    // Step 5: Try direct query by org_id
    const { data: notifsbyOrg } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('org_id', ORG_ID);
    console.log('\nAll notifications for org:', notifsbyOrg?.length);

    // Assertions
    expect(suppression).toBeTruthy();
    expect(contact?.tags).toContain('email_bounced_hard');
    expect(notifs?.length).toBeGreaterThan(0);
  });
});
