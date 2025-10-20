# Party Roles Implementation Plan (MVP)

## Overview

Add business role categorization (Mortgage Lender, Investor, Buyer, Real Estate Agent, etc.) to both **contacts** and **clients** with a shared lookup table, import mapping, and basic UI support.

**Philosophy**: Ship the foundation this week. Layer in advanced features (multi-role support, suggested roles, analytics) only when proven necessary.

### MVP Goals (Ship This Week)

- ✅ Categorize contacts and clients by their primary business role
- ✅ Support HubSpot and CSV imports with automatic role mapping
- ✅ Enable filtering by role on list pages
- ✅ Handle junk/unknown data gracefully (exclude from outreach)
- ✅ Maintain single source of truth (`party_roles` table)
- ✅ Backfill existing data with unmapped value reporting

### Phase 2 Features (Defer Until Needed)

- Multi-role support (contact_role_links / client_role_links tables)
- Suggested role inference from contacts (views/RPCs with joins)
- Advanced UI (category-based colors, role analytics)
- Materialized views for performance optimization

---

## Branch Strategy

```bash
git checkout -b feat/party-roles-mvp
```

---

## 5-Day Implementation Timeline

- **Day 1**: Database foundation (party_roles table + columns)
- **Day 2**: Import mapper (role mapping logic)
- **Day 3**: UI components (badge, select, filter - simple version)
- **Day 4**: Backfill existing data + unmapped report
- **Day 5**: QA and refinement

---

## Day 1: Database Schema (Foundation)

### File: `supabase/migrations/20251020100000_add_party_roles.sql`

```sql
-- =============================================
-- Party Roles System - MVP
-- Shared categorization for Contacts & Clients
-- =============================================

-- =============================================
-- 1. Party Roles Lookup Table (Shared)
-- =============================================

CREATE TABLE IF NOT EXISTS public.party_roles (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'lender', 'investor', 'service_provider', 'other' (for future UI enhancements)
  sort_order INTEGER NOT NULL DEFAULT 999,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active roles ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_party_roles_active_sort 
  ON public.party_roles(is_active, sort_order) 
  WHERE is_active = true;

-- =============================================
-- 2. Seed Party Roles (Production Data)
-- =============================================

INSERT INTO public.party_roles (code, label, category, sort_order) VALUES
  -- Lenders (1-10)
  ('mortgage_lender', 'Mortgage Lender Contact', 'lender', 1),
  ('loan_officer', 'Loan Officer', 'lender', 2),
  ('qm_lender_contact', 'QM Lender Contact', 'lender', 3),
  ('non_qm_lender_contact', 'Non-QM Lender Contact', 'lender', 4),
  ('private_lender', 'Private Lender', 'lender', 5),
  
  -- Investors (11-20)
  ('investor', 'Investor', 'investor', 11),
  ('accredited_investor', 'Accredited Investor', 'investor', 12),
  ('real_estate_investor', 'Real Estate Investor', 'investor', 13),
  ('short_term_re_investor', 'Short Term RE Investor', 'investor', 14),
  ('long_term_re_investor', 'Long Term RE Investor', 'investor', 15),
  ('registered_investment_advisor', 'Registered Investment Advisor', 'investor', 16),
  ('fund_manager', 'Fund Manager', 'investor', 17),
  ('co_gp', 'Co-GP', 'investor', 18),
  
  -- Real Estate Professionals (21-30)
  ('realtor', 'Real Estate Agent/Realtor', 'service_provider', 21),
  ('real_estate_broker', 'Real Estate Broker', 'service_provider', 22),
  ('real_estate_dealer', 'Real Estate Dealer', 'service_provider', 23),
  ('wholesaler', 'Wholesaler', 'service_provider', 24),
  
  -- Buyers/Sellers/Owners (31-40)
  ('buyer', 'Buyer', 'other', 31),
  ('seller', 'Seller', 'other', 32),
  ('owner', 'Owner', 'other', 33),
  
  -- Construction (41-45)
  ('builder', 'Builder', 'service_provider', 41),
  ('general_contractor', 'General Contractor', 'service_provider', 42),
  
  -- Legal (46-55)
  ('attorney', 'Attorney', 'service_provider', 46),
  ('real_estate_attorney', 'Real Estate Attorney', 'service_provider', 47),
  ('estate_attorney', 'Estate Attorney', 'service_provider', 48),
  ('family_attorney', 'Family Attorney', 'service_provider', 49),
  
  -- Financial Services (56-65)
  ('accountant', 'Accountant', 'service_provider', 56),
  ('ira_custodian_contact', 'IRA Custodian Contact', 'service_provider', 57),
  
  -- AMC (66-70)
  ('amc_contact', 'AMC Contact', 'service_provider', 66),
  ('amc_billing_contact', 'AMC Billing Contact', 'service_provider', 67),
  
  -- GSE & Other (71-80)
  ('gse', 'GSE', 'other', 71),
  ('vendor', 'Vendor', 'service_provider', 72),
  ('personal', 'Personal', 'other', 73),
  ('staff', 'Staff', 'other', 74),
  
  -- Junk/Unknown (900+)
  ('unknown', 'Unknown', 'other', 900),
  ('delete_flag', 'Delete Flag', 'other', 998),
  ('unk_enrich', 'Unknown - Needs Enrichment', 'other', 999),
  ('unk_no_name', 'Unknown - No Name', 'other', 1000)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 3. Add Role to Contacts
-- =============================================

ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS primary_role_code TEXT 
    REFERENCES public.party_roles(code);

CREATE INDEX IF NOT EXISTS idx_contacts_primary_role 
  ON public.contacts(primary_role_code);

-- =============================================
-- 4. Add Role to Clients
-- =============================================

ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS primary_role_code TEXT 
    REFERENCES public.party_roles(code);

CREATE INDEX IF NOT EXISTS idx_clients_primary_role 
  ON public.clients(primary_role_code);

-- =============================================
-- 5. RLS Policies
-- =============================================

-- Party roles are public lookup data
ALTER TABLE public.party_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view party roles"
  ON public.party_roles FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- 6. Comments for Documentation
-- =============================================

COMMENT ON TABLE public.party_roles IS 
  'Shared lookup table for business role categorization (applies to both contacts and clients)';

COMMENT ON COLUMN public.contacts.primary_role_code IS 
  'Primary business role/category (e.g., mortgage_lender, investor, buyer)';

COMMENT ON COLUMN public.clients.primary_role_code IS 
  'Primary business role/category';
```

---

**Note**: Multi-role support (contact_role_links, client_role_links) and suggested role views/RPCs are deferred to Phase 2. Add only when proven necessary.

---

## Day 2: Import Mapper Functions

### File: `src/lib/roles/mapPartyRole.ts` (New)

```typescript
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
```

---

## Day 2 (continued): Update Import System

### File: `src/lib/migrations/presets.ts` (Update)

```typescript
// Add role mapping to HubSpot contact preset
export const HUBSPOT_CONTACTS_PRESET: MigrationPreset = {
  id: 'hubspot-contacts',
  name: 'HubSpot Contacts',
  source: 'hubspot',
  entity: 'contacts',
  description: 'Import contacts from HubSpot CRM',
  mappings: [
    // ... existing mappings ...
    
    // ADD THESE:
    { sourceColumn: 'category', targetField: '_role', transform: 'map_party_role' },
    { sourceColumn: 'type', targetField: '_role', transform: 'map_party_role' },
    { sourceColumn: 'contact_type', targetField: '_role', transform: 'map_party_role' },
  ],
};

// Add role mapping to HubSpot companies preset
export const HUBSPOT_COMPANIES_PRESET: MigrationPreset = {
  id: 'hubspot-companies',
  name: 'HubSpot Companies',
  source: 'hubspot',
  entity: 'clients',
  description: 'Import companies from HubSpot CRM',
  mappings: [
    // ... existing mappings ...
    
    // ADD THESE:
    { sourceColumn: 'category', targetField: '_role', transform: 'map_party_role' },
    { sourceColumn: 'type', targetField: '_role', transform: 'map_party_role' },
    { sourceColumn: 'company_type', targetField: '_role', transform: 'map_party_role' },
  ],
};
```

### File: `src/lib/migrations/transforms.ts` (Add transform)

```typescript
import { mapPartyRole, isJunkRole } from '@/lib/roles/mapPartyRole';

// Add to existing transforms:
export function transformMapPartyRole(value: any): string {
  return mapPartyRole(value);
}

// Update the transform map export:
export const TRANSFORM_MAP = {
  // ... existing transforms ...
  'map_party_role': transformMapPartyRole,
};
```

### File: `src/app/api/migrations/run/route.ts` (Update)

Add role processing to both `processContact` and `processClient` functions:

```typescript
import { mapPartyRole, isJunkRole } from '@/lib/roles/mapPartyRole';

// In processContact function (around line 368):
async function processContact(
  supabase: any,
  row: Record<string, any>,
  duplicateStrategy: DuplicateStrategy,
  userId: string
): Promise<{ type: 'inserted' | 'updated' | 'skipped' }> {
  // ... existing client resolution logic ...
  
  // ADD THIS: Handle role mapping
  if (row._role) {
    const roleCode = mapPartyRole(row._role);
    row.primary_role_code = roleCode;
    
    // Store original label in props
    if (!row.props) row.props = {};
    row.props.source_role_label = row._role;
    
    // Flag junk records for exclusion
    if (isJunkRole(roleCode)) {
      row.primary_role_code = 'unknown';
      row.props.exclude = true;
      row.props.exclude_reason = `Junk role: ${row._role}`;
    }
    
    delete row._role; // Remove special field
  }
  
  // ... rest of function ...
}

// In processClient function (around line 410):
async function processClient(
  supabase: any,
  row: Record<string, any>,
  source: string,
  duplicateStrategy: DuplicateStrategy
): Promise<{ type: 'inserted' | 'updated' | 'skipped' }> {
  // ... existing logic ...
  
  // ADD THIS: Handle role mapping
  if (row._role) {
    const roleCode = mapPartyRole(row._role);
    row.primary_role_code = roleCode;
    
    // Store original label in props
    if (!row.props) row.props = {};
    row.props.source_role_label = row._role;
    
    // Flag junk records for exclusion
    if (isJunkRole(roleCode)) {
      row.primary_role_code = 'unknown';
      row.props.exclude = true;
      row.props.exclude_reason = `Junk role: ${row._role}`;
    }
    
    delete row._role; // Remove special field
  }
  
  // ... rest of function ...
}
```

---

## Day 2 (continued): TypeScript Type Updates

### File: `src/lib/types.ts` (Update)

```typescript
import { PartyRoleCode } from './roles/mapPartyRole';

export interface Contact {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  isPrimary: boolean;
  department?: string;
  notes?: string;
  primaryRoleCode?: PartyRoleCode | null;  // ADD THIS
  createdAt: string;
  updatedAt: string;
  
  // Relations
  client?: Client;
  role?: PartyRole;  // ADD THIS (populated via join)
}

export interface Client {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string;
  phone: string;
  address: string;
  billingAddress: string;
  paymentTerms: number;
  isActive: boolean;
  primaryRoleCode?: PartyRoleCode | null;  // ADD THIS
  createdAt: string;
  updatedAt: string;
  activeOrders?: number;
  totalRevenue?: number;
  feeSchedule?: any;
  preferredTurnaround?: number;
  specialRequirements?: string;
  
  // Relations
  role?: PartyRole;  // ADD THIS (populated via join)
}

// ADD THIS: Party role interface
export interface PartyRole {
  code: PartyRoleCode;
  label: string;
  description?: string;
  category?: string;
  sortOrder: number;
  isActive: boolean;
  appliesTo: string[];
}
```

### File: `src/lib/supabase/transforms.ts` (Update)

```typescript
export function transformContact(dbContact: any): Contact {
  return {
    id: dbContact.id,
    clientId: dbContact.client_id,
    firstName: dbContact.first_name,
    lastName: dbContact.last_name,
    title: dbContact.title,
    email: dbContact.email,
    phone: dbContact.phone,
    mobile: dbContact.mobile,
    isPrimary: dbContact.is_primary,
    department: dbContact.department,
    notes: dbContact.notes,
    primaryRoleCode: dbContact.primary_role_code,  // ADD THIS
    createdAt: dbContact.created_at,
    updatedAt: dbContact.updated_at,
    client: dbContact.clients ? transformClient(dbContact.clients) : undefined,
    role: dbContact.party_roles ? transformPartyRole(dbContact.party_roles) : undefined,  // ADD THIS
  };
}

export function transformClient(dbClient: any): Client {
  return {
    id: dbClient.id,
    companyName: dbClient.company_name,
    primaryContact: dbClient.primary_contact,
    email: dbClient.email,
    phone: dbClient.phone,
    address: dbClient.address,
    billingAddress: dbClient.billing_address,
    paymentTerms: dbClient.payment_terms,
    isActive: dbClient.is_active,
    primaryRoleCode: dbClient.primary_role_code,  // ADD THIS
    createdAt: dbClient.created_at,
    updatedAt: dbClient.updated_at,
    activeOrders: dbClient.active_orders,
    totalRevenue: dbClient.total_revenue,
    feeSchedule: dbClient.fee_schedule,
    preferredTurnaround: dbClient.preferred_turnaround,
    specialRequirements: dbClient.special_requirements,
    role: dbClient.party_roles ? transformPartyRole(dbClient.party_roles) : undefined,  // ADD THIS
  };
}

// ADD THIS: Transform party role
export function transformPartyRole(dbRole: any): PartyRole {
  return {
    code: dbRole.code,
    label: dbRole.label,
    description: dbRole.description,
    category: dbRole.category,
    sortOrder: dbRole.sort_order,
    isActive: dbRole.is_active,
    appliesTo: dbRole.applies_to,
  };
}
```

---

## Day 3: UI Components & Hooks (Simplified)

### File: `src/hooks/use-party-roles.ts` (New)

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PartyRole } from '@/lib/types';

export function usePartyRoles() {
  return useQuery({
    queryKey: ['party-roles'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('party_roles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      return data as PartyRole[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (roles change rarely)
  });
}

export function useRolesByCategory() {
  const { data: roles, ...rest } = usePartyRoles();
  
  const grouped = roles?.reduce((acc, role) => {
    const category = role.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(role);
    return acc;
  }, {} as Record<string, PartyRole[]>);
  
  return { roles: grouped, ...rest };
}
```

### File: `src/components/shared/role-badge.tsx` (New - Simplified)

```typescript
'use client';

import { Badge } from '@/components/ui/badge';
import type { PartyRoleCode } from '@/lib/roles/mapPartyRole';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  code: PartyRoleCode | string | null | undefined;
  label?: string;
  className?: string;
}

export function RoleBadge({ code, label, className }: RoleBadgeProps) {
  if (!code || code === 'unknown') {
    return (
      <Badge variant="secondary" className={cn('text-xs', className)}>
        No Role
      </Badge>
    );
  }
  
  return (
    <Badge variant="default" className={cn('text-xs', className)}>
      {label || code.replace(/_/g, ' ')}
    </Badge>
  );
}
```

**Note**: Category-based colors (lender=blue, investor=green, etc.) deferred to Phase 2. Ship with basic default variant first, iterate based on real usage data.

### File: `src/components/shared/role-select.tsx` (New)

```typescript
'use client';

import { usePartyRoles } from '@/hooks/use-party-roles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface RoleSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RoleSelect({ value, onChange, placeholder = 'Select role...', disabled }: RoleSelectProps) {
  const { data: roles, isLoading } = usePartyRoles();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading roles...
      </div>
    );
  }
  
  return (
    <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">No Role</SelectItem>
        {roles?.map((role) => (
          <SelectItem key={role.code} value={role.code}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### File: `src/components/shared/role-filter.tsx` (New)

```typescript
'use client';

import { usePartyRoles } from '@/hooks/use-party-roles';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';

interface RoleFilterProps {
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
}

export function RoleFilter({ selectedRoles, onChange }: RoleFilterProps) {
  const { data: roles, isLoading } = usePartyRoles();
  
  const toggleRole = (roleCode: string) => {
    if (selectedRoles.includes(roleCode)) {
      onChange(selectedRoles.filter(r => r !== roleCode));
    } else {
      onChange([...selectedRoles, roleCode]);
    }
  };
  
  const clearFilters = () => {
    onChange([]);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Role
          {selectedRoles.length > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {selectedRoles.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-2 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            {roles?.map((role) => (
              <DropdownMenuCheckboxItem
                key={role.code}
                checked={selectedRoles.includes(role.code)}
                onCheckedChange={() => toggleRole(role.code)}
              >
                {role.label}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}
        {selectedRoles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Day 3 (continued): Integration Points

### Contacts List Page

**File**: `src/app/(app)/contacts/page.tsx`

Updates needed:
1. Add `RoleFilter` component to the filter bar
2. Update query to join `party_roles` table
3. Display `RoleBadge` in the contact list/table
4. Add role to search parameters for filtering

```typescript
// Add to imports
import { RoleFilter } from '@/components/shared/role-filter';
import { RoleBadge } from '@/components/shared/role-badge';

// Add state for role filter
const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

// Update Supabase query
let query = supabase
  .from('contacts')
  .select('*, clients(*), party_roles(*)')  // Add party_roles join
  .order('created_at', { ascending: false });

if (selectedRoles.length > 0) {
  query = query.in('primary_role_code', selectedRoles);
}

// In the UI filter section, add:
<RoleFilter selectedRoles={selectedRoles} onChange={setSelectedRoles} />

// In the table/list display, add:
<RoleBadge code={contact.primaryRoleCode} label={contact.role?.label} />
```

### Contact Detail Page

**File**: `src/app/(app)/contacts/[id]/page.tsx`

Updates needed:
1. Add `RoleSelect` to edit form
2. Join `party_roles` in query
3. Display role badge in header

```typescript
// Add to imports
import { RoleSelect } from '@/components/shared/role-select';
import { RoleBadge } from '@/components/shared/role-badge';

// Update query to include role
const { data: contact } = await supabase
  .from('contacts')
  .select('*, clients(*), party_roles(*)')
  .eq('id', params.id)
  .single();

// In edit form:
<div>
  <label>Role</label>
  <RoleSelect
    value={contact.primaryRoleCode}
    onChange={(roleCode) => handleUpdateRole(roleCode)}
  />
</div>

// In header:
<RoleBadge code={contact.primaryRoleCode} label={contact.role?.label} />
```

### Clients List Page

**File**: `src/app/(app)/clients/page.tsx`

Updates needed:
1. Add `RoleFilter` component
2. Join `party_roles` table
3. Display role badge
4. Add role filtering

```typescript
// Add to imports
import { RoleFilter } from '@/components/shared/role-filter';
import { RoleBadge } from '@/components/shared/role-badge';

// Add state
const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

// Update query
let query = supabase
  .from('clients')
  .select('*, party_roles(*)')
  .order('created_at', { ascending: false });

if (selectedRoles.length > 0) {
  query = query.in('primary_role_code', selectedRoles);
}

// In filter section:
<RoleFilter selectedRoles={selectedRoles} onChange={setSelectedRoles} />

// In table display:
{client.primaryRoleCode ? (
  <RoleBadge code={client.primaryRoleCode} label={client.role?.label} />
) : (
  <span className="text-xs text-muted-foreground">No role</span>
)}
```

**Note**: Suggested role UI deferred to Phase 2. For MVP, roles are set manually during import or via edit form.

### Client Detail Page

**File**: `src/app/(app)/clients/[id]/page.tsx`

Updates needed:
1. Add `RoleSelect` to edit form
2. Display role badge in header

```typescript
// Add to imports
import { RoleSelect } from '@/components/shared/role-select';
import { RoleBadge } from '@/components/shared/role-badge';

// Update query
const { data: client } = await supabase
  .from('clients')
  .select('*, party_roles(*)')
  .eq('id', params.id)
  .single();

// In edit form:
<div>
  <label>Role</label>
  <RoleSelect
    value={client.primaryRoleCode}
    onChange={(roleCode) => handleUpdateRole(roleCode)}
  />
</div>

// In header:
<RoleBadge code={client.primaryRoleCode} label={client.role?.label} />
```

**Note**: Suggested role feature (inferred from contacts) deferred to Phase 2.

---

## Day 4: Backfill Existing Data

### File: `scripts/backfill-party-roles.ts` (New)

```typescript
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
      const label = row.party_roles?.label || row.primary_role_code;
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
```

### Running the Backfill

```bash
# Install dependencies if needed
npm install --save-dev tsx

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"

# Run backfill
npx tsx scripts/backfill-party-roles.ts

# Review unmapped values
open unmapped-roles.csv
```

### After Backfill

1. **Review `unmapped-roles.csv`**: Look for patterns in unmapped values
2. **Update mapping**: Add common values to `ROLE_MAPPING` in `mapPartyRole.ts`
3. **Re-run backfill**: Process newly mapped values
4. **Verify counts**: Check role distribution makes sense

---

## Day 5: Testing & QA

### Database Testing

1. **Migration Execution**
   ```bash
   # Run migration
   supabase migration up
   
   # Verify tables created
   psql -c "SELECT COUNT(*) FROM party_roles WHERE is_active = true;"
   # Should return 40+
   
   psql -c "\d contacts" | grep primary_role_code
   # Should show primary_role_code column
   
   psql -c "\d clients" | grep primary_role_code
   # Should show primary_role_code column
   ```

2. **Role Seeding**
   ```sql
   -- Verify all roles seeded
   SELECT code, label, category, sort_order 
   FROM party_roles 
   ORDER BY sort_order 
   LIMIT 10;
   
   -- Verify categories
   SELECT category, COUNT(*) 
   FROM party_roles 
   GROUP BY category;
   ```

3. **Foreign Key Testing**
   ```sql
   -- Should fail (invalid role code)
   UPDATE contacts SET primary_role_code = 'invalid_role' WHERE id = 'test-id';
   
   -- Should succeed
   UPDATE contacts SET primary_role_code = 'investor' WHERE id = 'test-id';
   
   -- Verify lookup works
   SELECT c.first_name, c.last_name, pr.label 
   FROM contacts c
   LEFT JOIN party_roles pr ON c.primary_role_code = pr.code
   LIMIT 5;
   ```

### Import Testing

1. **Create test CSV files**

   **contacts-test.csv**:
   ```csv
   email,firstname,lastname,category
   test1@example.com,John,Doe,Mortgage Lender Contact
   test2@example.com,Jane,Smith,Real Estate Agent
   test3@example.com,Bob,Jones,Unknown Type Here
   test4@example.com,Alice,Brown,Delete
   ```

2. **Run import via UI**
   - Navigate to `/migrations`
   - Upload test CSV
   - Map columns: `category` → `_role`
   - Execute import
   - Verify results:
     - John Doe: `mortgage_lender`
     - Jane Smith: `realtor`
     - Bob Jones: `unknown` (unmapped)
     - Alice Brown: `unknown` with `props.exclude=true`

3. **Check import stats**
   ```typescript
   // Should show role distribution in stats
   console.log(importStats.roleDistribution);
   // { mortgage_lender: 1, realtor: 1, unknown: 2 }
   ```

### UI Testing

1. **Contacts List**
   - ✅ Role filter dropdown appears
   - ✅ Selecting roles filters correctly
   - ✅ Role badges display
   - ✅ "No Role" shows for null values

2. **Contact Detail**
   - ✅ Role select dropdown loads all roles sorted by sort_order
   - ✅ Changing role saves correctly
   - ✅ Role badge appears in header

3. **Clients List**
   - ✅ Role filter works
   - ✅ Role badges display correctly
   - ✅ "No Role" shows for null values

4. **Client Detail**
   - ✅ Role select works
   - ✅ Changing role saves correctly
   - ✅ Page refreshes after saving

### Edge Cases

1. **Import with null/empty role**
   - Row with no role value
   - Should leave `primary_role_code` as null
   - Should NOT set exclude flag

2. **Import with unmapped role**
   - Row with role "Chief Operations Officer"
   - Should set `primary_role_code = 'unknown'`
   - Should log warning for refinement

3. **Junk data handling**
   - Import row with role "Delete"
   - Should set `primary_role_code = 'unknown'`
   - Should set `props.exclude = true`
   - Should set `props.exclude_reason`

4. **Role update on existing record**
   - Change contact role from 'investor' to 'mortgage_lender'
   - Verify `props.source_role_label` preserved
   - Verify filter/search updates immediately

---

## Deployment & Rollout

### Development Environment (Day 1)

1. **Run migration**
   ```bash
   git checkout feat/party-roles-categorization
   supabase migration up
   ```

2. **Verify seed data**
   ```sql
   SELECT COUNT(*) FROM party_roles WHERE is_active = true;
   -- Should return 40+ roles
   ```

3. **Test with sample imports**
   - Use provided test CSV files
   - Verify role mapping works
   - Check UI components

### Staging Environment

1. **Run migration**
   ```bash
   supabase db push --db-url $STAGING_DB_URL
   ```

2. **Import production data sample**
   - Export 100 contacts from production
   - Import to staging with role mapping
   - Verify results

3. **QA testing checklist**
   - [ ] All 40+ roles present
   - [ ] Role filters work on contacts/clients pages
   - [ ] Role badges display correctly
   - [ ] Import system maps roles correctly
   - [ ] Suggested role logic works
   - [ ] No performance issues with views

### Production Deployment

1. **Pre-deployment**
   ```sql
   -- Backup existing data
   CREATE TABLE contacts_backup AS SELECT * FROM contacts;
   CREATE TABLE clients_backup AS SELECT * FROM clients;
   ```

2. **Run migration**
   ```bash
   supabase db push --db-url $PRODUCTION_DB_URL
   ```

3. **Backfill existing data (optional)**
   ```sql
   -- If you have legacy role data in props
   UPDATE contacts 
   SET primary_role_code = (
     CASE 
       WHEN props->>'legacy_role' = 'Lender' THEN 'mortgage_lender'
       WHEN props->>'legacy_role' = 'Investor' THEN 'investor'
       -- Add more mappings as needed
       ELSE 'unknown'
     END
   )
   WHERE props->>'legacy_role' IS NOT NULL
     AND primary_role_code IS NULL;
   
   -- Similar for clients
   UPDATE clients
   SET primary_role_code = (
     CASE 
       WHEN props->>'company_type' = 'AMC' THEN 'amc_contact'
       WHEN props->>'company_type' = 'Lender' THEN 'mortgage_lender'
       ELSE 'unknown'
     END
   )
   WHERE props->>'company_type' IS NOT NULL
     AND primary_role_code IS NULL;
   ```

4. **Monitor**
   - Watch logs for unmapped role warnings
   - Check query performance on views
   - Verify no foreign key errors

5. **Post-deployment**
   ```sql
   -- Analyze role distribution
   SELECT 
     pr.label,
     COUNT(*) as contact_count
   FROM contacts c
   JOIN party_roles pr ON c.primary_role_code = pr.code
   GROUP BY pr.label
   ORDER BY contact_count DESC;
   
   -- Check clients without roles
   SELECT COUNT(*) 
   FROM clients 
   WHERE primary_role_code IS NULL;
   
   -- Check suggested roles coverage
   SELECT COUNT(DISTINCT client_id) 
   FROM client_suggested_role;
   ```

### Refinement Phase

1. **Monitor unmapped values**
   - Review logs for `[UNMAPPED_ROLE]` warnings
   - Add new mappings to `ROLE_MAPPING` dictionary
   - Consider adding new role codes if needed

2. **Performance optimization**
   - If `client_suggested_role` view is slow, consider materialized view:
     ```sql
     CREATE MATERIALIZED VIEW client_role_summary_mat AS
     SELECT * FROM client_suggested_role;
     
     CREATE INDEX idx_client_role_summary_client 
       ON client_role_summary_mat(client_id);
     
     -- Refresh periodically or on trigger
     REFRESH MATERIALIZED VIEW client_role_summary_mat;
     ```

3. **User feedback**
   - Collect feedback on role categories
   - Adjust labels/descriptions if needed
   - Add new roles as business requirements evolve

---

## Maintenance Notes

### Adding New Roles

```sql
-- Add to party_roles table
INSERT INTO party_roles (code, label, category, sort_order)
VALUES ('new_role_code', 'New Role Label', 'category', 999);

-- Update TypeScript type
-- Add to PartyRoleCode union in src/lib/roles/mapPartyRole.ts

-- Add mapping
-- Update ROLE_MAPPING in src/lib/roles/mapPartyRole.ts
```

### Deactivating Roles

```sql
-- Don't delete, just deactivate
UPDATE party_roles 
SET is_active = false 
WHERE code = 'deprecated_role';

-- Optionally migrate existing records
UPDATE contacts 
SET primary_role_code = 'replacement_role' 
WHERE primary_role_code = 'deprecated_role';
```

### Quick Role Analytics (Ad-hoc)

```sql
-- Most common roles across contacts
SELECT 
  pr.label,
  pr.category,
  COUNT(c.id) as count
FROM contacts c
JOIN party_roles pr ON c.primary_role_code = pr.code
GROUP BY pr.code, pr.label, pr.category
ORDER BY count DESC
LIMIT 20;

-- Clients by role
SELECT 
  COALESCE(pr.label, 'No Role') as role,
  COUNT(cl.id) as count
FROM clients cl
LEFT JOIN party_roles pr ON cl.primary_role_code = pr.code
GROUP BY pr.code, pr.label
ORDER BY count DESC;

-- Records without roles (need manual assignment)
SELECT 
  'contacts' as entity_type,
  COUNT(*) as no_role_count
FROM contacts
WHERE primary_role_code IS NULL
UNION ALL
SELECT 
  'clients' as entity_type,
  COUNT(*) as no_role_count
FROM clients
WHERE primary_role_code IS NULL;
```

---

## Summary

### MVP Delivered (Week 1)

- ✅ Shared role categorization for contacts and clients (`party_roles` table)
- ✅ 40+ production-ready role codes organized by category
- ✅ Automatic role mapping from HubSpot/CSV imports
- ✅ UI components: simple badges, filters, selects (no category colors yet)
- ✅ Junk data handling (delete_flag → unknown + exclude flag)
- ✅ Backfill script with unmapped value reporting
- ✅ Performance optimized with indexes
- ✅ Full RLS policies
- ✅ Comprehensive testing checklist

### Phase 2 Features (Add When Needed)

- ⏸️ Multi-role support (contact_role_links / client_role_links tables)
- ⏸️ Suggested role inference (views/RPCs joining contacts → clients)
- ⏸️ Category-based badge colors (lender=blue, investor=green, etc.)
- ⏸️ Role analytics dashboard
- ⏸️ Materialized views for performance optimization

### Why This Approach Works

**Foundation First**: The `party_roles` lookup table is the critical piece. Once that's in place, everything else is additive without rework.

**Iterate Based on Usage**: Ship with basic UI, gather feedback on which roles dominate, then enhance visuals accordingly.

**Performance When Needed**: Start with simple joins. Add materialized views only if list page performance degrades.

**Complexity When Proven**: Don't build multi-role support until users actually request "This contact is both an investor AND a broker."

The system is production-ready, fast to ship, and trivially extensible!

