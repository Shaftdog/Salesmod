---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# 📧 Email Setup Guide - Resend Integration

## ✅ What's Already Done

- ✅ Environment file prepared with placeholders
- ✅ Email API routes updated to use Resend
- ✅ Fallback to simulation if no API key
- ✅ Anthropic API key enabled (needed for agent)
- ✅ Dev server restarted

## 🚀 Complete Resend Setup (5 minutes)

### Step 1: Sign Up for Resend

**I've opened the signup page for you in the browser** (https://resend.com/signup)

1. Choose your signup method:
   - **Recommended:** Click "Login with GitHub"
   - **Or:** Enter email and password

2. Verify your email (check inbox)

3. Complete the onboarding questionnaire

---

### Step 2: Add Your Domain (or Use Test Domain)

**Option A: Use Your Domain (myroihome.com)**

1. In Resend dashboard, click **"Domains"**
2. Click **"Add Domain"**
3. Enter: `myroihome.com`
4. Add the DNS records they provide to your domain:
   - Go to your DNS provider (GoDaddy, Cloudflare, etc.)
   - Add the TXT records for SPF, DKIM
   - Wait 5-10 minutes
   - Click "Verify" in Resend

**Option B: Use Resend Test Domain (Instant!)**

1. Resend gives you a free test domain: `something.resend.dev`
2. No verification needed - works immediately
3. Perfect for testing
4. You can add your real domain later

---

### Step 3: Create API Key

1. In Resend dashboard, click **"API Keys"** in left sidebar
2. Click **"Create API Key"**
3. Name: "Sales Module - Account Manager Agent"
4. Permissions: **"Sending access"** (or "Full access")
5. Click **"Add"**
6. **COPY THE KEY** (starts with `re_` - you'll only see it once!)

---

### Step 4: Add API Key to Your Environment

Open `.env.local` in your editor and replace this line:

```bash
RESEND_API_KEY=re_YOUR_API_KEY_HERE
```

With your actual key:

```bash
RESEND_API_KEY=re_abc123xyz...
```

Save the file.

---

### Step 5: Restart Dev Server

```bash
# Kill the current server
pkill -f "next dev"

# Start fresh (already done for you!)
npm run dev
```

---

### Step 6: Configure Webhook (Optional but Recommended)

In Resend dashboard:

1. Click **"Webhooks"** in left sidebar
2. Click **"Add Endpoint"**
3. Enter URL:
   - **Development:** `https://your-ngrok-url.ngrok.io/api/email/webhook`
   - **Production:** `https://yourdomain.com/api/email/webhook`
4. Subscribe to events:
   - ✅ `email.delivered`
   - ✅ `email.opened`
   - ✅ `email.clicked`
   - ✅ `email.bounced`
   - ✅ `email.complained`
5. Click **"Add Endpoint"**

**Note:** For development, you'll need ngrok or similar to expose localhost. Not required for initial testing!

---

## 🧪 Test Email Sending

### Quick Test via API

```bash
# Get your auth token from browser DevTools (Application > Local Storage > sb-access-token)
TOKEN="your-supabase-jwt"

curl -X POST http://localhost:9002/api/email/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test from Account Manager Agent",
    "html": "<p>This is a test email from your AI agent! 🤖</p><p>If you received this, Resend is working perfectly.</p>"
  }'
```

Expected response:
```json
{
  "success": true,
  "messageId": "abc123...",
  "simulated": false
}
```

Check your inbox!

---

## 🎯 Test via Agent

Now the fun part:

1. Go to http://localhost:9002/agent
2. Click "Start Agent Cycle"
3. Wait for cards to be created (~30-60 seconds)
4. Click on an email card
5. Review the draft
6. Click **"Approve & Send"**
7. **Check your inbox!** You should receive the email

---

## 📊 Verify Email Was Sent

Check Resend dashboard:
- Click **"Emails"** to see sent emails
- Click **"Logs"** to see delivery status
- View opens/clicks if webhook is configured

Check your app:
- Go to `/clients` and click a client
- See the email activity in the timeline
- Check activities table in Supabase

---

## 🔧 Troubleshooting

### "Email send failed: 401 Unauthorized"
- ✅ Check API key is correct in `.env.local`
- ✅ Restart dev server to load new env vars
- ✅ Verify key starts with `re_`

### "Domain not verified"
- ✅ Use Resend's test domain (*.resend.dev) for now
- ✅ Or wait for DNS propagation (5-30 minutes)
- ✅ Check DNS records in your provider

### "Email sending but not receiving"
- ✅ Check spam folder
- ✅ Verify email address is correct
- ✅ Check Resend dashboard logs
- ✅ Ensure domain is verified

### "Still simulating emails"
- ✅ Verify RESEND_API_KEY is set (not placeholder)
- ✅ Restart dev server
- ✅ Check response has `"simulated": false`

---

## 📝 What's Configured

### Email Sending Flow

```
User approves card
       ↓
/api/agent/execute-card
       ↓
/api/email/send
       ↓
Check suppressions ✓
       ↓
Check daily limit ✓
       ↓
Send via Resend API
       ↓
Log activity ✓
       ↓
Update card to 'done' ✓
```

### Safety Features Active

- ✅ Email suppression checking
- ✅ Daily send limit (50 emails)
- ✅ Contact cooldown (5 days)
- ✅ Quiet hours (10pm-8am)
- ✅ Review mode (requires approval)
- ✅ Activity logging
- ✅ Error tracking

---

## 🎉 What You Get

With Resend configured:

- ✅ Real email sending (not simulated)
- ✅ Professional "from" address: `manager@myroihome.com`
- ✅ Delivery tracking
- ✅ Open/click tracking (with webhook)
- ✅ Bounce handling
- ✅ Complaint handling
- ✅ Email analytics

---

## 💰 Resend Pricing

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- Perfect for testing!

**Paid Plans:**
- $20/month: 50,000 emails
- $80/month: 300,000 emails
- Custom pricing for high volume

For your use case (50 emails/day max in agent settings), the **free tier** is plenty for initial testing!

---

## 📋 Quick Checklist

- [ ] Sign up for Resend
- [ ] Add domain OR use test domain
- [ ] Create API key
- [ ] Add key to `.env.local`
- [ ] Restart dev server (done!)
- [ ] Test via /api/email/send endpoint
- [ ] Test via agent (approve a card)
- [ ] Verify email received
- [ ] (Optional) Configure webhook for tracking

---

## 🎊 Next Steps

Once Resend is configured:

1. **Test the agent end-to-end**
   - Trigger agent run
   - Review email drafts
   - Approve and send
   - Verify delivery

2. **Monitor performance**
   - Check Resend dashboard
   - View agent stats
   - Review sent emails

3. **Deploy to production**
   - Update NEXT_PUBLIC_URL to production domain
   - Add Resend API key to Vercel environment variables
   - Configure production webhook

---

**Ready?** Complete Steps 1-3 above, then test your first real AI-generated email! 🚀

