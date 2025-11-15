# Simple Role Integration Guide

## Quick Start: Add Role Dropdowns to Your App

This guide shows you how to add simple role selection and filtering to your existing contacts and clients pages.

---

## 1. Contacts List Page - Add Role Filter

**File**: `src/app/(app)/contacts/page.tsx`

### Add Import
```typescript
import { RoleFilter } from '@/components/shared/role-filter';
```

### Add State (after line 27)
```typescript
const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
```

### Update Filtered Contacts (around line 38)
```typescript
const filteredContacts = useMemo(() => {
  if (!contacts) return [];
  
  let filtered = contacts;
  
  // Filter by search term
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filtered = filtered.filter(contact => {
      return (
        contact.firstName?.toLowerCase().includes(search) ||
        contact.lastName?.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.title?.toLowerCase().includes(search) ||
        contact.department?.toLowerCase().includes(search) ||
        contact.client?.companyName?.toLowerCase().includes(search)
      );
    });
  }
  
  // ADD THIS: Filter by role
  if (selectedRoles.length > 0) {
    filtered = filtered.filter(contact => 
      contact.primaryRoleCode && selectedRoles.includes(contact.primaryRoleCode)
    );
  }
  
  return filtered;
}, [contacts, searchTerm, selectedRoles]); // Add selectedRoles to dependencies
```

### Add Filter Button (in the search/filter section, probably around line 140)
Find where you have the search input, and add the filter next to it:

```typescript
<div className="flex gap-2">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Search contacts..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10"
    />
  </div>
  {/* ADD THIS: */}
  <RoleFilter 
    selectedRoles={selectedRoles} 
    onChange={setSelectedRoles} 
  />
  <Button onClick={handleAdd}>
    <PlusCircle className="mr-2 h-4 w-4" />
    Add Contact
  </Button>
</div>
```

---

## 2. Contact Detail Page - Add Role Selector

**File**: `src/app/(app)/contacts/[id]/page.tsx`

### Add Imports
```typescript
import { RoleSelect } from '@/components/shared/role-select';
import { RoleBadge } from '@/components/shared/role-badge';
```

### Display Current Role (in the header section)
```typescript
<div className="flex items-center gap-2">
  <h1 className="text-3xl font-bold">
    {contact.firstName} {contact.lastName}
  </h1>
  {/* ADD THIS: */}
  <RoleBadge 
    code={contact.primaryRoleCode} 
    label={contact.role?.label} 
  />
</div>
```

### Add Role Editor (in your edit form section)
Find where you have other edit fields, and add:

```typescript
<div className="space-y-2">
  <label className="text-sm font-medium">Role</label>
  <RoleSelect
    value={contact.primaryRoleCode}
    onChange={(roleCode) => {
      // Update contact role
      updateContact({
        id: contact.id,
        primary_role_code: roleCode
      });
    }}
  />
</div>
```

---

## 3. Clients List Page - Add Role Filter

**File**: `src/app/(app)/clients/page.tsx`

Same pattern as contacts:

### Add Import
```typescript
import { RoleFilter } from '@/components/shared/role-filter';
```

### Add State
```typescript
const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
```

### Filter Logic
```typescript
const filteredClients = useMemo(() => {
  if (!clients) return [];
  
  let filtered = clients;
  
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filtered = filtered.filter(client => {
      return client.companyName?.toLowerCase().includes(search) ||
             client.email?.toLowerCase().includes(search) ||
             client.primaryContact?.toLowerCase().includes(search);
    });
  }
  
  // ADD THIS:
  if (selectedRoles.length > 0) {
    filtered = filtered.filter(client => 
      client.primaryRoleCode && selectedRoles.includes(client.primaryRoleCode)
    );
  }
  
  return filtered;
}, [clients, searchTerm, selectedRoles]);
```

### Add Filter Button
```typescript
<div className="flex gap-2">
  <Input ... />
  <RoleFilter selectedRoles={selectedRoles} onChange={setSelectedRoles} />
  <Button>Add Client</Button>
</div>
```

---

## 4. Client Detail Page - Add Role Selector

**File**: `src/app/(app)/clients/[id]/page.tsx`

Same pattern as contact detail:

### Add Imports
```typescript
import { RoleSelect } from '@/components/shared/role-select';
import { RoleBadge } from '@/components/shared/role-badge';
```

### Show Badge in Header
```typescript
<div className="flex items-center gap-2">
  <h1>{client.companyName}</h1>
  <RoleBadge code={client.primaryRoleCode} label={client.role?.label} />
</div>
```

### Add Role Editor
```typescript
<div className="space-y-2">
  <label className="text-sm font-medium">Role</label>
  <RoleSelect
    value={client.primaryRoleCode}
    onChange={(roleCode) => {
      updateClient({
        id: client.id,
        primary_role_code: roleCode
      });
    }}
  />
</div>
```

---

## 5. Update Data Fetching (Important!)

Make sure your hooks fetch the role data:

### In `src/hooks/use-contacts.ts`
```typescript
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('contacts')
        .select('*, clients(*), party_roles(*)') // ADD party_roles
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(transformContact) : [];
    },
  });
}
```

### In `src/hooks/use-clients.ts`
```typescript
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('clients')
        .select('*, party_roles(*)') // ADD party_roles
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(transformClient) : [];
    },
  });
}
```

---

## That's It! 

Now you have:
- ✅ Role filter dropdowns on list pages
- ✅ Role selector in edit forms
- ✅ Role badges showing current role

Everything is simple, lightweight, and uses the components that are already built.

---

## Quick Test

1. Run migration: `supabase migration up`
2. Start app: `npm run dev`
3. Go to `/contacts` - you should see the role filter
4. Click on a contact - you should see role badge and can change it
5. Same for `/clients`

Done! 🎉

