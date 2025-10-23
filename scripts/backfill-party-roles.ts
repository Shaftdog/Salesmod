import { createClient } from '@supabase/supabase-js';
import { mapPartyRole, isJunkRole } from '../src/lib/roles/mapPartyRole';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UnmappedValue {
  originalValue: string;
  count: number;
  entityType: 'contact' | 'client';
}

async function backfillRoles() {
  console.log('🚀 Starting role backfill...\n');
  
  const unmappedValues = new Map<string, UnmappedValue>();
  let contactsUpdated = 0;
  let clientsUpdated = 0;

  // ==========================================
  // 1. Backfill Contacts
  // ==========================================
  console.log('📞 Processing contacts...');
  
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, props')
    .is('primary_role_code', null);

  if (contacts) {
    for (const contact of contacts) {
      // Check for legacy role data in various props fields
      const legacyRole = 
        contact.props?.legacy_role || 
        contact.props?.hubspot_type || 
        contact.props?.category ||
        contact.props?.source_role_label;

      if (!legacyRole) continue;

      const roleCode = mapPartyRole(legacyRole);
      
      // Track unmapped values
      if (roleCode === 'unknown' && legacyRole.toLowerCase() !== 'unknown') {
        const key = legacyRole.toLowerCase();
        const existing = unmappedValues.get(key);
        if (existing) {
          existing.count++;
        } else {
          unmappedValues.set(key, {
            originalValue: legacyRole,
            count: 1,
            entityType: 'contact'
          });
        }
      }

      // Update contact
      const updateData: any = {
        primary_role_code: isJunkRole(roleCode) ? 'unknown' : roleCode,
        props: {
          ...contact.props,
          source_role_label: legacyRole
        }
      };

      if (isJunkRole(roleCode)) {
        updateData.props.exclude = true;
        updateData.props.exclude_reason = `Junk role from backfill: ${legacyRole}`;
      }

      await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contact.id);

      contactsUpdated++;
    }
  }

  console.log(`✅ Updated ${contactsUpdated} contacts\n`);

  // ==========================================
  // 2. Backfill Clients
  // ==========================================
  console.log('🏢 Processing clients...');

  const { data: clients } = await supabase
    .from('clients')
    .select('id, props')
    .is('primary_role_code', null);

  if (clients) {
    for (const client of clients) {
      const legacyRole = 
        client.props?.company_type || 
        client.props?.category ||
        client.props?.source_role_label;

      if (!legacyRole) continue;

      const roleCode = mapPartyRole(legacyRole);

      // Track unmapped values
      if (roleCode === 'unknown' && legacyRole.toLowerCase() !== 'unknown') {
        const key = legacyRole.toLowerCase();
        const existing = unmappedValues.get(key);
        if (existing) {
          existing.count++;
        } else {
          unmappedValues.set(key, {
            originalValue: legacyRole,
            count: 1,
            entityType: 'client'
          });
        }
      }

      // Update client
      const updateData: any = {
        primary_role_code: isJunkRole(roleCode) ? 'unknown' : roleCode,
        props: {
          ...client.props,
          source_role_label: legacyRole
        }
      };

      if (isJunkRole(roleCode)) {
        updateData.props.exclude = true;
        updateData.props.exclude_reason = `Junk role from backfill: ${legacyRole}`;
      }

      await supabase
        .from('clients')
        .update(updateData)
        .eq('id', client.id);

      clientsUpdated++;
    }
  }

  console.log(`✅ Updated ${clientsUpdated} clients\n`);

  // ==========================================
  // 3. Export Unmapped Values Report
  // ==========================================
  if (unmappedValues.size > 0) {
    console.log(`⚠️  Found ${unmappedValues.size} unmapped values\n`);

    const csvRows = [
      'Original Value,Count,Entity Type',
      ...Array.from(unmappedValues.values())
        .sort((a, b) => b.count - a.count)
        .map(v => `"${v.originalValue}",${v.count},${v.entityType}`)
    ];

    fs.writeFileSync('unmapped-roles.csv', csvRows.join('\n'));
    console.log('📄 Exported unmapped-roles.csv');
    console.log('\nTop unmapped values:');
    Array.from(unmappedValues.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach(v => {
        console.log(`  - "${v.originalValue}" (${v.count} ${v.entityType}s)`);
      });
  }

  // ==========================================
  // 4. Summary Stats
  // ==========================================
  console.log('\n📊 Role Distribution:\n');

  const { data: roleStats } = await supabase
    .from('contacts')
    .select('primary_role_code, party_roles(label)')
    .not('primary_role_code', 'is', null);

  if (roleStats) {
    const distribution = roleStats.reduce((acc, row) => {
      const partyRoles = row.party_roles as any;
      const label = (Array.isArray(partyRoles) ? partyRoles[0]?.label : partyRoles?.label) || row.primary_role_code;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([role, count]) => {
        console.log(`  ${role}: ${count}`);
      });
  }

  console.log('\n✨ Backfill complete!');
}

backfillRoles().catch(console.error);

