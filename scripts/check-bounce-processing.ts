import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Try to load environment variables
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.log('Could not load .env.local, using system environment variables');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBounceProcessing() {
  console.log('=== BOUNCE PROCESSING DIAGNOSTIC ===\n');

  const bouncedEmails = [
    'rrawat@appraisal-nation.com',
    'appraisal@usaappraisal.com',
    'appraisalvendor@timlosinc.com',
    'rjohnson@appraisallinks-amc.com',
    'hlawson@appraisal-nation.com',
    'brandon.barnes@drmconline.com',
    'dweber@nationwide-appraisal.com',
    'amc@lewisamc.com',
    'appraisals@rpm-appraisals.com'
  ];

  console.log(`Checking ${bouncedEmails.length} bounced emails...\n`);

  // Check 1: Email Suppressions
  console.log('=== EMAIL SUPPRESSIONS ===');
  const { data: suppressions, error: suppressionError } = await supabase
    .from('email_suppressions')
    .select('*')
    .in('email', bouncedEmails)
    .order('created_at', { ascending: false });

  if (suppressionError) {
    console.error('Error fetching suppressions:', suppressionError);
  } else if (suppressions && suppressions.length > 0) {
    console.table(suppressions.map(s => ({
      email: s.email,
      reason: s.reason,
      bounce_type: s.bounce_type,
      bounce_count: s.bounce_count,
      last_bounce_at: s.last_bounce_at,
      created_at: s.created_at
    })));
  } else {
    console.log('❌ No email suppressions found\n');
  }

  // Check 2: Contacts and Tags
  console.log('\n=== CONTACT TAGS ===');
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('id, email, first_name, last_name, tags')
    .in('email', bouncedEmails);

  if (contactError) {
    console.error('Error fetching contacts:', contactError);
  } else if (contacts && contacts.length > 0) {
    console.table(contacts.map(c => ({
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      has_bounce_tag: c.tags?.email_bounced_hard || c.tags?.email_bounced_soft ? 'YES' : 'NO',
      bounce_type: c.tags?.email_bounced_hard ? 'HARD' : c.tags?.email_bounced_soft ? 'SOFT' : 'NONE'
    })));
  } else {
    console.log('❌ No contacts found with these emails\n');
  }

  // Check 3: Email Notifications
  console.log('\n=== EMAIL NOTIFICATIONS ===');
  const { data: notifications, error: notifError } = await supabase
    .from('email_notifications')
    .select('*')
    .in('email', bouncedEmails)
    .order('created_at', { ascending: false });

  if (notifError) {
    console.error('Error fetching notifications:', notifError);
  } else if (notifications && notifications.length > 0) {
    console.table(notifications.map(n => ({
      email: n.email,
      type: n.type,
      title: n.title,
      is_read: n.is_read,
      created_at: n.created_at
    })));
  } else {
    console.log('❌ No email notifications found\n');
  }

  // Check 4: Contacts with Client Info
  console.log('\n=== CONTACTS IN SYSTEM ===');
  const { data: contactsWithClient, error: clientError } = await supabase
    .from('contacts')
    .select(`
      id,
      email,
      first_name,
      last_name,
      client_id,
      clients (
        name,
        org_id
      )
    `)
    .in('email', bouncedEmails);

  if (clientError) {
    console.error('Error fetching contacts with clients:', clientError);
  } else if (contactsWithClient && contactsWithClient.length > 0) {
    console.table(contactsWithClient.map((c: any) => ({
      email: c.email,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      client_name: Array.isArray(c.clients) ? c.clients[0]?.name : c.clients?.name,
      org_id: Array.isArray(c.clients) ? c.clients[0]?.org_id : c.clients?.org_id
    })));
  } else {
    console.log('❌ No contacts found\n');
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  const summary = {
    total_bounced_emails: bouncedEmails.length,
    emails_suppressed: suppressions?.length || 0,
    contacts_in_system: contacts?.length || 0,
    contacts_tagged: contacts?.filter(c => c.tags?.email_bounced_hard || c.tags?.email_bounced_soft).length || 0,
    notifications_created: notifications?.length || 0
  };
  console.table([summary]);

  // Analysis
  console.log('\n=== ANALYSIS ===');
  if (summary.emails_suppressed === 0) {
    console.log('❌ WEBHOOK NOT PROCESSING: No email suppressions created');
  } else if (summary.emails_suppressed < summary.total_bounced_emails) {
    console.log(`⚠️  PARTIAL PROCESSING: Only ${summary.emails_suppressed}/${summary.total_bounced_emails} emails suppressed`);
  } else {
    console.log('✅ Suppressions created');
  }

  if (summary.contacts_in_system === 0) {
    console.log('⚠️  No contacts found for bounced emails (may be expected if emails are from external sources)');
  } else {
    console.log(`📋 ${summary.contacts_in_system} contacts found in system`);

    if (summary.contacts_tagged === 0) {
      console.log('❌ NO TAGS APPLIED: Contacts not tagged with bounce status');
    } else if (summary.contacts_tagged < summary.contacts_in_system) {
      console.log(`⚠️  PARTIAL TAGGING: Only ${summary.contacts_tagged}/${summary.contacts_in_system} contacts tagged`);
    } else {
      console.log('✅ All contacts properly tagged');
    }
  }

  if (summary.notifications_created === 0) {
    console.log('❌ NO NOTIFICATIONS: Email notifications not created');
  } else {
    console.log(`✅ ${summary.notifications_created} notifications created`);
  }

  console.log('\n=== CONCLUSION ===');
  if (summary.emails_suppressed === 0) {
    console.log('🚨 WEBHOOK IS NOT WORKING - No bounce processing detected');
  } else if (summary.emails_suppressed === summary.total_bounced_emails &&
             summary.contacts_tagged === summary.contacts_in_system &&
             summary.notifications_created > 0) {
    console.log('✅ WEBHOOK IS WORKING CORRECTLY - All bounces processed');
  } else {
    console.log('⚠️  WEBHOOK IS PARTIALLY WORKING - Some processing occurred but not complete');
  }
}

checkBounceProcessing().catch(console.error);
