-- Seed Data for Testing Client Portal
-- This file creates sample data for development/testing
-- DO NOT run this in production!

-- Note: Users must be created via Supabase Auth (use the registration UI)
-- This seed file only creates the related data (tenants, properties, orders)

-- ============================================================================
-- SAMPLE TENANTS
-- ============================================================================
-- These will be created automatically during user registration
-- This is just for reference/documentation

/*
Sample tenant types:
- lender: Mortgage Lender
- investor: Real Estate Investor
- amc: Appraisal Management Company
- attorney: Attorney / Law Firm
- accountant: Accountant / CPA Firm
- internal: Appraisal Company (Internal Use)
*/

-- ============================================================================
-- SAMPLE PROPERTIES
-- ============================================================================
-- Note: Replace 'your-tenant-id' with actual tenant ID after registration

-- Sample property 1
-- INSERT INTO public.properties (
--   address,
--   city,
--   state,
--   zip,
--   property_type,
--   tenant_id
-- ) VALUES (
--   '123 Main St',
--   'Miami',
--   'FL',
--   '33101',
--   'single_family',
--   'your-tenant-id'
-- );

-- Sample property 2
-- INSERT INTO public.properties (
--   address,
--   city,
--   state,
--   zip,
--   property_type,
--   tenant_id
-- ) VALUES (
--   '456 Ocean Drive',
--   'Miami Beach',
--   'FL',
--   '33139',
--   'condo',
--   'your-tenant-id'
-- );

-- ============================================================================
-- SAMPLE ORDERS
-- ============================================================================
-- Note: Replace 'your-tenant-id' and 'property-id' with actual IDs

-- Sample order 1 - Pending
-- INSERT INTO public.orders (
--   property_id,
--   tenant_id,
--   status,
--   order_type,
--   ordered_date,
--   due_date,
--   borrower_name,
--   loan_number,
--   notes,
--   fee
-- ) VALUES (
--   'property-id-1',
--   'your-tenant-id',
--   'pending',
--   'full_appraisal',
--   NOW(),
--   NOW() + INTERVAL '7 days',
--   'John Doe',
--   'LOAN-123456',
--   'Please schedule inspection between 9am-5pm',
--   450.00
-- );

-- Sample order 2 - In Progress
-- INSERT INTO public.orders (
--   property_id,
--   tenant_id,
--   status,
--   order_type,
--   ordered_date,
--   due_date,
--   borrower_name,
--   loan_number,
--   fee
-- ) VALUES (
--   'property-id-2',
--   'your-tenant-id',
--   'in_progress',
--   'drive_by',
--   NOW() - INTERVAL '2 days',
--   NOW() + INTERVAL '5 days',
--   'Jane Smith',
--   'LOAN-789012',
--   350.00
-- );

-- ============================================================================
-- TESTING WORKFLOW
-- ============================================================================
/*

1. REGISTER A USER:
   - Go to http://localhost:9002/login
   - Click "Sign Up"
   - Fill in:
     - Name: Test User
     - Email: test@example.com
     - Password: Test1234
     - Company: Acme Lending
     - Type: Mortgage Lender
   - This creates a user + tenant automatically

2. GET YOUR TENANT ID:
   Run in Supabase SQL Editor:

   SELECT t.id as tenant_id, t.name, p.id as user_id, au.email
   FROM tenants t
   JOIN profiles p ON p.tenant_id = t.id
   JOIN auth.users au ON au.id = p.id
   WHERE au.email = 'test@example.com';

3. CREATE SAMPLE DATA:
   Replace the tenant_id in the INSERT statements above and uncomment them
   Run them in Supabase SQL Editor

4. TEST BORROWER ACCESS:
   Use the borrower invite API:

   POST /api/borrower/invite
   {
     "email": "borrower@example.com",
     "orderId": "your-order-id",
     "borrowerName": "John Doe"
   }

   Check the email for the magic link!

5. TEST ORDER STATUS UPDATES:

   PATCH /api/orders/[order-id]/status
   {
     "status": "in_progress",
     "notes": "Inspector assigned - scheduled for tomorrow"
   }

*/

-- ============================================================================
-- QUICK START SEED (Run after first user registration)
-- ============================================================================
/*

-- Step 1: Get your user ID and tenant ID
SELECT
  au.id as user_id,
  au.email,
  p.tenant_id,
  t.name as company_name
FROM auth.users au
JOIN profiles p ON p.id = au.id
JOIN tenants t ON t.id = p.tenant_id
WHERE au.email = 'YOUR_EMAIL_HERE';

-- Step 2: Create sample properties (replace YOUR_TENANT_ID)
WITH new_properties AS (
  INSERT INTO public.properties (address, city, state, zip, property_type, tenant_id)
  VALUES
    ('123 Main St', 'Miami', 'FL', '33101', 'single_family', 'YOUR_TENANT_ID'),
    ('456 Ocean Dr', 'Miami Beach', 'FL', '33139', 'condo', 'YOUR_TENANT_ID'),
    ('789 Palm Ave', 'Fort Lauderdale', 'FL', '33301', 'townhouse', 'YOUR_TENANT_ID')
  RETURNING id, address
)
SELECT * FROM new_properties;

-- Step 3: Create sample orders (replace YOUR_TENANT_ID and PROPERTY_IDs)
INSERT INTO public.orders (
  property_id,
  tenant_id,
  status,
  order_type,
  ordered_date,
  due_date,
  borrower_name,
  loan_number,
  fee
)
VALUES
  (
    'PROPERTY_ID_1',
    'YOUR_TENANT_ID',
    'pending',
    'full_appraisal',
    NOW(),
    NOW() + INTERVAL '7 days',
    'John Doe',
    'LOAN-001',
    450.00
  ),
  (
    'PROPERTY_ID_2',
    'YOUR_TENANT_ID',
    'in_progress',
    'drive_by',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '5 days',
    'Jane Smith',
    'LOAN-002',
    350.00
  ),
  (
    'PROPERTY_ID_3',
    'YOUR_TENANT_ID',
    'completed',
    'desktop',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '3 days',
    'Bob Johnson',
    'LOAN-003',
    300.00
  );

*/

-- ============================================================================
-- STATUS VALUES REFERENCE
-- ============================================================================
/*

Valid order status values:
- pending: Order received, waiting for assignment
- assigned: Assigned to appraiser
- scheduled: Inspection scheduled
- in_progress: Work in progress
- inspection_complete: Inspection done, writing report
- writing: Report being written
- review: Report under review
- completed: Report complete, ready for delivery
- delivered: Report delivered to client
- cancelled: Order cancelled
- on_hold: Order on hold

*/

-- ============================================================================
-- CLEANUP (if you want to start fresh)
-- ============================================================================
/*

-- WARNING: This deletes ALL data!
-- Only use in development/testing

DELETE FROM public.borrower_order_access;
DELETE FROM public.order_status_history;
DELETE FROM public.orders;
DELETE FROM public.properties;
DELETE FROM public.clients;
-- Note: Don't delete profiles/tenants as they're tied to auth.users

*/
