import { MigrationPreset } from './types';

// Mapping presets for common import scenarios

export const HUBSPOT_CONTACTS_PRESET: MigrationPreset = {
  id: 'hubspot-contacts',
  name: 'HubSpot Contacts',
  source: 'hubspot',
  entity: 'contacts',
  description: 'Import contacts from HubSpot CRM',
  mappings: [
    { sourceColumn: 'email', targetField: 'email', transform: 'lowercase', required: true },
    { sourceColumn: 'firstname', targetField: 'first_name', required: true },
    { sourceColumn: 'lastname', targetField: 'last_name', required: true },
    { sourceColumn: 'phone', targetField: 'phone' },
    { sourceColumn: 'mobilephone', targetField: 'mobile' },
    { sourceColumn: 'jobtitle', targetField: 'title' },
    { sourceColumn: 'company', targetField: '_client_name' }, // Special: resolve to client_id
    { sourceColumn: 'company_domain', targetField: '_client_domain' }, // Special: resolve to client_id
    { sourceColumn: 'hs_object_id', targetField: 'props.hubspot_id' },
    { sourceColumn: 'notes', targetField: 'notes' },
    { sourceColumn: 'department', targetField: 'department' },
  ],
};

export const HUBSPOT_COMPANIES_PRESET: MigrationPreset = {
  id: 'hubspot-companies',
  name: 'HubSpot Companies',
  source: 'hubspot',
  entity: 'clients',
  description: 'Import companies from HubSpot as clients',
  mappings: [
    { sourceColumn: 'name', targetField: 'company_name', required: true },
    { sourceColumn: 'domain', targetField: 'domain', transform: 'lowercase' },
    { sourceColumn: 'phone', targetField: 'phone', required: true },
    { sourceColumn: 'address', targetField: 'address', required: true },
    { sourceColumn: 'city', targetField: 'props.city' },
    { sourceColumn: 'state', targetField: 'props.state' },
    { sourceColumn: 'zip', targetField: 'props.zip' },
    { sourceColumn: 'website', targetField: 'props.website' },
    { sourceColumn: 'hs_object_id', targetField: 'props.hubspot_id' },
    { sourceColumn: 'industry', targetField: 'props.industry' },
  ],
};

export const ASANA_ORDERS_PRESET: MigrationPreset = {
  id: 'asana-orders',
  name: 'Asana Orders',
  source: 'asana',
  entity: 'orders',
  description: 'Import orders/tasks from Asana',
  mappings: [
    { sourceColumn: 'gid', targetField: 'external_id', required: true },
    { sourceColumn: 'name', targetField: 'property_address', required: true },
    { sourceColumn: 'due_on', targetField: 'due_date', transform: 'toDate' },
    { sourceColumn: 'created_at', targetField: 'ordered_date', transform: 'toDate' },
    { sourceColumn: 'completed_at', targetField: 'completed_date', transform: 'toDate' },
    { sourceColumn: 'custom_fields.Status', targetField: 'status' },
    { sourceColumn: 'custom_fields.Priority', targetField: 'priority' },
    { sourceColumn: 'custom_fields.Service_Type', targetField: 'order_type' },
    { sourceColumn: 'custom_fields.Fee', targetField: 'fee_amount', transform: 'toNumber' },
    { sourceColumn: 'custom_fields.Property_Address', targetField: 'property_address' },
    { sourceColumn: 'custom_fields.City', targetField: 'property_city' },
    { sourceColumn: 'custom_fields.State', targetField: 'property_state' },
    { sourceColumn: 'custom_fields.Zip', targetField: 'property_zip' },
    { sourceColumn: 'custom_fields.Property_Type', targetField: 'property_type' },
    { sourceColumn: 'custom_fields.Borrower_Name', targetField: 'borrower_name' },
    { sourceColumn: 'custom_fields.Borrower_Email', targetField: 'borrower_email', transform: 'lowercase' },
    { sourceColumn: 'custom_fields.Borrower_Phone', targetField: 'borrower_phone' },
    { sourceColumn: 'custom_fields.Lender', targetField: 'lender_name' },
    { sourceColumn: 'custom_fields.Loan_Officer', targetField: 'loan_officer' },
    { sourceColumn: 'custom_fields.Loan_Number', targetField: 'loan_number' },
    { sourceColumn: 'notes', targetField: 'special_instructions' },
  ],
};

export const GENERIC_CSV_PRESET: MigrationPreset = {
  id: 'generic-csv',
  name: 'Generic CSV',
  source: 'csv',
  entity: 'contacts',
  description: 'Start with a blank mapping',
  mappings: [],
};

export const ALL_PRESETS: MigrationPreset[] = [
  HUBSPOT_CONTACTS_PRESET,
  HUBSPOT_COMPANIES_PRESET,
  ASANA_ORDERS_PRESET,
  GENERIC_CSV_PRESET,
];

export function getPresetById(id: string): MigrationPreset | undefined {
  return ALL_PRESETS.find(p => p.id === id);
}

export function detectPreset(headers: string[]): MigrationPreset | undefined {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  // Detect HubSpot Contacts
  if (
    lowerHeaders.includes('email') &&
    lowerHeaders.includes('firstname') &&
    lowerHeaders.includes('lastname') &&
    (lowerHeaders.includes('company') || lowerHeaders.includes('hs_object_id'))
  ) {
    return HUBSPOT_CONTACTS_PRESET;
  }
  
  // Detect HubSpot Companies
  if (
    lowerHeaders.includes('name') &&
    lowerHeaders.includes('domain') &&
    (lowerHeaders.includes('hs_object_id') || lowerHeaders.includes('company'))
  ) {
    return HUBSPOT_COMPANIES_PRESET;
  }
  
  // Detect Asana Orders
  if (
    lowerHeaders.includes('gid') &&
    lowerHeaders.includes('name') &&
    (lowerHeaders.includes('due_on') || lowerHeaders.includes('created_at'))
  ) {
    return ASANA_ORDERS_PRESET;
  }
  
  return undefined;
}

// Column name similarity matching for auto-mapping
export function findSimilarColumn(sourceColumn: string, targetColumns: string[]): string | undefined {
  const source = sourceColumn.toLowerCase().replace(/[_\s-]/g, '');
  
  // Exact match
  const exactMatch = targetColumns.find(t => t.toLowerCase().replace(/[_\s-]/g, '') === source);
  if (exactMatch) return exactMatch;
  
  // Common mappings
  const commonMappings: Record<string, string[]> = {
    first_name: ['firstname', 'fname', 'givenname', 'forename'],
    last_name: ['lastname', 'lname', 'surname', 'familyname'],
    email: ['emailaddress', 'mail', 'emailaddr'],
    phone: ['phonenumber', 'telephone', 'tel', 'mobile', 'cell'],
    company_name: ['company', 'organization', 'org', 'business'],
    address: ['street', 'address1', 'streetaddress'],
  };
  
  for (const [target, aliases] of Object.entries(commonMappings)) {
    if (targetColumns.includes(target) && aliases.some(alias => source.includes(alias))) {
      return target;
    }
  }
  
  return undefined;
}

