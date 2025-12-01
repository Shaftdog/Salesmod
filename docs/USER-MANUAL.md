---
status: current
last_verified: 2025-11-30
updated_by: Claude Code
---

# Salesmod User Manual

> **Complete guide to using the Salesmod appraisal management system**

Welcome to Salesmod! This manual will walk you through everything you need to know to effectively use the system for managing your appraisal business.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Multi-Tenant System](#understanding-multi-tenant-system)
3. [Dashboard Overview](#dashboard-overview)
4. [Core Features](#core-features)
5. [AI Agent System](#ai-agent-system)
6. [Daily Workflows](#daily-workflows)
7. [Advanced Features](#advanced-features)
8. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Login

1. Navigate to your Salesmod instance (e.g., `https://your-app.vercel.app`)
2. Enter your email and password
3. You'll be redirected to the Dashboard

### Your Account

- **Email:** rod@myroihome.com
- **Organization:** ROI Appraisal Group
- **Role:** Admin
- **Tenant Type:** Internal

As an admin, you have full access to all features including:
- Managing clients and contacts
- Creating and assigning orders
- Configuring AI agents
- Accessing admin panel
- Managing team members

---

## Understanding Multi-Tenant System

Salesmod uses a **multi-tenant architecture** which is a fancy way of saying: **your data is completely separate from everyone else's data.**

### What is Multi-Tenancy?

Think of it like an apartment building:
- **The building** = Salesmod application
- **Each apartment** = A separate organization (tenant)
- **People in apartment** = Users in that organization
- **Furniture in apartment** = Data (clients, orders, properties)

**Key Rules:**
1. ✅ You can only see data in YOUR apartment (tenant)
2. ✅ People in YOUR apartment can share the same data
3. ❌ You CANNOT see data in other apartments (other tenants)
4. ❌ Other tenants CANNOT see your data

### Your Tenant: ROI Appraisal Group

**Your Organization:**
- **Tenant Name:** ROI Appraisal Group
- **Tenant Type:** Internal (your company)
- **Tenant ID:** `8df02ee5-5e0b-40e1-aa25-6a8ed9a461de`

**Who Can See Your Data:**
- ✅ **rod@myroihome.com** (you)
- ✅ **dashawn@myroihome.com** (your coworker)
- ✅ **Any @myroihome.com user** (your team)

**Who CANNOT See Your Data:**
- ❌ **testuser123@gmail.com** (external test user - different tenant)
- ❌ **Any user from other companies** (different tenants)
- ❌ **External clients** (they have their own separate tenants)

### How It Works (Simple Explanation)

Every piece of data in the system has an invisible "tenant ID" tag:

```
Client: ABC Mortgage Company
Tenant ID: 8df02ee5-5e0b-40e1-aa25-6a8ed9a461de (ROI Appraisal Group)
↓
Only visible to users with matching tenant ID
```

When you log in:
1. System checks: "Who is this user?" → rod@myroihome.com
2. System checks: "What's their tenant ID?" → ROI Appraisal Group
3. System shows: "Only data with matching tenant ID"

### Real-World Example

Let's say you create a new client called "First National Bank":

**What you see:**
```
Clients List:
✅ First National Bank (created by you)
✅ Wells Fargo (created by Dashawn)
✅ Chase (created by another @myroihome.com user)
```

**What testuser123@gmail.com sees:**
```
Clients List:
❌ (Cannot see ANY of your clients)
✅ Only their own tenant's clients
```

### Team Collaboration Within Your Tenant

Because you and your coworkers (like Dashawn) are in the **same tenant**, you share everything:

**Shared Data:**
- All clients you create
- All orders anyone creates
- All properties in the system
- All contacts and notes
- All agent cards and tasks

**Benefits:**
- No duplicate entry
- See what everyone is working on
- Collaborate seamlessly
- One source of truth

### Security Features

The system enforces tenant isolation at the **database level** using Row Level Security (RLS):

**What this means for you:**
1. **You can't accidentally see other tenant's data** - Even if you tried, the database blocks it
2. **Other tenants can't see your data** - Automatically protected
3. **No manual filtering needed** - System handles it automatically
4. **Works everywhere** - Dashboard, API, reports, exports, everything

**Real-World Scenario:**

❌ **Before Multi-Tenant:**
- Rod could potentially see all clients from all companies
- Risk of data leaks
- Privacy concerns
- Compliance issues

✅ **After Multi-Tenant:**
- Rod only sees ROI Appraisal Group clients
- Guaranteed data isolation
- Privacy protected
- Compliance friendly

### External Tenants (Future)

In the future, you might give clients their own login:

**Example: ABC Mortgage wants to track their orders**

1. Create tenant: "ABC Mortgage"
2. Create user: jane@abcmortgage.com
3. Assign Jane to ABC Mortgage tenant
4. Jane logs in and only sees:
   - Orders they've placed with you
   - Properties they're financing
   - Their contacts only

**They CANNOT see:**
- Your other clients
- Orders from other lenders
- Your internal data

### Tenant Types

Currently two main types:

**1. Internal Tenant (You)**
- **Type:** `internal`
- **Example:** ROI Appraisal Group
- **Users:** All @myroihome.com addresses
- **Purpose:** Your company's operations
- **Data:** Everything you create

**2. External Tenants (Future)**
- **Type:** `lender`, `amc`, `builder`, etc.
- **Example:** "Wells Fargo", "SourceAM"
- **Users:** Their employees only
- **Purpose:** Client portal access
- **Data:** Only their orders with you

### What You Need to Know

**As a daily user, you don't need to think about multi-tenancy. Here's why:**

1. **Automatic** - System handles it behind the scenes
2. **Transparent** - Just use the system normally
3. **Secure** - Your data is protected automatically
4. **Collaborative** - Share freely with @myroihome.com teammates

**The only time it matters:**

- ✅ **CSV Imports** - Your imports automatically get your tenant ID
- ✅ **Creating Clients** - Automatically assigned to your tenant
- ✅ **Team Access** - New @myroihome.com users see your data
- ✅ **Reports/Exports** - Only include your tenant's data

### Common Questions

**Q: Can I share data with another tenant?**
A: Not currently. Each tenant is completely isolated. If you need to collaborate, add them as a user to your tenant.

**Q: What if I leave ROI Appraisal Group?**
A: Your tenant assignment would be changed. You'd lose access to ROI data and gain access to your new tenant's data.

**Q: Can I be in multiple tenants?**
A: Not currently. Each user belongs to exactly one tenant.

**Q: How do I know which tenant I'm in?**
A: Check your profile page - shows "Organization: ROI Appraisal Group"

**Q: Can admins see all tenants?**
A: No. Even admins are restricted to their own tenant. Only special "super admin" accounts (rarely used) can cross tenants.

**Q: What if I accidentally create something in the wrong tenant?**
A: Impossible! You can only create data in your own tenant. The system enforces this automatically.

### Summary

**For You (Rod @ ROI Appraisal Group):**

✅ **You see:** All ROI Appraisal Group data
✅ **You share with:** dashawn@myroihome.com and other @myroihome.com users
✅ **You're protected from:** Seeing other companies' data
✅ **Other companies are protected from:** Seeing your data
✅ **System handles:** All security automatically
✅ **You focus on:** Your job - system handles the rest

**Bottom Line:** Multi-tenancy means **your data stays private** while allowing **your team to collaborate** - all handled automatically by the system!

---

## Dashboard Overview

The Dashboard is your command center. Here's what you'll see:

### Top Navigation Bar

- **Dashboard** - Main overview page
- **Orders** - Appraisal order management
- **Properties** - Property tracking
- **Clients** - Client management
- **Contacts** - Contact database
- **Cases** - Case workflow management
- **Agent** - AI agent control panel
- **Chat** - Conversational AI interface
- **Admin** - System administration (admins only)

### Dashboard Widgets

1. **Quick Stats**
   - Active orders count
   - Pending cases
   - This month's revenue
   - Goal progress

2. **Recent Activity**
   - Latest order updates
   - New client interactions
   - Agent actions
   - System notifications

3. **Upcoming Tasks**
   - Follow-ups due today
   - Orders requiring attention
   - Pending approvals

4. **Goal Tracking**
   - Monthly targets
   - Progress bars
   - Trending indicators

---

## Core Features

### 1. Order Management

**Purpose:** Track appraisal orders from initial request to completion.

#### Creating an Order

1. Click **Orders** in the navigation
2. Click **+ New Order**
3. Fill in the required fields:
   - **Property Address** - The subject property
   - **Client** - Select from dropdown or create new
   - **Contact** - Primary contact for this order
   - **Order Type** - Type of appraisal
   - **Due Date** - Completion deadline
   - **Fee** - Appraisal fee amount
4. Click **Create Order**

#### Managing Orders

**Order States:**
- 🔵 **New** - Just created, not assigned
- 🟡 **Assigned** - Assigned to appraiser
- 🟢 **In Progress** - Actively being worked
- 🟣 **In Review** - Under quality review
- ✅ **Completed** - Delivered to client
- ❌ **Cancelled** - Order cancelled

**Common Actions:**
- **Assign** - Assign to an appraiser
- **Update Status** - Move to next stage
- **Add Notes** - Document conversations
- **Upload Files** - Attach documents
- **Send Update** - Email client with status

#### Order Details Page

Click any order to see:
- Full property details
- Client and contact information
- Activity timeline
- Attached documents
- Related comparables
- Communication history

### 2. Client Management

**Purpose:** Manage client companies and their relationships.

#### Adding a Client

1. Navigate to **Clients**
2. Click **+ New Client**
3. Enter details:
   - **Company Name** - Official business name
   - **Client Type** - Lender, AMC, Attorney, etc.
   - **Domain** - Company website domain
   - **Industry** - Business category
   - **Status** - Active, Inactive, Prospect
4. Click **Create**

#### Client Types

- **Lender** - Banks, credit unions, mortgage companies
- **AMC** - Appraisal Management Companies
- **Attorney** - Law firms
- **Individual** - Private individuals
- **Government** - Government agencies
- **Other** - Miscellaneous

#### Client Details

Each client page shows:
- **Overview** - Key information and stats
- **Contacts** - People who work for this client
- **Orders** - All orders from this client
- **Activity** - Interaction history
- **Notes** - Internal notes and comments
- **Documents** - Shared files

#### Client Ranking

The system automatically ranks clients based on:
- Order volume
- Revenue generated
- Payment history
- Relationship age
- Recent activity

**Ranking Tiers:**
- 🌟 **Platinum** - Top 10% of clients
- 🥇 **Gold** - Top 25%
- 🥈 **Silver** - Top 50%
- 🥉 **Bronze** - Active clients
- ⚪ **Inactive** - No recent orders

### 3. Contact Management

**Purpose:** Track individual people and their roles.

#### Adding a Contact

1. Go to **Contacts**
2. Click **+ New Contact**
3. Fill in:
   - **Name** - First and last name
   - **Email** - Email address
   - **Phone** - Phone number
   - **Title** - Job title
   - **Company** - Associate with a client
   - **Role** - Contact role (see below)
4. Click **Create**

#### Contact Roles (Party Roles)

Contacts can have multiple roles across different orders:

- **Borrower** - Person requesting the loan
- **Lender Rep** - Bank representative
- **AMC Rep** - AMC coordinator
- **Attorney** - Legal representative
- **Agent** - Real estate agent
- **Seller** - Property seller
- **Buyer** - Property buyer
- **Other Party** - Other involved party

#### Contact Details

- **Profile** - Personal information
- **Related Orders** - Orders they're involved in
- **Activity Log** - All interactions
- **Email History** - Sent and received emails
- **Notes** - Private notes about contact

### 4. Property Management

**Purpose:** Track properties and their units.

#### Adding a Property

1. Navigate to **Properties**
2. Click **+ New Property**
3. Enter:
   - **Address** - Street address
   - **City, State, ZIP** - Location details
   - **Property Type** - SFR, Condo, Multi-family, etc.
   - **Year Built** - Construction year
   - **Square Footage** - Living area
   - **Bedrooms/Bathrooms** - Counts
4. Click **Create**

#### Property Types

- **SFR** - Single Family Residence
- **Condo** - Condominium
- **Townhouse** - Townhome
- **Multi-Family** - 2-4 units
- **Commercial** - Commercial property
- **Land** - Vacant land
- **Mixed Use** - Commercial + Residential

#### Multi-Unit Properties

For multi-family properties:
1. Create the property first
2. Click **Add Unit**
3. Enter unit-specific details:
   - Unit number
   - Bedrooms/bathrooms
   - Square footage
   - Rent amount
   - Occupancy status

#### Property History

Track:
- Previous appraisals
- Sales history
- Related comparables
- Market trends
- Value changes over time

### 5. Case Management

**Purpose:** Structured workflow for complex appraisal cases.

#### Creating a Case

1. Go to **Cases**
2. Click **+ New Case**
3. Set up:
   - **Case Name** - Descriptive title
   - **Case Type** - Standard, Complex, Litigation, etc.
   - **Priority** - Low, Medium, High, Urgent
   - **Assigned To** - Team member responsible
   - **Due Date** - Completion deadline
4. Click **Create**

#### Case Stages

Cases move through these stages:

1. **Intake** - Initial information gathering
2. **Assignment** - Assign to appraiser
3. **Inspection** - Schedule and complete inspection
4. **Research** - Market research and comps
5. **Analysis** - Value analysis and reconciliation
6. **Report Writing** - Draft appraisal report
7. **Review** - Quality control review
8. **Delivery** - Send to client
9. **Complete** - Case closed

#### Case Checklist

Each stage has a checklist of required tasks:
- ✅ Completed tasks
- 🔲 Pending tasks
- ⚠️ Blocked tasks

#### Case Timeline

View chronological history of:
- Status changes
- Task completions
- Communications
- Document uploads
- Team member actions

---

## AI Agent System

**Purpose:** Automated workflow orchestration and intelligent task management.

The AI Agent System is one of Salesmod's most powerful features. It works 24/7 to help you grow your business.

### What the Agent Does

The agent automatically:

1. **Analyzes your goals** - Understands what you're trying to achieve
2. **Prioritizes clients** - Identifies who to focus on
3. **Plans actions** - Creates strategic outreach plans
4. **Generates emails** - Writes personalized drafts
5. **Schedules follow-ups** - Ensures no client falls through the cracks
6. **Tracks outcomes** - Monitors what works and what doesn't

### Agent Page

Navigate to **Agent** to see:

- **Kanban Board** - Visual workflow of agent-created tasks
- **Agent Control Panel** - Start/stop agent and view status
- **Performance Metrics** - Stats and success rates
- **Recent Activity** - What the agent has done recently

### Kanban Board

The board has these columns:

- **Suggested** - Agent-proposed actions awaiting your review
- **In Review** - Actions you're currently reviewing
- **Approved** - Actions approved but not yet executed
- **Executing** - Currently running actions
- **Completed** - Successfully finished actions
- **Blocked** - Actions that encountered issues

### Card Types

**Email Cards** - Send an email to a contact
- Shows preview of email draft
- Includes personalization
- Click to review and approve

**Task Cards** - Create a follow-up task
- Assigns to team member
- Sets due date
- Appears in task list

**Deal Cards** - Create a sales opportunity
- Tracks potential revenue
- Appears in deals pipeline
- Monitors progress

### Agent Workflow

#### Step 1: Agent Runs Automatically

Every 2 hours (configurable), the agent:
1. Checks your goals and current progress
2. Analyzes client data and history
3. Calculates "goal pressure" (how urgent is it to act?)
4. Generates 3-7 recommended actions
5. Creates cards on the Kanban board

#### Step 2: You Review Cards

1. Cards appear in **Suggested** column
2. Click a card to review details
3. For email cards:
   - Read the draft
   - See why agent chose this action
   - Check personalization details
4. For task/deal cards:
   - Review proposed action
   - See reasoning and context

#### Step 3: You Approve or Reject

**To Approve:**
- Click **Approve** button
- Card moves to **Approved** column
- Will execute on next agent cycle

**To Reject:**
- Click **Reject** button
- Card is archived
- Agent learns from your feedback

**To Edit (coming soon):**
- Modify the email draft
- Adjust timing or recipient
- Save changes and approve

#### Step 4: Agent Executes

On the next cycle, approved cards:
- Execute automatically
- Send emails via Resend
- Create tasks in system
- Update CRM records
- Move to **Completed** or **Blocked**

### Agent Control Panel

Click the **Agent Control** button (right drawer) to access:

**Status Section:**
- Current state: Idle, Working, Error
- Last run time
- Next scheduled run
- Cards created today

**Metrics:**
- Goal pressure (0-100%)
- Cards pending approval
- Emails sent today
- Success rate

**Controls:**
- **Start Agent Cycle** - Trigger manual run
- **Pause Agent** - Temporarily disable
- **Resume Agent** - Re-enable after pause
- **View Settings** - Configure behavior

### Agent Settings

Configure agent behavior:

**Send Limits:**
- Daily email limit (default: 50)
- Hourly rate limit (default: 10)
- Cooldown period (default: 5 days between same contact)

**Review Mode:**
- **On** - All actions require approval (recommended)
- **Off** - Agent executes automatically (use with caution)

**Priority Rules:**
- High-value clients get priority
- Recent inquiries prioritized
- Cold leads contacted less frequently

**Email Suppressions:**
Automatically prevents sending to:
- Bounced emails
- Spam complaints
- Unsubscribed contacts
- Suppressed domains

### Best Practices

1. **Start with Review Mode On**
   - Monitor agent for 2-4 weeks
   - Build trust in its decisions
   - Train yourself on patterns

2. **Review Cards Daily**
   - Morning: Check overnight cards
   - Midday: Approve high-priority
   - Evening: Clear backlog

3. **Provide Feedback**
   - Approve good suggestions quickly
   - Reject poor ones with notes
   - Agent learns your preferences

4. **Monitor Performance**
   - Track approval rate
   - Watch email open rates
   - Adjust settings based on results

5. **Keep Data Clean**
   - Ensure contacts have valid emails
   - Log all client interactions
   - Update client statuses regularly

---

## Daily Workflows

Here's how to use Salesmod throughout your day:

### Morning Routine (30 minutes)

**1. Check Dashboard (5 min)**
- Review overnight notifications
- Check goal progress
- Note urgent items

**2. Review Agent Cards (10 min)**
- Check **Suggested** column
- Approve priority emails
- Reject low-value actions

**3. Check Orders (10 min)**
- Review orders due today
- Update statuses
- Send client updates

**4. Plan Your Day (5 min)**
- Check calendar
- Prioritize tasks
- Set daily goals

### Midday Check-In (15 minutes)

**1. Process New Orders (5 min)**
- Review new order requests
- Assign to appraisers
- Confirm with clients

**2. Client Communications (10 min)**
- Respond to emails
- Return phone calls
- Update CRM notes

### Afternoon Work (Ongoing)

**1. Order Processing**
- Inspect properties
- Research comparables
- Draft reports

**2. Case Management**
- Move cases through stages
- Complete checklists
- Upload documents

**3. Chat with AI**
- Ask questions about clients
- Get market insights
- Draft emails

### Evening Wrap-Up (15 minutes)

**1. Update Records (5 min)**
- Log today's activities
- Update order statuses
- Add client notes

**2. Review Metrics (5 min)**
- Check daily stats
- Monitor goal progress
- Identify bottlenecks

**3. Approve Agent Actions (5 min)**
- Final card review
- Approve overnight sends
- Clear blocked items

### Weekly Tasks

**Monday:**
- Review last week's performance
- Set this week's priorities
- Update goals if needed

**Wednesday:**
- Check pipeline health
- Follow up on stalled orders
- Client health check

**Friday:**
- Week-end reporting
- Clean up loose ends
- Plan next week

---

## Advanced Features

### 1. Chat Interface

Navigate to **Chat** for conversational AI:

**What You Can Ask:**
- "Who are my top clients this month?"
- "Show me orders due this week"
- "What's the status of 123 Main St?"
- "Draft an email to John about the inspection delay"
- "Find comparables for [address]"

**RAG (Retrieval Augmented Generation):**
The chat can search:
- Your client database
- Order history
- Market data
- Previous conversations
- Document library

**Chat Features:**
- Voice input (speak instead of type)
- Context awareness (remembers conversation)
- Action suggestions (creates orders, sends emails)
- Data visualization (charts and graphs)

### 2. Goals System

Set and track business goals:

**Creating a Goal:**
1. Go to **Settings** → **Goals**
2. Click **+ New Goal**
3. Configure:
   - Goal name
   - Target metric (revenue, orders, clients)
   - Target value
   - Deadline
   - Priority

**Goal Types:**
- **Revenue Goals** - Income targets
- **Volume Goals** - Number of orders
- **Acquisition Goals** - New clients
- **Retention Goals** - Client satisfaction

**Goal Tracking:**
- Real-time progress bars
- Trending indicators
- Pressure calculations
- Alerts when falling behind

### 3. Admin Panel

(Admin users only)

Navigate to **Admin** for:

**User Management:**
- Add/remove team members
- Assign roles and permissions
- Manage access levels

**System Settings:**
- Configure email templates
- Set up automation rules
- Manage integrations

**Organization Settings:**
- Company profile
- Branding and logo
- Billing information

**Analytics:**
- Team performance
- Revenue reports
- Client analytics
- Agent effectiveness

### 4. Email Integration

**Sending Emails:**
- Agent-generated emails
- Manual sends from any page
- Template-based emails
- Personalized bulk sends

**Email Tracking:**
- Delivery confirmation
- Open tracking
- Click tracking
- Reply detection

**Email Templates:**
Create reusable templates:
- Order confirmations
- Status updates
- Follow-up sequences
- Marketing campaigns

### 5. Document Management

**Uploading Files:**
- Drag and drop anywhere
- Attach to orders, cases, clients
- Automatic organization

**File Types Supported:**
- PDFs (appraisal reports)
- Images (property photos)
- Spreadsheets (data analysis)
- Word docs (letters)

**Document Search:**
- Full-text search
- Filter by type, date, client
- Tag-based organization

### 6. Research System

**Comparable Search:**
- Find recent sales
- Filter by criteria
- Calculate adjustments
- Export to report

**Market Analysis:**
- Neighborhood trends
- Price per square foot
- Days on market
- Absorption rates

---

## Tips & Best Practices

### Data Entry

**1. Be Consistent**
- Use standard formats for addresses
- Consistent client naming
- Regular contact updates

**2. Add Details**
- Don't just add minimum info
- Include notes and context
- Tag items for easy search

**3. Use Categories**
- Client types
- Order types
- Contact roles
- Property types

### Communication

**1. Document Everything**
- Log all phone calls
- Save email threads
- Note in-person meetings
- Track promises made

**2. Set Expectations**
- Clear due dates
- Defined deliverables
- Regular updates
- Transparent pricing

**3. Follow Up**
- Use agent for automation
- Set reminders
- Check on old leads
- Nurture relationships

### Agent Usage

**1. Trust But Verify**
- Review agent suggestions
- Approve thoughtfully
- Monitor results
- Adjust settings

**2. Feed Quality Data**
- Keep contacts updated
- Log interactions
- Update statuses
- Clean duplicates

**3. Learn Patterns**
- What gets approved?
- What gets rejected?
- What drives results?
- Optimize over time

### Organization

**1. Use Cases for Complex Work**
- Multi-step appraisals
- Litigation support
- Consulting projects
- Difficult properties

**2. Regular Maintenance**
- Archive old orders
- Update client statuses
- Clean contact list
- Review goals monthly

**3. Leverage Automation**
- Let agent handle routine follow-ups
- Use email templates
- Set up recurring tasks
- Create workflows

### Performance

**1. Track Metrics**
- Conversion rates
- Response times
- Order cycle time
- Client satisfaction

**2. Set Benchmarks**
- Personal goals
- Team targets
- Industry standards
- Growth objectives

**3. Continuous Improvement**
- Weekly reviews
- Monthly analysis
- Quarterly planning
- Annual strategy

---

## Common Questions

### "How do I reset my password?"

1. Click "Forgot Password?" on login page
2. Enter your email
3. Check email for reset link
4. Create new password

### "How do I add a team member?"

(Admin only)
1. Go to **Admin** → **Users**
2. Click **+ Invite User**
3. Enter their email
4. Assign role and permissions
5. Send invitation

### "Can I customize email templates?"

Yes:
1. **Admin** → **Email Templates**
2. Select template to edit
3. Modify subject and body
4. Use variables for personalization
5. Save changes

### "How do I export data?"

1. Navigate to the list (Orders, Clients, etc.)
2. Click **Export** button
3. Choose format (CSV, Excel, PDF)
4. Select date range
5. Download file

### "What if the agent makes a mistake?"

1. Reject the card immediately
2. The agent learns from rejections
3. Add notes explaining why
4. Adjust agent settings if needed
5. Contact support for persistent issues

### "How do I pause the agent?"

1. Open **Agent Control Panel**
2. Click **Pause Agent**
3. Confirm action
4. Agent stops creating new cards
5. Resume when ready

### "Can I use this on mobile?"

Yes! Salesmod is fully responsive:
- Works on phones and tablets
- Touch-optimized interface
- Mobile-friendly layouts
- All features available

---

## Keyboard Shortcuts

Speed up your workflow:

**Global:**
- `Cmd/Ctrl + K` - Quick search
- `Cmd/Ctrl + /` - Open command palette
- `Esc` - Close dialogs

**Navigation:**
- `G + D` - Go to Dashboard
- `G + O` - Go to Orders
- `G + C` - Go to Clients
- `G + A` - Go to Agent

**Actions:**
- `N` - Create new (context-aware)
- `E` - Edit current item
- `S` - Save changes
- `/` - Focus search

---

## Getting Help

### In-App Help

- **?** icon - Context-sensitive help
- **Tooltips** - Hover over any button
- **Tour** - Guided walkthrough for new users

### Documentation

- **Full Docs** - [docs/index.md](./index.md)
- **Feature Guides** - [docs/features/](./features/)
- **Troubleshooting** - [docs/troubleshooting/](./troubleshooting/)

### Support

- **Email Support** - support@salesmod.com
- **Live Chat** - Bottom right corner
- **Knowledge Base** - help.salesmod.com

---

## Next Steps

Now that you know the basics:

1. **Complete the Setup**
   - Add your clients
   - Import contacts
   - Create first order
   - Configure agent

2. **Explore Features**
   - Try the chat interface
   - Set up a goal
   - Create a case
   - Review agent suggestions

3. **Optimize Your Workflow**
   - Customize dashboard
   - Create templates
   - Set up automation
   - Train your team

4. **Grow Your Business**
   - Let agent handle outreach
   - Track performance
   - Optimize processes
   - Scale operations

---

**Welcome to Salesmod!** 🚀

You now have a powerful AI-driven system to manage and grow your appraisal business. Start with the basics, then gradually explore advanced features as you get comfortable.

**Questions?** Check the [documentation index](./index.md) or reach out to support.

---

**Last Updated:** 2025-11-30
**Version:** 1.0
**For:** Salesmod Production System
