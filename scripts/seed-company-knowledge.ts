/**
 * Seed Company Knowledge for ROI Home Services
 *
 * This script populates the agent_memories table with company knowledge
 * so the AI agent knows about the business it's serving.
 *
 * Run with: npx tsx scripts/seed-company-knowledge.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ROI Home Services company knowledge
const roiHomeServicesKnowledge = {
  name: 'ROI Home Services',
  tagline: 'Property Appraisals & Real Estate Consulting - Your Trusted Partner in Florida',
  address: '100 E Pine St., #110, Orlando, FL 32801',
  phone: '407-759-3611',
  email: 'info@roihomesvc.com',
  website: 'https://www.roihomesvc.com',
  description: `ROI Home Services is a Florida-based property appraisal and real estate consulting firm serving Central Florida and beyond. We provide comprehensive appraisal services for residential and commercial properties, helping clients make informed real estate decisions. Our team of experienced appraisers delivers accurate, timely, and USPAP-compliant valuations.`,
  services: [
    // Core Services
    {
      name: 'Residential Appraisal',
      description: 'Accurate property valuations for single-family homes, condos, and multi-family properties',
      category: 'Core Services'
    },
    {
      name: 'Commercial Appraisal',
      description: 'Professional valuations for commercial properties including office, retail, and industrial',
      category: 'Core Services'
    },
    {
      name: 'Long-Term Rent Survey',
      description: 'Market rent analysis for investment properties and landlords seeking rental rates',
      category: 'Core Services'
    },
    {
      name: 'Short-Term Rent Survey',
      description: 'Vacation rental market analysis for Airbnb, VRBO, and short-term rental properties',
      category: 'Core Services'
    },
    {
      name: 'Operating Rent Statement',
      description: 'Financial analysis for rental properties including income/expense review',
      category: 'Core Services'
    },
    {
      name: 'Transaction Coordination',
      description: 'Real estate transaction management and support services',
      category: 'Core Services'
    },
    // Solution Packages
    {
      name: 'Tax Appeal Package',
      description: 'Property tax challenge support with appraisal evidence for assessment appeals',
      category: 'Solutions'
    },
    {
      name: 'Pre-Listing Appraisal',
      description: 'Seller pricing strategy support with accurate valuation before listing',
      category: 'Solutions'
    },
    {
      name: 'FSBO Package',
      description: 'For Sale By Owner support including appraisal and transaction guidance',
      category: 'Solutions'
    },
    {
      name: 'Investor Valuation Package',
      description: 'Investment property analysis including cash flow, ROI, and value assessment',
      category: 'Solutions'
    },
    {
      name: 'Home Measurement Services',
      description: 'Professional square footage verification and property measurement',
      category: 'Solutions'
    }
  ],
  serviceAreas: [
    'Central Florida (Orlando Metro)',
    'Tampa Bay',
    'Jacksonville',
    'South Florida (Miami-Dade)',
    'Space Coast',
    'Treasure Coast',
    'First Coast',
    'Statewide Florida Coverage'
  ],
  team: [
    { name: 'Rod', role: 'Lead Appraiser / Owner' },
    { name: 'Bert', role: 'Senior Appraiser' },
    { name: 'Chuck', role: 'Appraiser' },
    { name: 'Lisa', role: 'Scheduling Coordinator' }
  ],
  businessHours: 'Monday-Friday, 9:00 AM - 5:00 PM Eastern Time',
  specializations: [
    'USPAP-Compliant Valuations',
    'Lender Appraisals',
    'Estate & Divorce Valuations',
    'Tax Appeal Support',
    'Investment Property Analysis',
    'Construction Draw Inspections',
    'Retrospective Valuations',
    'Desktop & Drive-By Appraisals'
  ]
};

async function seedCompanyKnowledge() {
  console.log('Seeding company knowledge for ROI Home Services...\n');

  // First, get all tenants (or a specific tenant)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, tenant_id, email')
    .not('tenant_id', 'is', null);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profiles with tenant_id found.');
    return;
  }

  // Get unique tenant IDs
  const tenantIds = [...new Set(profiles.map(p => p.tenant_id))];
  console.log(`Found ${tenantIds.length} unique tenants`);

  for (const tenantId of tenantIds) {
    // Check if company knowledge already exists for this tenant
    const { data: existing } = await supabase
      .from('agent_memories')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('scope', 'company_knowledge')
      .eq('key', 'company_profile')
      .single();

    if (existing) {
      console.log(`Updating existing company knowledge for tenant ${tenantId}`);

      const { error: updateError } = await supabase
        .from('agent_memories')
        .update({
          content: roiHomeServicesKnowledge,
          importance: 1.0, // Maximum importance
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`Error updating tenant ${tenantId}:`, updateError);
      } else {
        console.log(`Updated company knowledge for tenant ${tenantId}`);
      }
    } else {
      console.log(`Inserting new company knowledge for tenant ${tenantId}`);

      // Get an org_id from this tenant
      const profile = profiles.find(p => p.tenant_id === tenantId);

      const { error: insertError } = await supabase
        .from('agent_memories')
        .insert({
          tenant_id: tenantId,
          org_id: profile?.id,
          scope: 'company_knowledge',
          key: 'company_profile',
          content: roiHomeServicesKnowledge,
          importance: 1.0, // Maximum importance - company knowledge is always relevant
          expires_at: null // Never expires
        });

      if (insertError) {
        console.error(`Error inserting for tenant ${tenantId}:`, insertError);
      } else {
        console.log(`Inserted company knowledge for tenant ${tenantId}`);
      }
    }
  }

  console.log('\nCompany knowledge seeding complete!');
  console.log('The AI agent will now know about ROI Home Services when interacting with clients.');
}

// Run the seed
seedCompanyKnowledge()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
