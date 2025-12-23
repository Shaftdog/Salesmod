---
status: current
last_verified: 2025-12-23
updated_by: Claude Code
---

# Agent System Go-Live Runbook

Step-by-step operational guide for deploying the autonomous agent system to production.

---

## Prerequisites

Before starting, ensure:
- [ ] All database migrations applied (P0, P1, P2)
- [ ] TypeScript builds clean (`npm run build`)
- [ ] Unit tests passing (`npm test`)
- [ ] Access to Vercel project settings
- [ ] Access to Google Cloud Console
- [ ] Access to Resend dashboard (or your email provider)
- [ ] DNS access for your sending domain

---

## Part 1: Gmail OAuth Setup

### Step 1.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing one
3. Note the **Project ID** for later

### Step 1.2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Select **External** user type (or Internal if G Suite)
3. Fill in required fields:
   - App name: `Salesmod Agent`
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   ```
5. Add test users (your email addresses for testing)
6. Submit for verification if going to production

### Step 1.3: Create OAuth Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Name: `Salesmod Production`
5. Authorized redirect URIs:
   ```
   https://your-domain.com/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   ```
6. Click **Create**
7. Download the JSON or copy:
   - **Client ID**: `GOOGLE_CLIENT_ID`
   - **Client Secret**: `GOOGLE_CLIENT_SECRET`

### Step 1.4: Set Environment Variables in Vercel

```bash
# In Vercel project settings > Environment Variables
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Step 1.5: Connect First Tenant Inbox

1. Log into Salesmod as tenant admin
2. Navigate to **Settings > Integrations > Gmail**
3. Click **Connect Gmail**
4. Complete OAuth flow with test account
5. Verify connection status shows "Connected"

### Step 1.6: Verify Gmail Ingest

```sql
-- Check gmail_tokens table for connected tenant
SELECT tenant_id, email, created_at, expires_at
FROM gmail_tokens
WHERE tenant_id = 'your-test-tenant-id';

-- After sending test email to connected account, verify it's ingested
SELECT id, subject, from_email, created_at
FROM gmail_messages
WHERE tenant_id = 'your-test-tenant-id'
ORDER BY created_at DESC
LIMIT 5;

-- Verify no cross-tenant leakage
SELECT DISTINCT tenant_id FROM gmail_messages;
```

**Gmail OAuth Complete Checklist:**
- [ ] OAuth consent screen approved (or in test mode)
- [ ] Credentials created and stored in Vercel
- [ ] At least 1 tenant inbox connected
- [ ] Test email ingested and visible in database
- [ ] No cross-tenant data leakage

---

## Part 2: Resend Domain Verification (DKIM/SPF/DMARC)

### Step 2.1: Create Resend Account

1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Set environment variable:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

### Step 2.2: Add Sending Domain

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your sending domain (e.g., `mail.yourdomain.com`)
4. Resend will provide DNS records

### Step 2.3: Configure DNS Records

Add these records to your DNS provider:

**SPF Record** (TXT):
```
Name: mail (or your subdomain)
Type: TXT
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Record** (TXT):
```
Name: resend._domainkey.mail (Resend provides exact name)
Type: TXT
Value: (Resend provides this value)
```

**DMARC Record** (TXT):
```
Name: _dmarc.mail
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

### Step 2.4: Verify Domain in Resend

1. After DNS propagation (5-60 minutes), click **Verify** in Resend
2. All three checks should show green:
   - SPF: Verified
   - DKIM: Verified
   - DMARC: Verified

### Step 2.5: Test Email Sending

```bash
# Test via curl
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@mail.yourdomain.com",
    "to": "your-email@example.com",
    "subject": "Test from Resend",
    "text": "This is a test email."
  }'
```

Verify:
- [ ] Email received in inbox (not spam)
- [ ] From address shows your domain
- [ ] Email headers show DKIM pass

**Resend Setup Complete Checklist:**
- [ ] Resend API key in environment variables
- [ ] Domain added and verified
- [ ] SPF record configured
- [ ] DKIM record configured
- [ ] DMARC record configured
- [ ] Test email sent and received (not in spam)

---

## Part 3: Email Rollout Ladder

### Environment Variable Reference

| Variable | Values | Description |
|----------|--------|-------------|
| `EMAIL_SEND_MODE` | `dry_run`, `internal_only`, `limited_live`, `production` | Controls email sending behavior |
| `EMAIL_SEND_DISABLED` | `true`, `false` | Global kill switch for all email |
| `EMAIL_INTERNAL_DOMAINS` | comma-separated | Allowed domains in `internal_only` mode |
| `EMAIL_INTERNAL_ADDRESSES` | comma-separated | Specific allowed emails |

### Step 3.1: Start in Dry-Run Mode

```bash
# Vercel Environment Variables
EMAIL_SEND_MODE=dry_run
EMAIL_SEND_DISABLED=false
```

**Dry-run behavior:**
- Emails are NOT sent
- Full logging of what WOULD be sent
- Rate limits still enforced
- Alerts still fire

**Verification:**
```sql
-- Check email attempts are logged
SELECT * FROM agent_rate_limits
WHERE action_type = 'email'
AND tenant_id = 'your-test-tenant-id';

-- No actual sends should appear
SELECT * FROM email_sends WHERE tenant_id = 'your-test-tenant-id';
```

Run for: **24-48 hours** to verify volume patterns.

### Step 3.2: Progress to Internal-Only Mode

```bash
EMAIL_SEND_MODE=internal_only
EMAIL_INTERNAL_DOMAINS=yourdomain.com,yourcompany.com
EMAIL_INTERNAL_ADDRESSES=test@external.com
```

**Internal-only behavior:**
- Emails ONLY sent to whitelisted domains/addresses
- All other recipients blocked (logged)
- Useful for testing with real sends

**Verification:**
1. Trigger agent to send email to internal address
2. Verify email received
3. Trigger agent to send to external address
4. Verify it was blocked (check logs)

```sql
-- Check internal emails were sent
SELECT to_email, status, created_at
FROM email_sends
WHERE tenant_id = 'your-test-tenant-id'
ORDER BY created_at DESC;

-- Check blocked sends
SELECT * FROM agent_policy_violations
WHERE tenant_id = 'your-test-tenant-id'
AND violation_type = 'email_blocked_internal_only';
```

Run for: **1-2 weeks** with internal testing.

### Step 3.3: Progress to Limited-Live Mode

```bash
EMAIL_SEND_MODE=limited_live
```

**Limited-live behavior:**
- Emails sent to ALL recipients
- Strict per-tenant rate limits enforced:
  - `max_emails_per_hour`: 20 (default)
  - `max_emails_per_day`: 100 (default)
- Enhanced monitoring and alerting

**Pre-flight checks:**
```sql
-- Verify rate limits are configured
SELECT tenant_id,
       agent_settings->>'max_emails_per_hour' as emails_per_hour,
       agent_settings->>'max_emails_per_day' as emails_per_day
FROM tenants
WHERE agent_enabled = true;

-- Verify alerting is working
SELECT * FROM agent_alerts
ORDER BY created_at DESC
LIMIT 10;
```

**Monitoring during limited-live:**
- Watch `/api/admin/agent/health` endpoint
- Monitor `agent_alerts` table for spikes
- Check `email_provider_failures` table
- Review `agent_hourly_reflections` for issues

Run for: **2-4 weeks** with close monitoring.

### Step 3.4: Graduate to Production Mode

```bash
EMAIL_SEND_MODE=production
```

**Production behavior:**
- Full email sending capability
- Standard rate limits (can be increased per-tenant)
- Full alerting and monitoring

**Graduation criteria:**
- [ ] 14+ days in limited-live without incidents
- [ ] No unusual volume spikes
- [ ] No provider failures or quota issues
- [ ] Bounce rate < 5%
- [ ] Spam complaint rate < 0.1%

---

## Part 4: Final Go-Live Checklist

### Environment Variables

```bash
# Required for production
CRON_SECRET=<your-cron-secret>
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
RESEND_API_KEY=<resend-api-key>
EMAIL_SEND_MODE=limited_live  # Start here, graduate to production

# Optional but recommended
EMAIL_INTERNAL_DOMAINS=yourdomain.com
AGENT_KILL_SWITCH=false
```

### Database Verification

```sql
-- All P0/P1/P2 tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'agent_%'
ORDER BY table_name;

-- System config has global_enabled
SELECT * FROM system_config WHERE key = 'agent_config';

-- At least one tenant is enabled
SELECT id, name, agent_enabled FROM tenants WHERE agent_enabled = true;
```

### Operational Readiness

- [ ] Gmail OAuth configured and 1+ inbox connected
- [ ] Resend domain verified (SPF/DKIM/DMARC)
- [ ] Email rollout in `limited_live` mode
- [ ] Cron jobs enabled in Vercel
- [ ] Monitoring dashboard set up
- [ ] Alert destinations configured
- [ ] Kill switch tested (can disable globally)
- [ ] On-call rotation established

### First Autonomous Cycle

1. Enable agent for test tenant:
   ```sql
   UPDATE tenants SET agent_enabled = true WHERE id = 'test-tenant-id';
   ```

2. Wait for next hourly cron (or trigger manually):
   ```bash
   curl -X POST https://your-domain.com/api/cron/agent \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

3. Verify cycle completed:
   ```sql
   SELECT * FROM agent_autonomous_runs
   WHERE tenant_id = 'test-tenant-id'
   ORDER BY started_at DESC LIMIT 1;
   ```

4. Check reflection:
   ```sql
   SELECT * FROM agent_hourly_reflections
   WHERE tenant_id = 'test-tenant-id'
   ORDER BY created_at DESC LIMIT 1;
   ```

---

## Rollback Procedures

### Emergency Kill Switch

```bash
# Via environment variable (requires redeploy)
AGENT_KILL_SWITCH=true
AGENT_KILL_SWITCH_REASON="Emergency stop - investigating issue"

# Via database (immediate effect)
UPDATE system_config
SET value = jsonb_set(value, '{global_enabled}', 'false')
WHERE key = 'agent_config';

# Via API (requires super_admin)
curl -X POST https://your-domain.com/api/admin/agent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "disable_global", "reason": "Emergency stop"}'
```

### Disable Single Tenant

```sql
UPDATE tenants SET agent_enabled = false WHERE id = 'problematic-tenant-id';
```

### Stop Email Sending Only

```bash
EMAIL_SEND_DISABLED=true
# or
EMAIL_SEND_MODE=dry_run
```

---

## Troubleshooting

### Gmail OAuth Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Access blocked" | App not verified | Add test users or verify app |
| "Token expired" | Refresh token invalid | User must re-authorize |
| "Insufficient scopes" | Missing permissions | Update OAuth consent screen |

### Email Sending Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Emails in spam | DKIM/SPF misconfigured | Verify DNS records |
| Rate limit errors | Resend quota hit | Upgrade plan or throttle |
| "Sender not verified" | Domain not verified | Complete Resend verification |

### Agent Cycle Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Cycle not running | Cron not configured | Check vercel.json crons |
| Lock contention | Previous cycle hung | Clean up stale locks |
| Rate limit exceeded | Too many actions | Increase limits or debug |

---

## Support Contacts

- Resend Support: support@resend.com
- Google Cloud Support: cloud.google.com/support
- Internal On-Call: [your-oncall-system]
