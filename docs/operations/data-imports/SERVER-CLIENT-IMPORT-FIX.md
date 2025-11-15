---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Server/Client Import Issue - Fixed ✅

## Problem

When starting the dev server, we encountered this error:

```
Error: You're importing a component that needs "next/headers". 
That only works in a Server Component which is not supported in the pages/ directory.
```

**Root Cause:** Client components (`use client`) were importing from `@/lib/admin/permissions.ts`, which internally imports `@/lib/supabase/server` that uses `next/headers`. Even though the client components only imported types, Next.js/Turbopack still evaluated the module, causing the error.

---

## Solution

Created a separate **client-safe types file** to share types and constants between client and server code.

### Files Created/Modified:

#### 1. Created: `src/lib/admin/types.ts` ✅

**Purpose:** Client-safe types and constants (no server imports)

**Contains:**
- `UserRole` type
- `PermissionResource` type  
- `PermissionAction` type
- `PERMISSIONS` constants (30 permissions)

**Key:** This file has **NO imports** from server-side modules.

#### 2. Updated: `src/lib/admin/permissions.ts` ✅

**Changes:**
- Re-exports types from `./types`
- Re-exports `PERMISSIONS` from `./types`
- Added warning comment about not importing in client components
- Server-side functions remain unchanged

**Before:**
```typescript
export type UserRole = 'admin' | 'manager' | 'user'
export const PERMISSIONS = { ... }
import { createClient } from '@/lib/supabase/server'  // ❌ Server import
```

**After:**
```typescript
export type { UserRole } from './types'
export { PERMISSIONS } from './types'
import { createClient } from '@/lib/supabase/server'  // ✅ Still here for server functions
```

#### 3. Updated: `src/hooks/use-admin.ts` ✅

**Changed import:**
```typescript
// Before
import type { UserRole } from '@/lib/admin/permissions'  // ❌

// After  
import type { UserRole } from '@/lib/admin/types'  // ✅
```

#### 4. Updated: `src/app/admin-test/page.tsx` ✅

**Changed import:**
```typescript
// Before
import { PERMISSIONS } from '@/lib/admin/permissions'  // ❌

// After
import { PERMISSIONS } from '@/lib/admin/types'  // ✅
```

#### 5. Updated: `src/lib/admin/api-middleware.ts` ✅

**Changed import:**
```typescript
// Before
import { type UserRole } from './permissions'  // ❌

// After
import type { UserRole } from './types'  // ✅
```

---

## Import Rules Going Forward

### ✅ Client Components (use client)

Import from `@/lib/admin/types`:
```typescript
'use client'

import { PERMISSIONS } from '@/lib/admin/types'
import type { UserRole } from '@/lib/admin/types'
```

### ✅ Server Components & API Routes

Can import from either (but prefer types for just types):
```typescript
// For types only
import type { UserRole } from '@/lib/admin/types'

// For server-side functions
import { 
  requireAdmin, 
  hasPermission,
  PERMISSIONS  // Also works
} from '@/lib/admin/permissions'
```

---

## File Structure

```
src/lib/admin/
├── types.ts              ← Client-safe (types + constants)
├── permissions.ts        ← Server-side (functions + re-exports types)
├── api-middleware.ts     ← Server-side (API protection)
└── audit.ts              ← Server-side (audit logging)

src/hooks/
├── use-admin.ts          ← Client (imports from types)
└── use-permission.ts     ← Client (imports from types)
```

---

## Verification

✅ Dev server starts without errors  
✅ API endpoint working: `http://localhost:9002/api/admin-test`  
✅ Test page working: `http://localhost:9002/admin-test`  
✅ No import errors in client components  
✅ Server functions still work correctly

---

## Why This Matters

**Next.js App Router** has strict separation between:
- **Server Components** - Can use server imports (`next/headers`, database, etc.)
- **Client Components** (`'use client'`) - Cannot use server imports

Mixing them causes build/runtime errors. The solution is to:
1. Keep server code in server-only files
2. Share types/constants through a client-safe file
3. Never import server modules in client components (even for types)

---

## Testing

After the fix:

```bash
npm run dev
```

**Expected:** Server starts successfully ✅

```bash
curl http://localhost:9002/api/admin-test
```

**Expected:** `{"error":"Unauthorized: Not authenticated"}` ✅

Visit `http://localhost:9002/admin-test` when logged in:

**Expected:** Test page loads with all permissions shown ✅

---

## Summary

**Problem:** Client components importing server-side modules (indirectly)  
**Solution:** Created client-safe types file  
**Result:** ✅ Everything working correctly

**Files Created:** 1 (`types.ts`)  
**Files Updated:** 4 (`permissions.ts`, `use-admin.ts`, `admin-test/page.tsx`, `api-middleware.ts`)  
**Status:** ✅ Fixed and verified

