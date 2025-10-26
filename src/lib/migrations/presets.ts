import { MigrationPreset } from './types';

// Mapping presets for common import scenarios

export const HUBSPOT_CONTACTS_PRESET: MigrationPreset = {
  id: 'hubspot-contacts',
  name: 'HubSpot Contacts',
  source: 'hubspot',
  entity: 'contacts',
  description: 'Import contacts from HubSpot CRM',
  mappings: [
    { sourceColumn: 'email', targetField: 'email', transform: 'lowercase' },
    { sourceColumn: 'Email', targetField: 'email', transform: 'lowercase' },
    { sourceColumn: 'firstname', targetField: 'first_name', required: true },
    { sourceColumn: 'First Name', targetField: 'first_name', required: true },
    { sourceColumn: 'lastname', targetField: 'last_name', required: true },
    { sourceColumn: 'Last Name', targetField: 'last_name', required: true },
    { sourceColumn: 'phone', targetField: 'phone' },
    { sourceColumn: 'Phone Number', targetField: 'phone' },
    { sourceColumn: 'mobilephone', targetField: 'mobile' },
    { sourceColumn: 'Mobile Phone Number', targetField: 'mobile' },
    { sourceColumn: 'jobtitle', targetField: 'title' },
    { sourceColumn: 'Job Title', targetField: 'title' },
    { sourceColumn: 'company', targetField: '_client_name' }, // Special: resolve to client_id
    { sourceColumn: 'Company Name', targetField: '_client_name' }, // HubSpot format
    { sourceColumn: 'company_domain', targetField: '_client_domain' }, // Special: resolve to client_id
    { sourceColumn: 'category', targetField: '_role' }, // Map to party role
    { sourceColumn: 'type', targetField: '_role' }, // Fallback role field
    { sourceColumn: 'contact_type', targetField: '_role' }, // Alternative role field
    { sourceColumn: 'Contact type', targetField: '_role' }, // HubSpot format
    { sourceColumn: 'role', targetField: '_role' }, // ROI-CRM format (lowercase)
    { sourceColumn: 'hs_object_id', targetField: 'props.hubspot_id' },
    { sourceColumn: 'Record ID - Contact', targetField: 'props.hubspot_contact_id' },
    { sourceColumn: 'notes', targetField: 'notes' },
    { sourceColumn: 'department', targetField: 'department' },
    { sourceColumn: 'Client Grade', targetField: 'props.client_grade' },
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
    { sourceColumn: 'Company name', targetField: 'company_name', required: true },
    { sourceColumn: 'domain', targetField: 'domain', transform: 'lowercase' },
    { sourceColumn: 'Company Domain Name', targetField: 'domain', transform: 'lowercase' },
    { sourceColumn: 'phone', targetField: 'phone' },
    { sourceColumn: 'Phone Number', targetField: 'phone' },
    { sourceColumn: 'address', targetField: 'address', required: true },
    // Address components - both simple and HubSpot formats
    { sourceColumn: 'Street Address', targetField: 'address.street' },
    { sourceColumn: 'Street Address 2', targetField: 'address.line2' },
    { sourceColumn: 'city', targetField: 'address.city' },
    { sourceColumn: 'City', targetField: 'address.city' },
    { sourceColumn: 'state', targetField: 'address.state' },
    { sourceColumn: 'State/Region', targetField: 'address.state' },
    { sourceColumn: 'zip', targetField: 'address.zip' },
    { sourceColumn: 'Postal Code', targetField: 'address.zip' },
    { sourceColumn: 'website', targetField: 'props.website' },
    { sourceColumn: 'Website URL', targetField: 'props.website' },
    { sourceColumn: 'category', targetField: '_role' }, // Map to party role
    { sourceColumn: 'type', targetField: '_role' }, // Fallback role field
    { sourceColumn: 'company_type', targetField: '_role' }, // Alternative role field
    { sourceColumn: 'Company Type', targetField: '_role' }, // HubSpot format
    { sourceColumn: 'hs_object_id', targetField: 'props.hubspot_id' },
    { sourceColumn: 'Record ID', targetField: 'props.hubspot_record_id' },
    { sourceColumn: 'industry', targetField: 'props.industry' },
    { sourceColumn: 'Industry', targetField: 'props.industry' },
    { sourceColumn: 'Description', targetField: 'special_requirements' },
    { sourceColumn: 'Annual Revenue', targetField: 'props.annual_revenue', transform: 'toNumber' },
    { sourceColumn: 'Company owner', targetField: 'props.account_owner' },
  ],
};

export const ASANA_CONTACTS_PRESET: MigrationPreset = {
  id: 'asana-contacts',
  name: 'Asana Contacts (AMC)',
  source: 'asana',
  entity: 'clients',
  description: 'Import AMC contacts from Asana with address component mapping',
  mappings: [
    { sourceColumn: 'company_name', targetField: 'company_name', required: true },
    { sourceColumn: 'Company Name', targetField: 'company_name', required: true },
    { sourceColumn: 'Name', targetField: 'company_name', required: true },
    { sourceColumn: 'email', targetField: 'email', transform: 'lowercase' },
    { sourceColumn: 'Email', targetField: 'email', transform: 'lowercase' },
    { sourceColumn: 'phone', targetField: 'phone' },
    { sourceColumn: 'Phone', targetField: 'phone' },
    { sourceColumn: 'primary_contact', targetField: 'primary_contact' },
    { sourceColumn: 'Primary Contact', targetField: 'primary_contact' },
    // Multi-line address (Address, Address 2, Address 3) - will be automatically combined
    { sourceColumn: 'Address', targetField: 'address.line1' },
    { sourceColumn: 'address', targetField: 'address.line1' },
    { sourceColumn: 'Address 2', targetField: 'address.line2' },
    { sourceColumn: 'Address2', targetField: 'address.line2' },
    { sourceColumn: 'address_2', targetField: 'address.line2' },
    { sourceColumn: 'Address 3', targetField: 'address.line3' },
    { sourceColumn: 'Address3', targetField: 'address.line3' },
    { sourceColumn: 'address_3', targetField: 'address.line3' },
    // Component address (Street, City, State, Zip) - alternative pattern
    { sourceColumn: 'Street', targetField: 'address.street' },
    { sourceColumn: 'street', targetField: 'address.street' },
    { sourceColumn: 'City', targetField: 'address.city' },
    { sourceColumn: 'city', targetField: 'address.city' },
    { sourceColumn: 'State', targetField: 'address.state' },
    { sourceColumn: 'state', targetField: 'address.state' },
    { sourceColumn: 'Zip', targetField: 'address.zip' },
    { sourceColumn: 'zip', targetField: 'address.zip' },
    { sourceColumn: 'ZIP', targetField: 'address.zip' },
    // Multi-line billing address (if present)
    { sourceColumn: 'Billing Address', targetField: 'billing_address.line1' },
    { sourceColumn: 'Billing Address 2', targetField: 'billing_address.line2' },
    { sourceColumn: 'Billing Address 3', targetField: 'billing_address.line3' },
    // Component billing address (if present)
    { sourceColumn: 'Billing Street', targetField: 'billing_address.street' },
    { sourceColumn: 'Billing City', targetField: 'billing_address.city' },
    { sourceColumn: 'Billing State', targetField: 'billing_address.state' },
    { sourceColumn: 'Billing Zip', targetField: 'billing_address.zip' },
    // Other fields
    { sourceColumn: 'domain', targetField: 'domain', transform: 'extract_domain' },
    { sourceColumn: 'payment_terms', targetField: 'payment_terms', transform: 'toNumber' },
    { sourceColumn: 'preferred_turnaround', targetField: 'preferred_turnaround', transform: 'toNumber' },
    { sourceColumn: 'special_requirements', targetField: 'special_requirements' },
    // Role mapping - must use _role for automatic transformation
    { sourceColumn: 'Category', targetField: '_role' }, // Use _role for automatic role mapping
    { sourceColumn: 'category', targetField: '_role' }, // Use _role for automatic role mapping
    { sourceColumn: 'Role', targetField: '_role' }, // Use _role for automatic role mapping
    // Additional custom fields
    { sourceColumn: 'License #', targetField: 'props.license_number' },
    { sourceColumn: 'license_number', targetField: 'props.license_number' },
    { sourceColumn: 'Licensure Date', targetField: 'props.licensure_date', transform: 'toDate' },
    { sourceColumn: 'licensure_date', targetField: 'props.licensure_date', transform: 'toDate' },
    { sourceColumn: 'Expiration Date', targetField: 'props.expiration_date', transform: 'toDate' },
    { sourceColumn: 'expiration_date', targetField: 'props.expiration_date', transform: 'toDate' },
  ],
};

export const ASANA_ORDERS_PRESET: MigrationPreset = {
  id: 'asana-orders',
  name: 'Asana Orders',
  source: 'asana',
  entity: 'orders',
  description: 'Import orders/tasks from Asana with complete field mappings and property linking',
  mappings: [
    // Core Identity & Dates
    { sourceColumn: 'Task ID', targetField: 'external_id', required: true },
    { sourceColumn: 'Created At', targetField: 'ordered_date', transform: 'toDate' },
    { sourceColumn: 'Due Date', targetField: 'due_date', transform: 'toDate' },
    { sourceColumn: 'Completed At', targetField: 'completed_date', transform: 'toDate' },
    { sourceColumn: 'Inspection Date', targetField: 'inspection_date', transform: 'toDate' },
    
    // Address (Two-Phase Processing)
    { sourceColumn: 'Appraised Property Address', targetField: 'props.original_address' },
    { sourceColumn: 'Address', targetField: 'props.original_address' }, // Fallback
    
    // Money Fields
    { sourceColumn: 'Appraisal Fee', targetField: 'fee_amount', transform: 'toNumber' },
    { sourceColumn: 'Inspection Fee', targetField: 'tech_fee', transform: 'toNumber' },
    { sourceColumn: 'Amount', targetField: 'total_amount', transform: 'toNumber' },
    
    // === NEW: APPRAISAL WORKFLOW FIELDS (Dedicated Columns) ===
    
    // Scope of Work (core workflow driver)
    { sourceColumn: 'SCOPE OF WORK', targetField: 'scope_of_work', transform: 'mapScopeOfWork' },
    
    // Intended Use (detailed purpose - replaces simple order_type)
    { sourceColumn: 'PURPOSE', targetField: 'intended_use' },
    { sourceColumn: 'PURPOSE', targetField: 'order_type', transform: 'mapOrderType' }, // Keep for compatibility
    
    // Report Form Type
    { sourceColumn: 'Report Format', targetField: 'report_form_type', transform: 'mapReportFormat' },
    
    // Additional Forms (array field)
    { sourceColumn: 'Addition Forms Required', targetField: 'additional_forms', transform: 'splitFormsArray' },
    
    // Billing Method (payment workflow)
    { sourceColumn: 'Billing Method', targetField: 'billing_method', transform: 'mapBillingMethod' },
    
    // Sales Campaign (marketing attribution)
    { sourceColumn: 'SALES CAMPAIGN', targetField: 'sales_campaign', transform: 'mapSalesCampaign' },
    
    // Service Region / Area
    { sourceColumn: 'AREA', targetField: 'service_region' },
    
    // Site Influence (pricing factor)
    { sourceColumn: 'Site Influence', targetField: 'site_influence', transform: 'mapSiteInfluence' },
    
    // Multiunit Property Detection
    { sourceColumn: 'Is this a Multiunit property?', targetField: 'is_multiunit', transform: 'toBoolean' },
    { sourceColumn: 'Is this a Multiunit property?', targetField: 'multiunit_type', transform: 'extractMultiunitType' },
    
    // New Construction Detection
    { sourceColumn: 'Is this New Construction', targetField: 'is_new_construction', transform: 'toBoolean' },
    { sourceColumn: 'Is this New Construction', targetField: 'new_construction_type', transform: 'extractNewConstructionType' },
    
    // Zoning Type
    { sourceColumn: 'Is the zoning residential?', targetField: 'zoning_type', transform: 'extractZoningType' },
    
    // === END NEW FIELDS ===
    
    // People & Associations
    { sourceColumn: 'Lender Client', targetField: 'lender_name' },
    { sourceColumn: 'Loan Officer', targetField: 'loan_officer' },
    { sourceColumn: 'Processor', targetField: 'processor_name' },
    { sourceColumn: 'Contact For Entry', targetField: 'property_contact_name' },
    { sourceColumn: 'Contact Primary Phone', targetField: 'property_contact_phone' },
    { sourceColumn: 'Assignee', targetField: 'props.assignee' },
    { sourceColumn: 'Assignee Email', targetField: 'props.assignee_email' },
    
    // Client Resolution (consolidated field)
    { sourceColumn: 'Client', targetField: '_client_name' },
    // Legacy fields (for backward compatibility with old exports)
    { sourceColumn: 'Client Name', targetField: '_client_name' },
    { sourceColumn: 'AMC CLIENT', targetField: '_amc_client' },
    { sourceColumn: 'Lender Client', targetField: '_lender_client' },
    
    // Props Fields (Less Critical, Stay in JSONB)
    { sourceColumn: 'AMC CLIENT', targetField: 'props.amc_client' },
    { sourceColumn: 'Date of Value (Current or specific date)', targetField: 'props.value_date', transform: 'toDate' },
    { sourceColumn: 'Site Size', targetField: 'props.site_size' },
    { sourceColumn: 'Prior Interest: Did we previously do work on this property?', targetField: 'props.prior_interest' },
    { sourceColumn: 'GLA', targetField: 'props.gla' },
    { sourceColumn: 'Complex', targetField: 'props.complex' },
    { sourceColumn: 'Foreclosure/REO', targetField: 'props.foreclosure' },
    { sourceColumn: 'Admin Worker Name', targetField: 'props.admin_worker' },
    { sourceColumn: 'Sales Representative', targetField: 'props.sales_representative' },
    { sourceColumn: 'PRODUCTION WORK SESSIONS', targetField: 'props.production_sessions' },
    { sourceColumn: 'Due to Client', targetField: 'props.client_due_date' },
    { sourceColumn: 'Notes', targetField: 'props.notes' },
    { sourceColumn: 'Name', targetField: 'props.asana_task_name' },
    { sourceColumn: 'Section/Column', targetField: 'props.asana_section' },
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
  ASANA_CONTACTS_PRESET,
  ASANA_ORDERS_PRESET,
  GENERIC_CSV_PRESET,
];

export function getPresetById(id: string): MigrationPreset | undefined {
  return ALL_PRESETS.find(p => p.id === id);
}

export function detectPreset(headers: string[]): MigrationPreset | undefined {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  // Detect Asana Contacts (AMC companies with address components)
  // Pattern 1: Multi-line addresses (Address, Address 2, Address 3)
  // Pattern 2: Component addresses (Street, City, State, Zip)
  // Pattern 3: AMC list with Name, Role, License #
  if (
    (lowerHeaders.includes('company_name') || lowerHeaders.includes('company name') || lowerHeaders.includes('name')) &&
    (lowerHeaders.includes('phone') || lowerHeaders.includes('email') || lowerHeaders.includes('role')) &&
    (
      // Multi-line pattern
      (lowerHeaders.includes('address') && (lowerHeaders.includes('address 2') || lowerHeaders.includes('address2') || lowerHeaders.includes('address_2') || lowerHeaders.includes('city'))) ||
      // Component pattern
      (lowerHeaders.includes('street') && lowerHeaders.includes('city')) ||
      // AMC pattern with license
      (lowerHeaders.includes('license #') || lowerHeaders.includes('licensure date'))
    )
  ) {
    return ASANA_CONTACTS_PRESET;
  }
  
  // Detect HubSpot Contacts
  if (
    lowerHeaders.includes('email') &&
    (lowerHeaders.includes('firstname') || lowerHeaders.includes('first name')) &&
    (lowerHeaders.includes('lastname') || lowerHeaders.includes('last name')) &&
    (lowerHeaders.includes('company') || lowerHeaders.includes('company name') || lowerHeaders.includes('hs_object_id') || lowerHeaders.includes('record id - contact'))
  ) {
    return HUBSPOT_CONTACTS_PRESET;
  }
  
  // Detect HubSpot Companies
  if (
    (lowerHeaders.includes('name') || lowerHeaders.includes('company name')) &&
    (lowerHeaders.includes('domain') || lowerHeaders.includes('company domain name')) &&
    (lowerHeaders.includes('hs_object_id') || lowerHeaders.includes('company') || lowerHeaders.includes('record id') || lowerHeaders.includes('company type'))
  ) {
    return HUBSPOT_COMPANIES_PRESET;
  }
  
  // Detect Asana Orders (both API and CSV export formats)
  if (
    // API format: gid, name, due_on, created_at
    (lowerHeaders.includes('gid') &&
     lowerHeaders.includes('name') &&
     (lowerHeaders.includes('due_on') || lowerHeaders.includes('created_at'))) ||
    // CSV export format: Task ID, Created At, Appraisal Fee, etc.
    (lowerHeaders.includes('task id') &&
     lowerHeaders.includes('created at') &&
     (lowerHeaders.includes('appraisal fee') || lowerHeaders.includes('appraised property address')))
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

