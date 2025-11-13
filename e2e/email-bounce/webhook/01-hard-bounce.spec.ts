/**
 * Email Bounce Webhook - Hard Bounce Test
 *
 * Tests that hard bounce events are properly processed:
 * - Tag added to contact
 * - Suppression created
 * - Notification sent
 *
 * Uses fixtures for test isolation to enable parallel execution.
 */

import { test, expect, getContactState } from '../fixtures';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Email Bounce Webhook - Hard Bounce', () => {
  // Note: testContact and webhookUrl are now provided by fixtures
  // Each test gets its own isolated test data

  test('should process hard bounce event correctly', async ({ request, testContact, webhookUrl }) => {
    console.log(`Test: Processing hard bounce event for ${testContact.email}...`);

    // Step 1: Send hard bounce webhook
    console.log('Step 1: Sending webhook...');
    const response = await request.post(webhookUrl, {
      data: {
        type: 'email.bounced',
        data: {
          to: testContact.email,
          email_id: `test_email_001_hard_bounce_${testContact.id}`,
          bounce: {
            type: 'Permanent',
            subType: 'General',
            message: '550 5.1.1 User unknown',
          },
        },
      },
    });

    // Verify webhook accepted
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.received).toBe(true);

    console.log('✓ Webhook accepted');

    // Step 2: Wait for async processing (webhook takes ~600-1000ms)
    console.log('Step 2: Waiting for webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Verify suppression created
    console.log('Step 3: Verifying suppression...');
    const { data: suppression, error: suppressionError} = await supabase
      .from('email_suppressions')
      .select('*')
      .eq('contact_id', testContact.id)
      .single();

    expect(suppressionError).toBeNull();
    expect(suppression).toBeTruthy();
    expect(suppression.email).toBe(testContact.email);
    expect(suppression.reason).toBe('bounce');
    expect(suppression.bounce_type).toBe('Permanent');
    expect(suppression.bounce_count).toBe(1);
    expect(suppression.last_bounce_at).toBeTruthy();

    console.log('✓ Suppression created correctly:', {
      reason: suppression.reason,
      type: suppression.bounce_type,
      count: suppression.bounce_count,
    });

    // Step 4: Verify tag added to contact
    console.log('Step 4: Verifying contact tag...');
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', testContact.id)
      .single();

    expect(contactError).toBeNull();
    expect(contact).toBeTruthy();
    expect(contact.tags).toBeTruthy();
    expect(Array.isArray(contact.tags)).toBe(true);
    expect(contact.tags).toContain('email_bounced_hard');

    console.log('✓ Tag added to contact:', contact.tags);

    // Step 5: Verify notification created
    console.log('Step 5: Verifying notification...');
    const { data: notification, error: notificationError } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('contact_id', testContact.id)
      .eq('type', 'bounce_hard')
      .single();

    expect(notificationError).toBeNull();
    expect(notification).toBeTruthy();
    expect(notification.email).toBe(testContact.email);
    expect(notification.title).toContain('Hard Bounce');
    expect(notification.title).toContain(testContact.first_name);
    expect(notification.title).toContain(testContact.last_name);
    expect(notification.message).toContain('permanently bounced');
    expect(notification.is_read).toBe(false);
    expect(notification.metadata).toBeTruthy();

    console.log('✓ Notification created:', {
      type: notification.type,
      title: notification.title,
      is_read: notification.is_read,
    });

    // Step 6: Verify complete state using helper
    console.log('Step 6: Verifying complete contact state...');
    const finalState = await getContactState(testContact.id);

    expect(finalState.hasHardBounceTag).toBe(true);
    expect(finalState.hasSoftBounceTag).toBe(false);
    expect(finalState.isSuppressed).toBe(true);
    expect(finalState.suppressionReason).toBe('bounce');
    expect(finalState.bounceCount).toBe(1);
    expect(finalState.notificationCount).toBe(1);

    console.log('✓ Final state verified:', finalState);
    console.log('✓ Test completed successfully');
  });

  test('should handle duplicate hard bounce (increment count)', async ({ request, testContact, webhookUrl }) => {
    console.log(`Test: Processing duplicate hard bounce for ${testContact.email}...`);

    // Step 1: Send first hard bounce
    console.log('Step 1: Sending first hard bounce...');
    await request.post(webhookUrl, {
      data: {
        type: 'email.bounced',
        data: {
          to: testContact.email,
          bounce: { type: 'Permanent', message: 'First bounce' },
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Send second hard bounce
    console.log('Step 2: Sending second hard bounce...');
    const response2 = await request.post(webhookUrl, {
      data: {
        type: 'email.bounced',
        data: {
          to: testContact.email,
          bounce: { type: 'Permanent', message: 'Second bounce' },
        },
      },
    });

    expect(response2.status()).toBe(200);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Verify suppression updated (not duplicated)
    console.log('Step 3: Verifying suppression count...');
    const { data: suppressions, error } = await supabase
      .from('email_suppressions')
      .select('*')
      .eq('contact_id', testContact.id);

    expect(error).toBeNull();
    expect(suppressions).toBeTruthy();
    expect(suppressions.length).toBe(1); // Only one suppression record

    const suppression = suppressions[0];
    expect(suppression.bounce_count).toBe(2); // Count incremented
    expect(suppression.bounce_message).toContain('Second bounce'); // Updated message

    console.log('✓ Suppression updated correctly:', {
      count: suppression.bounce_count,
      message: suppression.bounce_message,
    });

    // Step 4: Verify tag not duplicated
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', testContact.id)
      .single();

    const hardBounceTags = contact.tags.filter((t: string) => t === 'email_bounced_hard');
    expect(hardBounceTags.length).toBe(1); // Tag appears only once

    console.log('✓ Tag not duplicated');

    // Step 5: Verify multiple notifications created (one per bounce)
    const { data: notifications } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('contact_id', testContact.id)
      .eq('type', 'bounce_hard');

    expect(notifications).toBeTruthy();
    expect(notifications.length).toBe(2); // Two notifications

    console.log('✓ Multiple notifications created:', notifications.length);
    console.log('✓ Test completed successfully');
  });

  test('should include bounce metadata in notification', async ({ request, testContact, webhookUrl }) => {
    console.log(`Test: Verifying bounce metadata for ${testContact.email}...`);

    // Send hard bounce with detailed metadata
    await request.post(webhookUrl, {
      data: {
        type: 'email.bounced',
        data: {
          to: testContact.email,
          email_id: `test_metadata_001_${testContact.id}`,
          bounce: {
            type: 'Permanent',
            subType: 'NoEmail',
            message: 'Recipient address rejected: User unknown in local recipient table',
          },
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify notification metadata
    const { data: notification } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('contact_id', testContact.id)
      .single();

    expect(notification.metadata).toBeTruthy();
    expect(notification.metadata.bounce_type).toBe('Permanent');
    expect(notification.metadata.bounce_subtype).toBe('NoEmail');
    expect(notification.metadata.email_id).toBe(`test_metadata_001_${testContact.id}`);

    console.log('✓ Metadata captured:', notification.metadata);
    console.log('✓ Test completed successfully');
  });
});
