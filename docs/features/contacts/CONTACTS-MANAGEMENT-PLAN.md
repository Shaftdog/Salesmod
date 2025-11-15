# Contacts Management System - Implementation Plan

## Overview

Build a comprehensive, standalone `/contacts` section that treats contacts as first-class entities independent of their current company. This enables proper relationship management when people move between companies and provides a universal contact directory across all clients.

## Current State Analysis

**Already Exists:**
- ✅ `contacts` table with full schema (first_name, last_name, email, phone, mobile, title, department, notes, is_primary)
- ✅ `contacts.props` JSONB column (from migration system)
- ✅ Components: `ContactsList`, `ContactCard`, `ContactForm`
- ✅ Hooks: `useContacts()`, `useCreateContact()`, `useUpdateContact()`, `useDeleteContact()`
- ✅ Contacts viewable inside `/clients/[id]` page

**Missing:**
- ❌ Standalone `/contacts` page
- ❌ Individual contact detail pages
- ❌ Universal contact search
- ❌ Company transfer functionality
- ❌ Contact history tracking
- ❌ Sidebar menu item

## Pages to Create

### 1. Main Contacts List Page
**Location:** `src/app/(app)/contacts/page.tsx`

**Features:**
- Grid/list view of ALL contacts across all clients
- Search by name, email, company, title, department
- Filter by:
  - Company (dropdown of all clients)
  - Is Primary contact
  - Has email/phone
  - Recently added/updated
- Sort by: Name (A-Z, Z-A), Company, Date Added
- Pagination (50 contacts per page)
- Quick actions: Email, Call, Edit, Delete
- Bulk actions: Export to CSV, Tag contacts
- Empty state with "Add Contact" CTA
- Stats cards: Total Contacts, Primary Contacts, Contacts without Company

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Contacts                    [+ Add Contact]    │
│  Manage your business contacts                  │
├─────────────────────────────────────────────────┤
│  [Search...] [Filter by Company ▾] [Sort ▾]    │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Contact  │  │ Contact  │  │ Contact  │     │
│  │ Card 1   │  │ Card 2   │  │ Card 3   │     │
│  │ @ Company│  │ @ Company│  │ @ Company│     │
│  └──────────┘  └──────────┘  └──────────┘     │
│  [View all → Client Page]                      │
└─────────────────────────────────────────────────┘
```

### 2. Individual Contact Detail Page
**Location:** `src/app/(app)/contacts/[id]/page.tsx`

**Sections (Tabs):**

**Tab 1: Overview**
- Contact information card (editable)
- Current company with link
- Contact methods (email, phone, mobile)
- Social links (LinkedIn, Twitter)
- Tags
- Quick actions: Email, Call, Schedule Meeting

**Tab 2: Activity Timeline**
- All activities related to this contact
- Emails, calls, meetings, notes
- Filter by activity type
- Add new activity button

**Tab 3: Company History**
- Timeline of companies they've worked at
- Stored in `props.company_history[]`
- Format: `[{client_id, company_name, from_date, to_date, title}]`
- "Transfer to Another Company" button

**Tab 4: Related Records**
- Orders they're associated with
- Deals they're involved in
- Tasks assigned to them
- Cases they've opened

**Tab 5: Files & Documents**
- Uploaded files related to this contact
- Shared documents
- Email attachments

**Tab 6: Notes & AI Insights** (Future)
- Internal notes
- AI-generated insights about relationship
- Communication patterns
- Best time to contact

## Components to Create/Update

### 3. Enhanced Contact Card Component
**Location:** `src/components/contacts/contact-card.tsx` (Update existing)

**Props:**
```typescript
interface ContactCardProps {
  contact: Contact;
  variant?: 'default' | 'compact' | 'detailed';
  showClient?: boolean; // Show company badge/link
  showActions?: boolean; // Show edit/delete buttons
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onClick?: (contact: Contact) => void; // Click to navigate to detail
}
```

**New Features:**
- Click anywhere on card to go to `/contacts/[id]`
- Company badge with link to client page
- Status indicators: Primary contact, Has email, Has phone
- Last activity timestamp
- Avatar with initials or photo
- Hover state with more actions

### 4. Contact Search & Filter Bar
**Location:** `src/components/contacts/contact-filters.tsx`

**Features:**
- Debounced search input (300ms)
- Multi-select company filter
- Toggle filters: Has Email, Has Phone, Is Primary
- Sort dropdown
- Clear all filters button
- Active filter chips

### 5. Company Transfer Dialog
**Location:** `src/components/contacts/transfer-company-dialog.tsx`

**Flow:**
1. Button: "Transfer to Another Company"
2. Dialog opens with:
   - Current company displayed
   - Searchable dropdown of all clients
   - Reason for transfer (optional text)
   - Option: "Keep history" (checked by default)
3. On confirm:
   - Store old company in `props.company_history`
   - Update `client_id` to new company
   - Log activity: "Contact transferred from X to Y"
   - Show success toast

### 6. Contact Detail Header
**Location:** `src/components/contacts/contact-detail-header.tsx`

**Elements:**
- Large avatar
- Name (editable inline)
- Title @ Company (both clickable)
- Primary contact badge
- Quick action buttons: Email, Call, Message
- Edit button (opens form)
- More menu: Delete, Transfer Company, Export vCard

### 7. Company History Timeline
**Location:** `src/components/contacts/company-history-timeline.tsx`

**Display:**
- Vertical timeline of company changes
- Each entry shows:
  - Company name with logo/icon
  - Date range (From - To)
  - Title at that company
  - Why they left (if captured)
- Current company at top with "Current" badge

### 8. Contact Activity List
**Location:** `src/components/contacts/contact-activities.tsx`

**Features:**
- Reuse existing `ActivityTimeline` component
- Filter activities for this specific contact
- Include activities from all companies they've worked at
- Show which company the activity was related to

## Database Enhancements

### Schema Updates (Optional - use existing `props` column)

```sql
-- Already exists from migration system:
-- ALTER TABLE contacts ADD COLUMN IF NOT EXISTS props JSONB DEFAULT '{}'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_primary ON contacts(is_primary);

-- Props structure will store:
{
  "company_history": [
    {
      "client_id": "uuid",
      "company_name": "Acme Corp",
      "from_date": "2020-01-01",
      "to_date": "2023-06-01",
      "title": "Senior Manager",
      "reason": "Career advancement"
    }
  ],
  "linkedin_url": "https://linkedin.com/in/...",
  "twitter_handle": "@username",
  "notes": "Met at conference 2023",
  "tags": ["decision-maker", "technical"],
  "best_contact_time": "9am-11am EST",
  "communication_preference": "email"
}
```

### Helper Functions

```sql
-- Function to get contact with full history
CREATE OR REPLACE FUNCTION get_contact_with_history(contact_uuid UUID)
RETURNS TABLE (
  contact_data JSONB,
  current_company JSONB,
  company_history JSONB,
  activity_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(c.*) as contact_data,
    to_jsonb(cl.*) as current_company,
    COALESCE(c.props->'company_history', '[]'::jsonb) as company_history,
    COUNT(a.id) as activity_count
  FROM contacts c
  LEFT JOIN clients cl ON c.client_id = cl.id
  LEFT JOIN activities a ON a.contact_id = c.id
  WHERE c.id = contact_uuid
  GROUP BY c.id, cl.id;
END;
$$ LANGUAGE plpgsql;
```

## API Routes (If Needed)

### `GET /api/contacts`
- List all contacts with pagination
- Query params: `?search=...&client_id=...&page=1&limit=50&sort=name_asc`
- Already mostly handled by existing `useContacts()` hook

### `POST /api/contacts/[id]/transfer`
- Transfer contact to new company
- Body: `{new_client_id, reason, keep_history}`
- Updates `client_id` and stores history in props

### `GET /api/contacts/[id]/activities`
- Get all activities for a contact
- Includes activities from all companies

### `GET /api/contacts/[id]/history`
- Get company history for a contact
- Returns parsed `props.company_history`

## Hooks to Create

### `src/hooks/use-contact-detail.ts`
```typescript
export function useContactDetail(id: string) {
  // Fetches contact with client info and activity count
  // Returns: { contact, client, activityCount, isLoading }
}
```

### `src/hooks/use-contact-transfer.ts`
```typescript
export function useTransferContact() {
  // Mutation to transfer contact to new company
  // Handles history storage and activity logging
}
```

### `src/hooks/use-contact-activities.ts`
```typescript
export function useContactActivities(contactId: string) {
  // Gets all activities for a specific contact
  // Across all companies they've worked at
}
```

## Navigation Updates

### Sidebar
**File:** `src/components/layout/sidebar.tsx`

Add to navItems:
```typescript
import { Users } from "lucide-react";

{ href: "/contacts", icon: Users, label: "Contacts" }
```

Position: After Clients, before Deals

### Breadcrumbs
Add breadcrumbs to contact detail page:
`Home > Contacts > [Contact Name]`

## Feature Enhancements

### 1. Contact Import Enhancement
Update migration system to better handle contact imports:
- Auto-detect when same email appears in multiple imports
- Prompt user: "This contact exists. Update or create new?"
- Preserve company history on re-import

### 2. Smart Contact Matching
When creating a new contact with existing email:
- Show warning: "Contact with this email already exists at [Company]"
- Options: View existing, Create anyway, Link to existing

### 3. Contact Merge
Future feature to merge duplicate contacts:
- Find duplicates by email or name similarity
- Show side-by-side comparison
- Choose which data to keep
- Merge activity history

### 4. Contact Export
Export contacts to:
- CSV file
- vCard (.vcf) for importing to email clients
- Google Contacts format
- Outlook contacts format

### 5. Contact Tags
Add tagging system:
- Tag contacts: "decision-maker", "technical", "finance"
- Filter by tags
- Bulk tag operations

### 6. Contact Scoring
AI-powered contact health score:
- Last contact date
- Response rate
- Activity frequency
- Deal involvement
- Risk of churn

## UX Patterns

### Search Experience
- Instant search with debounce
- Highlight matching text in results
- Show company name in search results
- Keyboard navigation (↑↓ Enter)

### Empty States
- No contacts: "Add your first contact"
- No search results: "No contacts match your search"
- No activities: "No activity yet for this contact"

### Loading States
- Skeleton loaders for contact cards
- Progressive loading: Show 20, load more on scroll
- Optimistic updates on edit/delete

### Mobile Responsiveness
- Stack cards on mobile
- Collapsible filters
- Swipe actions on cards (edit/delete)
- Bottom sheet for quick actions

## Testing Scenarios

1. **Create contact without company** - Should handle gracefully
2. **Transfer contact between companies** - History preserved
3. **Search contacts** - Finds by name, email, company
4. **Delete contact** - Confirm dialog, cascade activities
5. **Contact with same email** - Warn about duplicate
6. **Import contacts** - Use migration system, detect duplicates
7. **View contact history** - Shows all companies
8. **Contact activities** - Shows from all companies
9. **Primary contact** - Only one per company

## Implementation Order

### Phase 1: Basic Listing (2-3 hours)
1. Create `/contacts` page with basic list
2. Update sidebar with Contacts link
3. Add search functionality
4. Update ContactCard to show company and be clickable

### Phase 2: Detail Pages (3-4 hours)
5. Create `/contacts/[id]` detail page
6. Build contact detail header component
7. Add Overview tab with full contact info
8. Add Activity timeline tab

### Phase 3: Company Transfer (2-3 hours)
9. Build company transfer dialog
10. Create transfer API/hook
11. Implement company history storage
12. Build company history timeline component

### Phase 4: Enhancements (2-3 hours)
13. Add filters and sorting
14. Implement Related Records tab
15. Add stats cards
16. Polish mobile responsiveness

**Total Estimated Time: 10-14 hours**

## Success Metrics

- ✅ Can view all contacts in one place
- ✅ Can search across all contacts
- ✅ Can transfer contacts between companies
- ✅ Company history is preserved
- ✅ Can see contact's full activity history
- ✅ Contact detail page loads in <1s
- ✅ Search returns results in <300ms
- ✅ No duplicate contact issues
- ✅ Mobile responsive

## Future Roadmap

- Email integration (send emails directly)
- Calendar integration (schedule meetings)
- LinkedIn integration (auto-sync)
- Contact org chart visualization
- Duplicate detection algorithm
- Contact scoring/health
- Bulk import improvements
- Contact segments/lists
- Contact sharing between team members

## Implementation Checklist

### Phase 1: Basic Listing
- [ ] Create `/contacts` page with grid layout
- [ ] Update sidebar navigation with Contacts menu item
- [ ] Add search functionality with debounce
- [ ] Update ContactCard component to show company
- [ ] Make ContactCard clickable to detail page
- [ ] Add empty state and loading skeletons

### Phase 2: Detail Pages
- [ ] Create `/contacts/[id]` detail page route
- [ ] Build contact detail header component
- [ ] Add Overview tab with contact info
- [ ] Add Activity timeline tab
- [ ] Implement edit functionality
- [ ] Add breadcrumb navigation

### Phase 3: Company Transfer
- [ ] Build transfer company dialog component
- [ ] Create `POST /api/contacts/[id]/transfer` route
- [ ] Implement `useTransferContact` hook
- [ ] Store company history in props
- [ ] Build company history timeline component
- [ ] Add activity logging for transfers

### Phase 4: Enhancements
- [ ] Build contact filters component
- [ ] Add company filter dropdown
- [ ] Implement sorting options
- [ ] Add Related Records tab
- [ ] Add stats cards to main page
- [ ] Polish mobile responsiveness
- [ ] Add pagination or infinite scroll

### Optional Enhancements
- [ ] Contact export functionality
- [ ] Contact tags system
- [ ] Duplicate detection
- [ ] Smart contact matching on create
- [ ] Contact merge functionality
- [ ] Contact scoring algorithm


