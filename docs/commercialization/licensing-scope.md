---
status: current
last_verified: 2025-12-11
updated_by: Claude Code
---

# Salesmod Licensing Scope

## Executive Summary

This document outlines the work required to transform Salesmod from a single-tenant application into a licensable SaaS product for the appraisal industry.

**Current State**: Production-ready for single tenant use
**Target State**: Multi-tenant SaaS with self-service onboarding and subscription billing

**Estimated Effort**: 3-4 weeks of focused development
**Estimated Cost**: $15K-25K if outsourced (or 120-160 hours internal)

---

## Phase 1: Tenant Onboarding System

### 1.1 Self-Service Signup Flow

**Current Gap**: New tenants require manual database setup

**Required Work**:
- [ ] Public signup page at `/signup`
- [ ] Company information collection (name, address, phone)
- [ ] Admin user creation with email verification
- [ ] Automatic tenant provisioning on signup
- [ ] Welcome email with getting started guide
- [ ] Initial setup wizard (logo upload, business hours, etc.)

**Files to Create/Modify**:
```
src/app/(auth)/signup/page.tsx          # New signup page
src/app/api/auth/signup/route.ts        # Signup API
src/app/onboarding/page.tsx             # Setup wizard
src/lib/tenant/provisioning.ts          # Tenant creation logic
```

**Effort**: 16-24 hours

---

### 1.2 Tenant Configuration Dashboard

**Current Gap**: Settings are developer-managed, not user-facing

**Required Work**:
- [ ] Company settings page (branding, contact info)
- [ ] Logo and favicon upload with storage
- [ ] Email template customization
- [ ] Invoice template customization (logo, footer, terms)
- [ ] Default payment terms configuration
- [ ] Business hours and timezone settings
- [ ] Integration settings UI (Gmail, Stripe API keys)

**Files to Create/Modify**:
```
src/app/settings/company/page.tsx       # Company settings
src/app/settings/branding/page.tsx      # Logo/colors
src/app/settings/integrations/page.tsx  # API keys
src/lib/storage/logo-upload.ts          # File handling
```

**Effort**: 20-28 hours

---

## Phase 2: Subscription Billing

### 2.1 Stripe Subscriptions Integration

**Current Gap**: Invoicing exists but no recurring subscription billing

**Required Work**:
- [ ] Stripe Customer creation on tenant signup
- [ ] Subscription plan selection UI
- [ ] Stripe Checkout integration for plan purchase
- [ ] Webhook handling for subscription events
- [ ] Subscription status tracking in database
- [ ] Grace period handling for failed payments
- [ ] Plan upgrade/downgrade flow

**Suggested Pricing Tiers**:

| Plan | Users | Price | Features |
|------|-------|-------|----------|
| Starter | 1-3 | $299/mo | Core CRM, Orders, Invoicing |
| Professional | 4-10 | $599/mo | + AI Agent, Marketing |
| Business | 11-25 | $999/mo | + Field Services, Full Suite |
| Enterprise | 25+ | Custom | + White-label, Priority Support |

**Database Changes**:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL, -- active, past_due, canceled, trialing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  users_count INT,
  orders_count INT,
  emails_sent INT,
  ai_tokens_used INT
);
```

**Files to Create/Modify**:
```
src/app/settings/billing/page.tsx           # Billing dashboard
src/app/api/billing/checkout/route.ts       # Stripe checkout
src/app/api/billing/portal/route.ts         # Customer portal
src/app/api/webhooks/stripe/route.ts        # Subscription webhooks
src/lib/billing/subscription.ts             # Subscription logic
src/middleware.ts                           # Plan enforcement
```

**Effort**: 24-32 hours

---

### 2.2 Usage Metering & Limits

**Current Gap**: No usage tracking or plan-based feature gating

**Required Work**:
- [ ] User count tracking per tenant
- [ ] Order count tracking per billing period
- [ ] AI token usage tracking
- [ ] Email send count tracking
- [ ] Plan-based feature flags
- [ ] Usage dashboard for customers
- [ ] Overage alerts and notifications
- [ ] Soft limits with upgrade prompts

**Feature Gating by Plan**:

| Feature | Starter | Professional | Business |
|---------|---------|--------------|----------|
| AI Agent | - | 500 actions/mo | Unlimited |
| Email Campaigns | 500/mo | 2,000/mo | 10,000/mo |
| Field Services | - | - | Yes |
| Marketing Module | Basic | Full | Full |
| API Access | - | Read-only | Full |
| White-label | - | - | Enterprise |

**Files to Create/Modify**:
```
src/lib/billing/usage.ts                # Usage tracking
src/lib/billing/limits.ts               # Limit checking
src/components/billing/usage-meter.tsx  # Usage display
src/hooks/use-feature-flag.ts           # Feature gating
```

**Effort**: 16-20 hours

---

## Phase 3: White-Label Support

### 3.1 Branding Customization

**Current Gap**: Salesmod branding hardcoded throughout

**Required Work**:
- [ ] Tenant-specific logo in header/sidebar
- [ ] Customizable primary/accent colors
- [ ] Tenant name in page titles
- [ ] Custom favicon per tenant
- [ ] Email templates use tenant branding
- [ ] Invoice templates use tenant branding
- [ ] Login page customization
- [ ] Client portal branding

**Database Changes**:
```sql
ALTER TABLE tenants ADD COLUMN branding JSONB DEFAULT '{
  "logo_url": null,
  "favicon_url": null,
  "primary_color": "#0066cc",
  "accent_color": "#00cc66",
  "company_name": null,
  "tagline": null
}';
```

**Files to Create/Modify**:
```
src/lib/branding/theme.ts               # Dynamic theming
src/components/layout/branded-header.tsx
src/app/api/branding/upload/route.ts    # Asset upload
```

**Effort**: 12-16 hours

---

### 3.2 Custom Domain Support (Enterprise)

**Current Gap**: All tenants share single domain

**Required Work**:
- [ ] Custom domain configuration UI
- [ ] SSL certificate provisioning (via Vercel or Cloudflare)
- [ ] Domain verification (DNS TXT record)
- [ ] Tenant lookup by domain
- [ ] Email sending from custom domain (optional)

**Note**: This is enterprise-tier and can be deferred.

**Effort**: 16-24 hours (can defer)

---

## Phase 4: End-User Documentation

### 4.1 Help Center / Knowledge Base

**Current Gap**: Documentation is developer-focused

**Required Work**:
- [ ] User-facing help center at `/help`
- [ ] Feature documentation with screenshots
- [ ] Video tutorials for key workflows
- [ ] FAQ section
- [ ] Search functionality
- [ ] Contextual help links throughout app
- [ ] In-app tooltips for complex features

**Content Required**:
- Getting Started Guide (30 min read)
- CRM & Contact Management
- Order Processing Workflow
- AI Agent Configuration
- Marketing Campaigns
- Invoicing & Payments
- Field Services Setup
- Gmail Integration
- Troubleshooting Guide

**Effort**: 24-32 hours (content creation)

---

### 4.2 In-App Onboarding

**Current Gap**: No guided onboarding for new users

**Required Work**:
- [ ] First-login checklist modal
- [ ] Feature tour with tooltips
- [ ] Sample data option for demos
- [ ] Progress tracking (% setup complete)
- [ ] Contextual tips for empty states

**Files to Create/Modify**:
```
src/components/onboarding/checklist.tsx
src/components/onboarding/feature-tour.tsx
src/lib/onboarding/progress.ts
```

**Effort**: 12-16 hours

---

## Phase 5: Support Infrastructure

### 5.1 Support Ticket System

**Current Gap**: No customer support workflow

**Required Work**:
- [ ] Support ticket submission form
- [ ] Ticket tracking dashboard (admin)
- [ ] Email notifications for ticket updates
- [ ] Priority levels and SLA tracking
- [ ] Integration with existing case management (reuse cases table)
- [ ] Customer-facing ticket history

**Note**: Can leverage existing case management system with modifications.

**Effort**: 8-12 hours

---

### 5.2 Admin Super-Dashboard

**Current Gap**: No cross-tenant admin visibility

**Required Work**:
- [ ] Super-admin role (cross-tenant access)
- [ ] All-tenants dashboard (MRR, usage, health)
- [ ] Tenant impersonation for support
- [ ] Usage analytics across tenants
- [ ] Churn risk indicators
- [ ] Revenue reporting

**Files to Create/Modify**:
```
src/app/admin/tenants/page.tsx          # Tenant list
src/app/admin/analytics/page.tsx        # Cross-tenant stats
src/lib/admin/impersonation.ts          # Support access
```

**Effort**: 16-20 hours

---

## Phase 6: Security & Compliance

### 6.1 Security Hardening

**Current State**: Good foundation with RLS

**Required Work**:
- [ ] Rate limiting on all API endpoints
- [ ] API key authentication for integrations
- [ ] Audit log retention policies
- [ ] Data export (GDPR compliance)
- [ ] Account deletion workflow
- [ ] Password policy enforcement
- [ ] Session management improvements
- [ ] Security headers review

**Effort**: 12-16 hours

---

### 6.2 Terms of Service & Privacy Policy

**Current Gap**: No legal documents

**Required Work**:
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Cookie consent banner
- [ ] Data Processing Agreement (DPA) template
- [ ] Acceptance tracking on signup

**Note**: Legal review recommended before launch.

**Effort**: 4-8 hours (pages, not legal review)

---

## Implementation Timeline

### Week 1: Foundation
| Day | Tasks |
|-----|-------|
| 1-2 | Self-service signup flow |
| 3-4 | Tenant configuration dashboard |
| 5 | Database migrations, testing |

### Week 2: Billing
| Day | Tasks |
|-----|-------|
| 1-2 | Stripe subscriptions integration |
| 3-4 | Usage metering & limits |
| 5 | Billing UI, webhooks testing |

### Week 3: Polish
| Day | Tasks |
|-----|-------|
| 1-2 | White-label branding |
| 3-4 | End-user documentation |
| 5 | In-app onboarding |

### Week 4: Launch Prep
| Day | Tasks |
|-----|-------|
| 1-2 | Support infrastructure |
| 3 | Security hardening |
| 4 | Legal pages, final testing |
| 5 | Soft launch to beta customers |

---

## Effort Summary

| Phase | Hours (Low) | Hours (High) |
|-------|-------------|--------------|
| 1. Tenant Onboarding | 36 | 52 |
| 2. Subscription Billing | 40 | 52 |
| 3. White-Label Support | 12 | 16 |
| 4. Documentation | 36 | 48 |
| 5. Support Infrastructure | 24 | 32 |
| 6. Security & Compliance | 16 | 24 |
| **Total** | **164** | **224** |

**At $150/hour**: $24,600 - $33,600
**At internal cost**: 4-6 weeks of focused development

---

## Go-To-Market Considerations

### Pricing Strategy

**Recommended Approach**: Value-based pricing focused on ROI

- AI Agent alone saves 20+ hours/month
- At $50/hour appraiser rate = $1,000+/month value
- Price at $299-999/month = 3-10x ROI

### Target Customer Profile

**Ideal Early Adopters**:
- Small to mid-size appraisal firms (3-15 appraisers)
- Currently using spreadsheets or outdated software
- Frustrated with manual follow-up and scheduling
- Tech-forward, willing to try AI automation

### Sales Channels

1. **Direct Outreach**: LinkedIn to appraisers, AMC contacts
2. **Content Marketing**: Blog posts on appraisal automation
3. **Industry Events**: Appraisal conferences, webinars
4. **Partnerships**: AMC integrations, appraisal associations
5. **Referral Program**: Existing customers refer peers

### Competitive Positioning

**Unique Selling Proposition**:
> "The only appraisal platform with AI that automatically handles client outreach, follow-ups, and scheduling - so you can focus on appraising."

**Competitors**:
- ACI, Alamode, Bradford: Legacy, no AI, complex
- Anow, Reggora: Modern but limited automation
- Generic CRMs: Not appraisal-specific

**Differentiation**: AI Agent + Gmail automation + Production Kanban in one platform

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Low adoption | Start with free trial, focus on quick wins |
| Support burden | Build comprehensive help docs first |
| Feature requests | Prioritize based on revenue impact |
| Security concerns | SOC 2 compliance roadmap |
| Scaling issues | Vercel/Supabase handle infrastructure |

---

## Success Metrics

**6-Month Targets**:
- 25 paying customers
- $15K MRR
- <5% monthly churn
- NPS > 40

**12-Month Targets**:
- 100 paying customers
- $75K MRR
- <3% monthly churn
- NPS > 50

---

## Next Steps

1. **Decide on MVP scope** - Full plan or phased approach?
2. **Set up Stripe account** - Product, test mode, pricing
3. **Create landing page** - Marketing site for signups
4. **Identify beta customers** - 5-10 firms for early access
5. **Begin Phase 1 development** - Tenant onboarding

---

## Appendix: Database Schema Additions

```sql
-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'business', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  users_count INT DEFAULT 0,
  orders_count INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  ai_actions INT DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  limit_value INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, feature)
);

-- Branding (add to tenants)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;

-- Support Tickets (extend cases or new table)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS is_support_ticket BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;

-- Onboarding Progress
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  steps_completed JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_tenant ON subscriptions
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY usage_tenant ON subscription_usage
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY features_tenant ON tenant_features
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY onboarding_tenant ON onboarding_progress
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
```

---

*Document generated: 2025-12-11*
*Last updated by: Claude Code*
