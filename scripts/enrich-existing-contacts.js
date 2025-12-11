/**
 * Enrich existing contacts that are missing email/phone using Apollo.io
 * Usage: node scripts/enrich-existing-contacts.js [client_name]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

async function enrichWithApollo(firstName, lastName, companyName) {
  if (!APOLLO_API_KEY) {
    console.log('  [Apollo] No API key configured');
    return null;
  }

  try {
    const response = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        organization_name: companyName,
        reveal_personal_emails: true,
        // Note: reveal_phone_number requires webhook_url on some Apollo plans
      }),
    });

    if (!response.ok) {
      console.log(`  [Apollo] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.person || null;
  } catch (error) {
    console.log(`  [Apollo] Error: ${error.message}`);
    return null;
  }
}

function getBestEmail(person) {
  if (person.email) return person.email;
  if (person.personal_emails && person.personal_emails.length > 0) {
    return person.personal_emails[0];
  }
  return null;
}

function getBestPhone(person) {
  if (!person.phone_numbers || person.phone_numbers.length === 0) return null;
  const direct = person.phone_numbers.find(p => p.type === 'mobile' || p.type === 'direct');
  if (direct) return direct.sanitized_number || direct.raw_number;
  return person.phone_numbers[0].sanitized_number || person.phone_numbers[0].raw_number;
}

async function main() {
  const clientNameFilter = process.argv[2] || 'Rocket Close';

  console.log('=== ENRICH EXISTING CONTACTS ===');
  console.log(`Client filter: ${clientNameFilter}`);
  console.log(`Apollo API key: ${APOLLO_API_KEY ? 'configured' : 'MISSING'}`);
  console.log();

  if (!APOLLO_API_KEY) {
    console.error('ERROR: APOLLO_API_KEY not set in .env.local');
    process.exit(1);
  }

  // Find the client
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, company_name')
    .ilike('company_name', `%${clientNameFilter}%`);

  if (clientError || !clients || clients.length === 0) {
    console.error(`No clients found matching "${clientNameFilter}"`);
    process.exit(1);
  }

  console.log(`Found ${clients.length} matching client(s):`);
  clients.forEach(c => console.log(`  - ${c.company_name} (${c.id})`));
  console.log();

  let totalEnriched = 0;
  let totalSkipped = 0;
  let totalNoMatch = 0;

  for (const client of clients) {
    console.log(`\n--- Processing: ${client.company_name} ---`);

    // Find contacts without email AND without phone
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, title, tags')
      .eq('client_id', client.id)
      .or('email.is.null,phone.is.null');

    if (contactError) {
      console.error('Error fetching contacts:', contactError.message);
      continue;
    }

    // Filter to only contacts missing BOTH email and phone
    const needsEnrichment = contacts?.filter(c => !c.email && !c.phone) || [];

    console.log(`Found ${needsEnrichment.length} contacts needing enrichment`);

    for (const contact of needsEnrichment) {
      // Skip contacts with unknown last names
      if (!contact.last_name || contact.last_name.includes('UNKNOWN') || contact.last_name.includes('<')) {
        console.log(`  Skipping ${contact.first_name} ${contact.last_name} - invalid name`);
        totalSkipped++;
        continue;
      }

      console.log(`  Enriching: ${contact.first_name} ${contact.last_name}...`);

      const person = await enrichWithApollo(contact.first_name, contact.last_name, client.company_name);

      if (!person) {
        console.log(`    -> No match found`);
        totalNoMatch++;
        continue;
      }

      const email = getBestEmail(person);
      const phone = getBestPhone(person);

      if (!email && !phone) {
        console.log(`    -> Match found but no contact info`);
        totalNoMatch++;
        continue;
      }

      // Update the contact
      const updates = {};
      const newTags = [...(contact.tags || [])];

      if (email && !contact.email) {
        updates.email = email;
      }
      if (phone && !contact.phone) {
        updates.phone = phone;
      }
      if (person.title && !contact.title) {
        updates.title = person.title;
      }
      // Store linkedin in notes if found (no linkedin column in contacts table)
      if (person.linkedin_url && !updates.notes) {
        // Append to existing notes or create new
        updates.notes = `LinkedIn: ${person.linkedin_url}`;
      }

      // Add apollo-enriched tag if not already present
      if (!newTags.includes('apollo-enriched')) {
        newTags.push('apollo-enriched');
        updates.tags = newTags;
      }

      const { error: updateError } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contact.id);

      if (updateError) {
        console.log(`    -> Update failed: ${updateError.message}`);
      } else {
        console.log(`    -> Updated: email=${email || 'none'}, phone=${phone || 'none'}`);
        totalEnriched++;
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Enriched: ${totalEnriched}`);
  console.log(`Skipped (invalid name): ${totalSkipped}`);
  console.log(`No match/info: ${totalNoMatch}`);
}

main().catch(console.error);
