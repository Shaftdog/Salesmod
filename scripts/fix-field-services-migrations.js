#!/usr/bin/env node

/**
 * Fix Field Services Migrations
 *
 * Replaces references to public.organizations with public.profiles
 * since this schema uses profiles table for user/organization data.
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

const FILES_TO_FIX = [
  '20251110000002_field_services_phase4.sql',
  '20251110000003_field_services_phase5.sql',
  '20251110000004_field_services_phase6_analytics.sql',
  '20251110000005_field_services_phase7_integrations.sql',
  '20251110000006_field_services_phase8_advanced.sql',
];

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║     Field Services Migration Fixer                                ║');
console.log('║     Replacing organizations references with profiles             ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log('\n');

let totalReplacements = 0;

for (const filename of FILES_TO_FIX) {
  const filePath = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  SKIP: ${filename} (not found)`);
    continue;
  }

  console.log(`Processing: ${filename}`);

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Replace all references to public.organizations with public.profiles
  content = content.replace(/REFERENCES public\.organizations\(id\)/g, 'REFERENCES public.profiles(id)');
  content = content.replace(/FROM public\.organizations/g, 'FROM public.profiles');
  content = content.replace(/SELECT id FROM public\.organizations WHERE/g, 'SELECT id FROM public.profiles WHERE');

  // Replace JWT-based RLS policies with auth.uid() pattern
  // Pattern: org_id IN (SELECT id FROM public.profiles WHERE id = (auth.jwt()->>'org_id')::uuid)
  // Replace with: auth.uid() = org_id
  content = content.replace(/org_id IN \(SELECT id FROM public\.profiles WHERE id = \(auth\.jwt\(\)->>'org_id'\)::uuid\)/g, 'auth.uid() = org_id');

  // Also handle the simpler pattern if it exists
  content = content.replace(/\(auth\.jwt\(\)->>'org_id'\)::uuid/g, 'auth.uid()');

  // Fix RLS policies for bookable_resources (which extends profiles table)
  // Since bookable_resources.id IS the profile.id, we check resource_id = auth.uid()
  content = content.replace(/resource_id IN \(SELECT id FROM public\.bookable_resources WHERE org_id = auth\.uid\(\)\)/g, 'resource_id = auth.uid()');
  content = content.replace(/org_id IN \(SELECT id FROM public\.bookable_resources WHERE org_id = auth\.uid\(\)\)/g, 'id = auth.uid()');

  // Fix RLS policies for route_plans (check through resource_id)
  content = content.replace(/route_plan_id IN \(SELECT id FROM public\.route_plans WHERE org_id = auth\.uid\(\)\)/g, 'route_plan_id IN (SELECT id FROM public.route_plans WHERE resource_id = auth.uid())');

  // Count all replacements
  const matches1 = originalContent.match(/REFERENCES public\.organizations\(id\)/g) || [];
  const matches2 = originalContent.match(/FROM public\.organizations/g) || [];
  const matches3 = originalContent.match(/SELECT id FROM public\.organizations WHERE/g) || [];
  const matches4 = originalContent.match(/org_id IN \(SELECT id FROM public\.profiles WHERE id = \(auth\.jwt\(\)->>'org_id'\)::uuid\)/g) || [];
  const matches5 = originalContent.match(/\(auth\.jwt\(\)->>'org_id'\)::uuid/g) || [];
  const matches6a = originalContent.match(/resource_id IN \(SELECT id FROM public\.bookable_resources WHERE org_id = auth\.uid\(\)\)/g) || [];
  const matches6b = originalContent.match(/org_id IN \(SELECT id FROM public\.bookable_resources WHERE org_id = auth\.uid\(\)\)/g) || [];
  const matches7 = originalContent.match(/route_plan_id IN \(SELECT id FROM public\.route_plans WHERE org_id = auth\.uid\(\)\)/g) || [];
  const count = matches1.length + matches2.length + matches3.length + matches4.length + matches5.length + matches6a.length + matches6b.length + matches7.length;

  if (count > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Fixed ${count} reference(s)`);
    totalReplacements += count;
  } else {
    console.log(`  ℹ️  No changes needed`);
  }
}

console.log('\n');
console.log(`${'='.repeat(70)}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log(`${'='.repeat(70)}`);
console.log('\n');

if (totalReplacements > 0) {
  console.log('✅ Migration files have been fixed!');
  console.log('You can now run: node scripts/run-field-services-migrations.js');
} else {
  console.log('ℹ️  No changes were needed.');
}

console.log('\n');
