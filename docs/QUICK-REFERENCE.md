---
status: current
last_verified: 2025-11-30
updated_by: Claude Code
---

# Salesmod Quick Reference Guide

> **One-page cheat sheet for daily use**

---

## Your Login Credentials

- **URL:** https://your-salesmod-app.vercel.app (or http://localhost:9002 for dev)
- **Email:** rod@myroihome.com
- **Organization:** ROI Appraisal Group
- **Role:** Admin

---

## Multi-Tenant System (In 3 Sentences)

1. **Your data is in your tenant** (ROI Appraisal Group)
2. **You share data with @myroihome.com teammates** (like Dashawn)
3. **Other companies can't see your data** (automatic security)

**Bottom Line:** Use the system normally - security is automatic!

---

## Main Navigation

| Page | Purpose | Quick Action |
|------|---------|--------------|
| **Dashboard** | Overview & stats | Check daily metrics |
| **Orders** | Manage appraisals | + New Order |
| **Properties** | Property tracking | + New Property |
| **Clients** | Client management | + New Client |
| **Contacts** | People database | + New Contact |
| **Cases** | Workflow management | + New Case |
| **Agent** | AI automation | Review cards |
| **Chat** | Ask AI questions | Type your question |
| **Admin** | System settings | Manage users |

---

## Daily Workflow

### Morning (9 AM) - 30 minutes
1. ✅ Check Dashboard for overnight activity
2. ✅ Review Agent cards (approve/reject)
3. ✅ Check orders due today
4. ✅ Respond to urgent emails

### Midday (1 PM) - 15 minutes
1. ✅ Process new order requests
2. ✅ Update order statuses
3. ✅ Return client calls

### Evening (5 PM) - 15 minutes
1. ✅ Log today's activities
2. ✅ Update CRM notes
3. ✅ Approve agent overnight actions

---

## Common Tasks

### Create a New Order

1. **Orders** → **+ New Order**
2. Fill in:
   - Property address
   - Select client
   - Select contact
   - Order type
   - Due date
   - Fee amount
3. Click **Create**

### Add a Client

1. **Clients** → **+ New Client**
2. Fill in:
   - Company name
   - Client type (Lender, AMC, etc.)
   - Website domain
   - Status (Active/Prospect)
3. Click **Create**

### Add a Contact

1. **Contacts** → **+ New Contact**
2. Fill in:
   - Name
   - Email
   - Phone
   - Company (select from list)
   - Job title
3. Click **Create**

### Import Clients from CSV

1. **Clients** → **Import**
2. Click **Choose File**
3. Select your CSV file
4. Review preview
5. Click **Import**
6. ✅ Data automatically assigned to YOUR tenant

---

## AI Agent System

### What It Does
- Analyzes your goals automatically
- Prioritizes clients based on value
- Generates personalized email drafts
- Creates follow-up tasks
- Tracks what works

### Agent Page Layout

**Kanban Board Columns:**
- **Suggested** - New cards to review
- **Approved** - Waiting to execute
- **Executing** - Currently running
- **Completed** - Done successfully
- **Blocked** - Had issues

### How to Use

**1. Review Cards (Daily)**
- Click **Agent** in navigation
- Cards appear in **Suggested** column
- Click card to view details

**2. Approve or Reject**
- **Email cards:** Preview draft → Approve & Send
- **Task cards:** Review action → Approve
- **Bad suggestions:** Reject

**3. Monitor Results**
- Check **Completed** column
- Review email open rates
- Track what gets responses

### Agent Control Panel

Click **Agent Control** (right drawer):
- See current status
- View metrics
- Start manual cycle
- Pause/resume agent

---

## Chat Interface

### What You Can Ask

**Client Questions:**
- "Who are my top 5 clients this month?"
- "Show me all orders from Wells Fargo"
- "What's the status of [address]?"

**Order Questions:**
- "What orders are due this week?"
- "Show me all new orders"
- "Which orders need assignment?"

**Help with Tasks:**
- "Draft an email to [client] about [topic]"
- "Find comparables near [address]"
- "Summarize recent activity with [client]"

**Data Insights:**
- "What's my revenue this month?"
- "Show me goal progress"
- "Which clients haven't ordered recently?"

---

## Keyboard Shortcuts

### Global
- `Cmd/Ctrl + K` - Quick search
- `Cmd/Ctrl + /` - Command palette
- `Esc` - Close dialog

### Navigation (G + Key)
- `G + D` - Dashboard
- `G + O` - Orders
- `G + C` - Clients
- `G + A` - Agent

### Actions
- `N` - New (context-aware)
- `E` - Edit current item
- `S` - Save
- `/` - Search

---

## Order Status Flow

```
New → Assigned → In Progress → In Review → Completed
```

**What each means:**
- **New** - Just created, unassigned
- **Assigned** - Given to appraiser
- **In Progress** - Being worked on
- **In Review** - Quality check
- **Completed** - Delivered to client

---

## Client Types

| Type | Example | Use For |
|------|---------|---------|
| Lender | Wells Fargo, Chase | Banks, credit unions |
| AMC | ServiceLink, Clear Capital | Appraisal management |
| Attorney | Smith & Associates | Legal work |
| Individual | John Doe | Private clients |
| Government | County Assessor | Public agencies |
| Other | Varies | Miscellaneous |

---

## Contact Roles

Contacts can have different roles on different orders:

- **Borrower** - Person getting the loan
- **Lender Rep** - Bank employee
- **AMC Rep** - AMC coordinator
- **Agent** - Real estate agent
- **Attorney** - Legal rep
- **Seller/Buyer** - Transaction parties

---

## Property Types

- **SFR** - Single Family Residence
- **Condo** - Condominium
- **Townhouse** - Townhome
- **Multi-Family** - 2-4 units
- **Commercial** - Commercial building
- **Land** - Vacant land
- **Mixed Use** - Commercial + Residential

---

## Multi-Tenant Quick Facts

### What You Need to Know

✅ **Your Tenant:** ROI Appraisal Group
✅ **Your Teammates:** Anyone with @myroihome.com email
✅ **Data Sharing:** Automatic with teammates
✅ **Data Security:** Other tenants can't see your data
✅ **No Action Needed:** System handles everything

### Visual Guide

```
Your View (rod@myroihome.com):
├─ All ROI Appraisal Group data
├─ Data created by you
├─ Data created by dashawn@myroihome.com
└─ Data created by any @myroihome.com user

Other Tenant's View (testuser123@gmail.com):
├─ Only their own tenant's data
└─ CANNOT see your data ❌
```

---

## Troubleshooting

### Can't Login?
1. Check email spelling: rod@myroihome.com
2. Check password: Latter!974
3. Try "Forgot Password?" link
4. Contact support

### Not Seeing Data?
1. Check you're logged in as correct user
2. Verify you're in ROI Appraisal Group tenant
3. Check filters on the page
4. Try refreshing the page

### Agent Not Working?
1. Check Agent Control Panel status
2. Verify agent is enabled
3. Check for error messages
4. Try manual cycle: "Start Agent Cycle"

### Import Failed?
1. Check CSV format matches template
2. Verify required columns present
3. Check for duplicate emails/domains
4. Review error messages

---

## Getting Help

### In-App
- **? Icon** - Context help
- **Tooltips** - Hover over buttons
- **Chat** - Ask AI for help

### Documentation
- **User Manual** - [docs/USER-MANUAL.md](./USER-MANUAL.md)
- **Feature Guides** - [docs/features/](./features/)
- **Full Docs** - [docs/index.md](./index.md)

### Support
- **Email:** support@salesmod.com
- **Live Chat:** Bottom right corner
- **Knowledge Base:** help.salesmod.com

---

## Pro Tips

### Data Entry
1. ✅ Be consistent with naming
2. ✅ Add notes and context
3. ✅ Use categories and tags
4. ✅ Update statuses regularly

### Agent Usage
1. ✅ Review cards daily
2. ✅ Approve good suggestions quickly
3. ✅ Reject poor ones to teach agent
4. ✅ Monitor performance metrics

### Communication
1. ✅ Log all phone calls
2. ✅ Document promises made
3. ✅ Set clear expectations
4. ✅ Follow up consistently

### Organization
1. ✅ Use cases for complex work
2. ✅ Archive old orders
3. ✅ Clean contact list monthly
4. ✅ Review goals weekly

---

## Key Numbers to Watch

### Dashboard Metrics
- **Active Orders** - Current workload
- **This Month's Revenue** - Financial health
- **Goal Progress** - On track?
- **Agent Success Rate** - AI effectiveness

### Client Health
- **Days Since Last Order** - Re-engage if >90
- **Total Orders** - Relationship depth
- **Average Fee** - Client value
- **Payment History** - Reliability

### Agent Performance
- **Approval Rate** - Should be >70%
- **Email Open Rate** - Should be >30%
- **Response Rate** - Should be >10%
- **Cards Created/Day** - Should be 3-7

---

## Security Reminders

✅ **Your data is protected** - Multi-tenant isolation
✅ **Share freely with team** - @myroihome.com users
✅ **Log out on shared computers** - Security best practice
✅ **Use strong password** - Current: Latter!974
✅ **Report suspicious activity** - Contact admin immediately

---

## What's Next?

### Getting Started
1. ✅ Log in with your credentials
2. ✅ Explore the dashboard
3. ✅ Create your first client
4. ✅ Set up your first order
5. ✅ Review agent suggestions

### This Week
1. ✅ Import your existing clients
2. ✅ Configure your goals
3. ✅ Set up email templates
4. ✅ Invite team members
5. ✅ Review agent performance

### This Month
1. ✅ Optimize agent settings
2. ✅ Build workflow automation
3. ✅ Train team on features
4. ✅ Analyze performance metrics
5. ✅ Plan scaling strategy

---

**Remember:** The system is designed to work FOR you. Start simple, then explore advanced features as you get comfortable!

---

**Need More Details?** See the [complete User Manual](./USER-MANUAL.md)

**Last Updated:** 2025-11-30
**Version:** 1.0
