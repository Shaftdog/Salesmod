/**
 * Role code type definition
 */
export type PartyRoleCode =
  | 'mortgage_lender' | 'loan_officer' | 'qm_lender_contact' | 'non_qm_lender_contact' | 'private_lender'
  | 'investor' | 'accredited_investor' | 'real_estate_investor' | 'short_term_re_investor' 
  | 'long_term_re_investor' | 'registered_investment_advisor' | 'fund_manager' | 'co_gp'
  | 'realtor' | 'real_estate_broker' | 'real_estate_dealer' | 'wholesaler'
  | 'buyer' | 'seller' | 'owner'
  | 'builder' | 'general_contractor'
  | 'attorney' | 'real_estate_attorney' | 'estate_attorney' | 'family_attorney'
  | 'accountant' | 'ira_custodian_contact'
  | 'amc_contact' | 'amc_billing_contact'
  | 'gse' | 'vendor' | 'personal' | 'staff'
  | 'unknown' | 'delete_flag' | 'unk_enrich' | 'unk_no_name';

/**
 * Mapping dictionary from HubSpot/CSV labels to role codes
 */
const ROLE_MAPPING: Record<string, PartyRoleCode> = {
  // Exact matches (lowercase)
  'mortgage lender contact': 'mortgage_lender',
  'mortgage lender': 'mortgage_lender',
  'lender': 'mortgage_lender',
  'loan officer': 'loan_officer',
  'qm lender contact': 'qm_lender_contact',
  'non-qm lender contact': 'non_qm_lender_contact',
  'non qm lender contact': 'non_qm_lender_contact',
  'private lender': 'private_lender',
  
  'investor': 'investor',
  'accredited investor': 'accredited_investor',
  'real estate investor': 'real_estate_investor',
  'short term re investor': 'short_term_re_investor',
  'long term re investor': 'long_term_re_investor',
  'registered investment advisor': 'registered_investment_advisor',
  'fund manager': 'fund_manager',
  'co-gp': 'co_gp',
  'co gp': 'co_gp',
  
  'real estate agent': 'realtor',
  'realtor': 'realtor',
  'agent': 'realtor',
  'real estate broker': 'real_estate_broker',
  'broker': 'real_estate_broker',
  'real estate dealer': 'real_estate_dealer',
  'wholesaler': 'wholesaler',
  
  'buyer': 'buyer',
  'seller': 'seller',
  'owner': 'owner',
  
  'builder': 'builder',
  'general contractor': 'general_contractor',
  'contractor': 'general_contractor',
  
  'attorney': 'attorney',
  'lawyer': 'attorney',
  'real estate attorney': 'real_estate_attorney',
  'estate attorney': 'estate_attorney',
  'family attorney': 'family_attorney',
  
  'accountant': 'accountant',
  'cpa': 'accountant',
  'ira custodian contact': 'ira_custodian_contact',
  
  'amc contact': 'amc_contact',
  'amc': 'amc_contact',
  'amc billing contact': 'amc_billing_contact',
  
  'gse': 'gse',
  'vendor': 'vendor',
  'personal': 'personal',
  'staff': 'staff',
  
  // Junk/cleanup values
  'unknown': 'unknown',
  'delete': 'delete_flag',
  'unk-enrich': 'unk_enrich',
  'unk no name': 'unk_no_name',
};

/**
 * Map an inbound role string (from HubSpot, CSV, etc.) to a valid role code
 */
export function mapPartyRole(raw?: string | null): PartyRoleCode {
  if (!raw || raw.trim() === '') return 'unknown';
  
  const normalized = raw.trim().toLowerCase();
  const mapped = ROLE_MAPPING[normalized];
  
  // Log unmapped values for future refinement
  if (!mapped && process.env.NODE_ENV === 'development') {
    console.warn('[UNMAPPED_ROLE]', raw);
  }
  
  return mapped ?? 'unknown';
}

/**
 * Determine if a role should flag the record as excluded (junk data)
 */
export function isJunkRole(roleCode: PartyRoleCode): boolean {
  return ['delete_flag', 'unk_enrich', 'unk_no_name'].includes(roleCode);
}

/**
 * Get display label for a role code
 */
export function getRoleLabel(code: PartyRoleCode | string): string {
  // This could query the database in a server component,
  // or maintain a static mapping. For now, basic formatting:
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

