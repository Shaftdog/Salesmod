/**
 * Seed Initial Products
 *
 * This script populates the products table with initial appraisal products
 * based on the existing product catalog.
 *
 * Usage: node scripts/seed-initial-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Product catalog from screenshot and user requirements
const INITIAL_PRODUCTS = [
  // ========================================
  // CORE RESIDENTIAL APPRAISALS
  // ========================================
  {
    name: 'Full Appraisal (1004, 1073, ...)',
    description: 'Complete residential appraisal with interior and exterior inspection',
    category: 'core',
    sku: 'APPR-FULL',
    base_price: 450.00,
    requires_sf_calculation: true,
    sf_threshold: 3000,
    price_per_sf: 0.10,
    is_active: true,
    sort_order: 1,
  },
  {
    name: 'Field Inspection',
    description: 'Property field inspection service',
    category: 'core',
    sku: 'APPR-FIELD',
    base_price: 150.00,
    requires_sf_calculation: true,
    sf_threshold: 3000,
    price_per_sf: 0.10,
    is_active: true,
    sort_order: 2,
  },
  {
    name: 'Desktop Appraisal',
    description: 'Desktop appraisal without property inspection',
    category: 'core',
    sku: 'APPR-DESKTOP',
    base_price: 250.00,
    requires_sf_calculation: true,
    sf_threshold: 3000,
    price_per_sf: 0.10,
    is_active: true,
    sort_order: 3,
  },
  {
    name: 'Exterior Only Appraisal Review',
    description: 'Exterior-only property appraisal',
    category: 'core',
    sku: 'APPR-EXT',
    base_price: 350.00,
    requires_sf_calculation: true,
    sf_threshold: 3000,
    price_per_sf: 0.10,
    is_active: true,
    sort_order: 4,
  },
  {
    name: 'Desktop Review Appraisal',
    description: 'Desktop review of existing appraisal',
    category: 'core',
    sku: 'APPR-DESK-REV',
    base_price: 250.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 5,
  },
  {
    name: 'Field Review Appraisal (2000, ...)',
    description: 'Field review with property inspection',
    category: 'core',
    sku: 'APPR-FIELD-REV',
    base_price: 350.00,
    requires_sf_calculation: true,
    sf_threshold: 3000,
    price_per_sf: 0.10,
    is_active: true,
    sort_order: 6,
  },

  // ========================================
  // ADDITIONS (Add-ons to core appraisals)
  // ========================================
  {
    name: 'Addition - 3000+ SF',
    description: 'Additional charge for properties over 3000 square feet',
    category: 'addition',
    sku: 'ADD-3000SF',
    base_price: 0.00,
    requires_sf_calculation: true,
    sf_threshold: 3000,
    price_per_sf: 0.10,
    is_active: true,
    sort_order: 101,
  },
  {
    name: 'Addition - 2-4 Family',
    description: 'Additional charge for 2-4 family properties',
    category: 'addition',
    sku: 'ADD-2-4FAM',
    base_price: 200.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 102,
  },
  {
    name: 'Addition - Acreage',
    description: 'Additional charge for properties with significant acreage',
    category: 'addition',
    sku: 'ADD-ACRE',
    base_price: 100.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 103,
  },
  {
    name: 'Addition - Comparable Rent Schedule',
    description: 'Comparable rent schedule analysis',
    category: 'addition',
    sku: 'ADD-RENT-SCH',
    base_price: 100.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 104,
  },
  {
    name: 'Addition - Operating Income',
    description: 'Operating income analysis addition',
    category: 'addition',
    sku: 'ADD-OP-INC',
    base_price: 75.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 105,
  },
  {
    name: 'Addition - View Influence',
    description: 'View influence analysis',
    category: 'addition',
    sku: 'ADD-VIEW',
    base_price: 100.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 106,
  },
  {
    name: 'Addition - Relocation',
    description: 'Relocation appraisal services',
    category: 'addition',
    sku: 'ADD-RELOC',
    base_price: 100.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 107,
  },
  {
    name: 'Addition - Litigation',
    description: 'Litigation support services',
    category: 'addition',
    sku: 'ADD-LITIG',
    base_price: 200.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 108,
  },

  // ========================================
  // SPECIALIZED PRODUCTS (Standalone)
  // ========================================
  {
    name: 'Appraisal Update',
    description: 'Update of existing appraisal',
    category: 'specialized',
    sku: 'SPEC-UPDATE',
    base_price: 250.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 201,
  },
  {
    name: 'Operating Income Statement',
    description: 'Detailed operating income statement',
    category: 'specialized',
    sku: 'SPEC-OP-INC',
    base_price: 75.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 202,
  },
  {
    name: 'Qualitative Market Area Analysis',
    description: 'Qualitative analysis of market area',
    category: 'specialized',
    sku: 'SPEC-QUAL-MKT',
    base_price: 200.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 203,
  },
  {
    name: 'Quantitative Market Area Analysis',
    description: 'Quantitative analysis of market area',
    category: 'specialized',
    sku: 'SPEC-QUANT-MKT',
    base_price: 199.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 204,
  },
  {
    name: 'Comparable Rent Schedule',
    description: 'Standalone comparable rent schedule',
    category: 'specialized',
    sku: 'SPEC-RENT-SCH',
    base_price: 175.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 205,
  },
  {
    name: 'Client Recertification',
    description: 'Client recertification service',
    category: 'specialized',
    sku: 'SPEC-RECERT',
    base_price: 150.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 206,
  },

  // ========================================
  // OTHER (Discounts, misc)
  // ========================================
  {
    name: 'Discount',
    description: 'General discount line item',
    category: 'other',
    sku: 'MISC-DISC',
    base_price: 1.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 901,
  },
  {
    name: 'AMC Discount',
    description: 'AMC (Appraisal Management Company) discount',
    category: 'other',
    sku: 'MISC-AMC-DISC',
    base_price: 0.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 902,
  },
  {
    name: 'Sales',
    description: 'Sales-related item',
    category: 'other',
    sku: 'MISC-SALES',
    base_price: 0.00,
    requires_sf_calculation: false,
    is_active: true,
    sort_order: 903,
  },
];

async function seedProducts(orgId: string) {
  console.log(`Seeding products for org: ${orgId}`);

  for (const product of INITIAL_PRODUCTS) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        org_id: orgId,
        created_by: orgId, // Use org_id as creator for seed data
      })
      .select()
      .single();

    if (error) {
      console.error(`Error creating product "${product.name}":`, error.message);
    } else {
      console.log(`✓ Created: ${product.name}`);
    }
  }

  console.log('\n✓ Product seeding complete!');
}

async function main() {
  // Get the first org ID from profiles table
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (profileError || !profiles || profiles.length === 0) {
    console.error('Error: Could not find any profiles/orgs in the database');
    console.error('Please ensure you have at least one user/org created first');
    process.exit(1);
  }

  const orgId = profiles[0].id;

  console.log('='.repeat(50));
  console.log('SEEDING INITIAL PRODUCTS');
  console.log('='.repeat(50));
  console.log('');

  await seedProducts(orgId);

  console.log('');
  console.log('='.repeat(50));
  console.log('SEEDING COMPLETE');
  console.log('='.repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
