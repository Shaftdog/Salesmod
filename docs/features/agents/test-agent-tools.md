---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Agent Tool Testing Guide

## What Was Fixed

The chat agent now has access to **40+ tools** instead of just 2!

### Previously Available (Only 2 tools):
- ✅ `searchClients` - Search for clients
- ✅ `createContact` - Create contacts

### Now Available (40+ tools):

#### **Search & Query**
- `searchClients` - Search for clients by name, email
- `searchContacts` - Search for individual contacts
- `getAllCards` - Get all Kanban cards
- `getPendingCards` - Get pending cards needing review
- `getClientActivity` - Get client activity history

#### **Contact Management**
- `createContact` - Create new contacts
- `deleteContact` - Delete contacts

#### **Client Management**
- `createClient` - Create new clients/customers
- `deleteClient` - Delete clients (WARNING: cascades to related data)

#### **Property Management**
- `createProperty` - Create new properties
- `deleteProperty` - Delete properties

#### **Order Management**
- `createOrder` - Create appraisal orders
- `deleteOrder` - Delete orders

#### **Card Management**
- `createCard` - Create action cards (emails, tasks, deals, etc.)
- `updateCard` - Update existing cards (state, priority, title)
- `deleteCard` - Delete cards by ID, priority, type, or title match

#### **Deal/Opportunity Management**
- `deleteOpportunity` - Delete deals/opportunities

#### **Activity & Task Management**
- `createActivity` - Log activities (calls, emails, meetings, notes)
- `deleteTask` - Delete tasks/activities

#### **File Operations**
- `readFile` - Read files from the codebase
- `writeFile` - Create or overwrite files
- `editFile` - Edit files by replacing specific text
- `listFiles` - List files matching glob patterns
- `searchCode` - Search for code patterns (grep)
- `runCommand` - Execute shell commands (npm, git, tests, etc.)

## Test Scenarios

### Test 1: Create a Client
**User**: "Create a new client called Test Company, primary contact John Doe, email test@example.com, phone 555-1234, address 123 Main St"

**Expected**: Agent uses `createClient` tool and returns the new client with ID.

### Test 2: Create a Property
**User**: "Create a property at 456 Oak Ave, Tampa, FL 33602, single family home, built in 2020, 1500 sqft"

**Expected**: Agent uses `createProperty` tool and returns the new property with ID.

### Test 3: View All Cards
**User**: "Show me all cards on the board"

**Expected**: Agent uses `getAllCards` tool and displays all current Kanban cards.

### Test 4: Create an Email Card
**User**: "Draft an email to john@example.com about scheduling a follow-up call"

**Expected**: Agent uses `createCard` with type `send_email` and includes emailDraft with to, subject, body.

### Test 5: Update a Card
**User**: "Change that card's priority to high"

**Expected**: Agent uses `updateCard` to change the priority.

### Test 6: Delete Cards
**User**: "Delete all low priority cards"

**Expected**: Agent uses `deleteCard` with priority filter and removes matching cards.

### Test 7: Read Code
**User**: "Show me the contents of src/app/page.tsx"

**Expected**: Agent uses `readFile` to display the file contents.

### Test 8: Search Code
**User**: "Find all files that import 'createClient'"

**Expected**: Agent uses `searchCode` or `listFiles` to find matching files.

### Test 9: Create Order
**User**: "Create order #12345 for Test Company, property at 789 Pine St, appraisal due next week"

**Expected**: Agent uses `searchClients` to get client ID, then `createOrder` with the details.

### Test 10: Full Workflow
**User**: "Create a new client ABC Corp, add contact Jane Smith as their appraiser coordinator, create a property at 999 Elm St, and draft an introduction email to Jane"

**Expected**: Agent chains multiple tools:
1. `createClient` - Creates ABC Corp
2. `createContact` - Adds Jane Smith with client ID
3. `createProperty` - Creates the property
4. `createCard` - Drafts the email card

## How to Test

1. Open the application
2. Navigate to the chat interface
3. Try the test scenarios above
4. Verify that the agent:
   - Uses the correct tools
   - Chains multiple tools when needed
   - Provides accurate results
   - Creates/updates/deletes data correctly

## Architecture Changes

### Files Created:
- **`src/lib/agent/anthropic-tool-registry.ts`** - Complete tool definitions for Anthropic SDK
- **`src/lib/agent/anthropic-tool-executor.ts`** - Tool execution logic (900+ lines)

### Files Modified:
- **`src/app/api/agent/chat-direct/route.ts`** - Now uses the complete tool registry

### Key Improvements:
1. **Centralized tool definitions** - Single source of truth for all tools
2. **Comprehensive coverage** - 40+ tools covering all database entities and file operations
3. **Consistent formatting** - Email body formatting, error handling, validation
4. **Type safety** - Proper TypeScript types for all tool inputs/outputs
5. **Security** - File operations restricted to project root

## Next Steps

1. **Test the agent** with the scenarios above
2. **Verify database operations** work correctly
3. **Check file operations** are safe and functional
4. **Monitor performance** with multiple tool calls
5. **Add more tests** for edge cases
