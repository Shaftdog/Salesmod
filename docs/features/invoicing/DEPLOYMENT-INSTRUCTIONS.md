---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Invoicing Module Deployment Instructions

## Overview

This document provides step-by-step instructions for deploying the invoicing module to production.

## Prerequisites

- [ ] Supabase project configured and linked
- [ ] Stripe account with API keys
- [ ] Environment variables configured
- [ ] Database backup completed (if upgrading existing system)

## Environment Variables

Add the following to your production environment:

```env
# Stripe (required for Stripe payment links)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Stripe API version
STRIPE_API_VERSION=2024-11-20.acacia

# Optional: Rate limiting (recommended)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Database Migration

### Step 1: Run the Migration

The migration file is located at:
`supabase/migrations/20251116120000_create_invoicing_system.sql`

**Option A: Via Supabase CLI (Recommended)**

```bash
# Link to your project (if not already linked)
npx supabase link --project-ref your-project-ref

# Push the migration
npm run db:push
```

**Option B: Via Supabase Dashboard**

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Open SQL Editor
3. Copy and paste the entire migration file
4. Click "Run"

**Option C: Via psql (Advanced)**

```bash
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  -f supabase/migrations/20251116120000_create_invoicing_system.sql
```

### Step 2: Verify Migration

After running the migration, verify it was successful:

```sql
-- Check that tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('invoices', 'invoice_line_items', 'payments', 'invoice_number_sequences');

-- Run verification function
SELECT * FROM public.verify_invoicing_setup();
```

Expected output:
```
 table_name             | row_count | indexes | rls_enabled
------------------------+-----------+---------+-------------
 invoices               |         0 |      10 | t
 invoice_line_items     |         0 |       6 | t
 payments               |         0 |       7 | t
 invoice_number_sequences|         0 |       2 | t
```

## Stripe Webhook Configuration

### Step 1: Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### Step 2: Configure Webhook Secret

1. Copy the webhook signing secret from Stripe dashboard
2. Add to your environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Step 3: Test Webhook

```bash
# Use Stripe CLI to test webhooks locally first
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger invoice.payment_succeeded
```

## Application Deployment

### Step 1: Build and Deploy

```bash
# Run type check
npm run typecheck

# Run tests
npm run test

# Build for production
npm run build

# Deploy (e.g., Vercel)
vercel --prod
```

### Step 2: Post-Deployment Verification

1. **Check API Health**
   ```bash
   curl https://your-domain.com/api/invoices
   # Should return 401 (unauthorized) or 200 with empty array
   ```

2. **Test Invoice Creation**
   - Create test invoice via UI or API
   - Verify invoice number generation works
   - Check database for created records

3. **Test Stripe Integration**
   - Create test invoice with Stripe payment method
   - Generate payment link
   - Verify link works in test mode

4. **Test Webhook Processing**
   - Use Stripe CLI to send test webhook
   - Verify webhook is received and processed
   - Check payment status is updated correctly

## Rollback Procedure

If deployment fails and you need to rollback:

### Rollback Application

```bash
# Revert to previous deployment (Vercel example)
vercel rollback
```

### Rollback Database (Use with Caution)

```sql
-- Drop tables in reverse order
DROP VIEW IF EXISTS public.revenue_recognition CASCADE;
DROP VIEW IF EXISTS public.client_payment_history CASCADE;
DROP VIEW IF EXISTS public.invoice_aging_report CASCADE;

DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoice_line_items CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.invoice_number_sequences CASCADE;

DROP TYPE IF EXISTS public.payment_type CASCADE;
DROP TYPE IF EXISTS public.cod_collection_method_type CASCADE;
DROP TYPE IF EXISTS public.invoice_status CASCADE;
DROP TYPE IF EXISTS public.payment_method_type CASCADE;

DROP FUNCTION IF EXISTS public.verify_invoicing_setup();
DROP FUNCTION IF EXISTS public.invoice_days_overdue(p_invoice_id UUID);
DROP FUNCTION IF EXISTS public.update_invoice_payment_status();
DROP FUNCTION IF EXISTS public.calculate_invoice_totals();
DROP FUNCTION IF EXISTS public.calculate_line_item_amount();
DROP FUNCTION IF EXISTS public.generate_invoice_number(p_org_id UUID);
DROP FUNCTION IF EXISTS public.update_invoicing_updated_at();
```

## Monitoring Setup

### Metrics to Monitor

1. **Invoice Creation Rate**
   ```sql
   SELECT COUNT(*)
   FROM invoices
   WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

2. **Payment Success Rate**
   ```sql
   SELECT
     COUNT(CASE WHEN status = 'paid' THEN 1 END) * 100.0 / COUNT(*) as success_rate
   FROM invoices
   WHERE created_at > NOW() - INTERVAL '1 day';
   ```

3. **Webhook Failures**
   - Monitor application logs for webhook errors
   - Set up alerts for repeated failures

4. **Database Performance**
   - Query response times
   - Connection pool usage
   - Slow query logs

### Recommended Alerts

- Alert if invoice creation fails > 5 times/hour
- Alert if webhook processing fails > 10 times/hour
- Alert if database query time > 1 second
- Alert if Stripe API calls fail > 5% of requests

## Post-Deployment Tasks

- [ ] Monitor error logs for 24 hours
- [ ] Verify all API endpoints are responding
- [ ] Test invoice creation workflow end-to-end
- [ ] Test payment processing workflow
- [ ] Verify email sending works (when implemented)
- [ ] Document any issues encountered
- [ ] Update team documentation
- [ ] Schedule training session for users

## Known Limitations

1. **Rate Limiting Not Implemented**
   - See docs/features/invoicing/RATE-LIMITING-REQUIREMENTS.md
   - Should be implemented before high-traffic usage

2. **Email Sending Not Implemented**
   - Invoice sending functionality requires email service integration
   - Currently returns success but doesn't send email

3. **PDF Generation Not Implemented**
   - Invoice PDFs are not generated
   - Should be added for professional invoicing

## Support Contacts

- Technical Issues: [Your support email]
- Stripe Issues: https://support.stripe.com
- Supabase Issues: https://supabase.com/support

## Change Log

### Version 1.0.0 (2025-11-16)

- Initial release of invoicing module
- Support for COD, Stripe, and Net Terms payment methods
- Multi-tenant invoice management
- Automatic payment tracking
- Aging reports and analytics
- Row Level Security for data isolation
