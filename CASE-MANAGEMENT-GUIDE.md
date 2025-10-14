# 🎯 Case Management System - Complete Guide

## Overview

The Case Management system allows you to track and manage customer support issues, quality concerns, billing disputes, service requests, and other customer-facing cases. It's fully integrated with your existing Clients, Orders, and Contacts.

---

## ✨ Features

### **Case Types**
- 🛠️ **Support** - Technical support and help requests
- 💰 **Billing** - Invoice issues, payment disputes
- ⚠️ **Quality Concern** - Issues with appraisal quality
- 😞 **Complaint** - Customer complaints
- 📋 **Service Request** - General service requests
- 🖥️ **Technical** - System/platform technical issues
- 💬 **Feedback** - Customer feedback and suggestions
- 📝 **Other** - Miscellaneous cases

### **Case Statuses**
- 🆕 **New** - Just created
- 🟣 **Open** - Acknowledged and being worked on
- ⏸️ **Pending** - Waiting on customer or third party
- ⏳ **In Progress** - Actively being resolved
- ✅ **Resolved** - Solution provided
- ❌ **Closed** - Completed and closed
- 🔄 **Reopened** - Previously resolved but reopened

### **Priority Levels**
- 🟢 **Low** - Minor issues, can wait
- 🔵 **Normal** - Standard priority
- 🟠 **High** - Needs attention soon
- 🔴 **Urgent** - Needs immediate attention
- ⚫ **Critical** - Business-critical, highest priority

---

## 📊 **What Was Built**

### **Database Tables**

#### `cases`
Stores all case information with auto-generated case numbers (CASE-YYYY-NNNN format).

**Key Features:**
- Auto-generated case numbers (e.g., CASE-2025-0001)
- Automatic timestamps for resolved_at and closed_at
- Links to clients, contacts, and orders
- Assignment tracking
- Resolution notes

#### `case_comments`
Track all communication on each case.

**Features:**
- Internal vs. external comments
- User attribution
- Chronological timeline
- Full audit trail

---

## 🚀 **Setup Instructions**

### 1. Run the Database Migration

Go to your Supabase SQL Editor and run:

```sql
-- File: supabase-case-management-migration.sql
```

This creates:
- ✅ `cases` table with all fields
- ✅ `case_comments` table for communication
- ✅ Auto-generate case number function
- ✅ Automatic status change triggers
- ✅ Row Level Security policies
- ✅ Performance indexes
- ✅ Views for reporting

### 2. Restart Your Dev Server

```bash
npm run dev
```

### 3. Navigate to Cases

Click the **Cases** icon (lifebuoy) in the sidebar or visit `/cases`

---

## 💼 **User Guide**

### **Creating a New Case**

1. Click the **"New Case"** button
2. Fill in the details:
   - **Subject** (required) - Brief description
   - **Description** - Detailed explanation
   - **Type** (required) - Select case type
   - **Priority** (required) - Set urgency level
   - **Status** (required) - Usually "New" for new cases
   - **Client** (optional) - Link to a client
   - **Order** (optional) - Link to a specific order
3. Click **"Create Case"**
4. Case number is automatically generated (e.g., CASE-2025-0001)

### **Managing Cases**

#### **Filters & Search**
- 🔍 **Search** - Search by subject, description, or case number
- 📊 **Status Filter** - Filter by case status
- 🎯 **Priority Filter** - Filter by priority level
- 📁 **Type Filter** - Filter by case type

#### **Quick Actions on Case Detail Page**
- 📝 **Change Status** - Update case status from sidebar
- 🎯 **Change Priority** - Adjust priority level
- 💬 **Add Comments** - Add internal or external notes
- ✅ **Mark as Resolved** - Add resolution and close case

### **Case Detail Page Tabs**

#### **Details Tab**
View all case information:
- Creator and creation date
- Assigned user
- Related client and order
- Resolution timestamps

#### **Comments Tab**
Communication timeline:
- Add new comments
- Mark comments as internal (not visible to client)
- See who posted and when
- Full chronological history

#### **Resolution Tab**
Case resolution:
- Add resolution notes
- Mark case as resolved (auto-updates status and timestamp)
- View existing resolution if already resolved

---

## 🎯 **Real-World Usage Examples**

### **Scenario 1: Billing Dispute**

1. **Create Case**
   - Type: Billing
   - Priority: High
   - Subject: "Invoice #1234 - Incorrect Fee Amount"
   - Client: ABC Lending
   - Order: Link to the specific order

2. **Add Comments**
   - Internal: "Spoke with accounting - there was a fee schedule mix-up"
   - External: "We've identified the issue and will send corrected invoice"

3. **Resolve**
   - Resolution: "Corrected invoice sent via email. Client confirmed receipt and approved."
   - Status changes to: Resolved (automatically)

### **Scenario 2: Quality Concern**

1. **Create Case**
   - Type: Quality Concern
   - Priority: Critical
   - Subject: "Comparable properties not appropriate"
   - Client: Global Bank
   - Order: #APR-2025-0042

2. **Track Progress**
   - Status: Open → In Progress
   - Comments: Document review process
   - Internal notes: Assignment to senior appraiser for review

3. **Resolution**
   - New appraisal ordered
   - Resolution documented
   - Case closed with follow-up notes

### **Scenario 3: Technical Support**

1. **Create Case**
   - Type: Technical
   - Priority: Urgent
   - Subject: "Cannot upload documents to portal"
   - Client: First National Bank

2. **Workflow**
   - Status: New → Open
   - Comment: "Investigating file size limits"
   - Status: In Progress
   - Comment: "Updated file size limit to 50MB"
   - Status: Resolved
   - Resolution: "File size limit increased. User can now upload documents."

---

## 🔗 **Integration with Other Features**

### **Client Detail Page**
- View all cases for a specific client
- Create new cases from client page
- Track support history

### **Order Detail Page**
- Link cases to specific orders
- View case history for an order
- Quick case creation for order issues

### **Dashboard & Reporting**
Use the cases data for:
- Support metrics (response time, resolution time)
- Client satisfaction tracking
- Identify recurring issues
- Quality control monitoring

---

## 📈 **Best Practices**

### **Case Creation**
- ✅ Use clear, descriptive subjects
- ✅ Add detailed descriptions
- ✅ Link to relevant clients/orders
- ✅ Set appropriate priority
- ✅ Assign cases when possible

### **Communication**
- ✅ Use internal comments for team discussion
- ✅ Use external comments for client communication
- ✅ Document all actions taken
- ✅ Keep timeline up-to-date

### **Resolution**
- ✅ Always add resolution notes before closing
- ✅ Verify customer satisfaction
- ✅ Document any follow-up needed
- ✅ Close cases promptly after resolution

### **Status Management**
- 🆕 **New** → First created
- 🟣 **Open** → Acknowledged, working on it
- ⏳ **In Progress** → Actively resolving
- ⏸️ **Pending** → Waiting on external info
- ✅ **Resolved** → Solution provided
- ❌ **Closed** → Complete

---

## 🔧 **Technical Details**

### **File Structure**

```
src/
├── lib/
│   ├── types.ts                          # Case types added
│   └── supabase/
│       └── transforms.ts                 # Case transforms added
├── hooks/
│   └── use-cases.ts                      # Case hooks (NEW)
├── components/
│   └── cases/
│       ├── case-form.tsx                 # Create/edit form (NEW)
│       ├── case-card.tsx                 # Case card display (NEW)
│       ├── case-status-badge.tsx         # Status badges (NEW)
│       └── cases-list.tsx                # Cases list with filters (NEW)
└── app/(app)/
    └── cases/
        ├── page.tsx                      # Cases list page (NEW)
        └── [id]/
            └── page.tsx                  # Case detail page (NEW)
```

### **React Query Hooks**

```typescript
// Fetch cases
const { data: cases } = useCases({ clientId, orderId, status })

// Fetch single case
const { data: case } = useCase(caseId)

// Create case
const createCase = useCreateCase()
await createCase.mutateAsync(caseData)

// Update case
const updateCase = useUpdateCase()
await updateCase.mutateAsync({ id, ...updates })

// Delete case
const deleteCase = useDeleteCase()
await deleteCase.mutateAsync(caseId)

// Fetch case comments
const { data: comments } = useCaseComments(caseId)

// Add comment
const createComment = useCreateCaseComment()
await createComment.mutateAsync(commentData)
```

### **Database Functions**

**Auto-generate Case Number:**
```sql
generate_case_number() 
-- Returns: CASE-YYYY-NNNN
-- Example: CASE-2025-0001
```

**Auto-set Timestamps:**
- `resolved_at` set automatically when status changes to "resolved"
- `closed_at` set automatically when status changes to "closed"

---

## 📊 **Reporting Queries**

### **Cases by Status**
```sql
SELECT status, COUNT(*) as count
FROM cases
GROUP BY status
ORDER BY count DESC;
```

### **Cases by Priority**
```sql
SELECT priority, COUNT(*) as count
FROM cases
WHERE status NOT IN ('closed', 'resolved')
GROUP BY priority
ORDER BY 
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'urgent' THEN 2
    WHEN 'high' THEN 3
    WHEN 'normal' THEN 4
    WHEN 'low' THEN 5
  END;
```

### **Average Resolution Time**
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
FROM cases
WHERE resolved_at IS NOT NULL;
```

### **Cases per Client**
```sql
SELECT 
  cl.company_name,
  COUNT(c.id) as case_count
FROM cases c
JOIN clients cl ON c.client_id = cl.id
GROUP BY cl.company_name
ORDER BY case_count DESC
LIMIT 10;
```

---

## 🚨 **Troubleshooting**

### **Case Number Not Generating**
- Verify the migration ran successfully
- Check that `generate_case_number()` function exists
- Ensure trigger is active on cases table

### **Comments Not Showing**
- Verify `case_comments` table exists
- Check RLS policies are enabled
- Ensure user is authenticated

### **Cannot Update Status**
- Check permissions in RLS policies
- Verify user is authenticated
- Check for any database errors in console

### **Performance Issues**
- Ensure indexes are created (migration includes them)
- Consider adding pagination for large datasets
- Use filters to narrow results

---

## 🎉 **What's Next?**

### **Potential Enhancements**

1. **Email Notifications**
   - Notify assigned users of new cases
   - Alert clients when cases are resolved
   - Escalation emails for high-priority cases

2. **SLA Tracking**
   - Set response time targets by priority
   - Track first-response time
   - Monitor resolution time vs. targets

3. **Case Templates**
   - Pre-defined case types with default fields
   - Quick case creation for common issues

4. **Knowledge Base Integration**
   - Link cases to KB articles
   - Suggest articles based on case type
   - Track which articles resolve cases

5. **Advanced Analytics**
   - Case trend analysis
   - Client satisfaction scores
   - Team performance metrics
   - Predictive issue detection

6. **Automation**
   - Auto-assign based on case type
   - Auto-escalate based on age
   - Auto-close resolved cases after X days

---

## 📞 **Support**

For questions about the Case Management system:
1. Check this guide
2. Review the database migration file
3. Inspect the component code for examples
4. Check browser console for errors

---

## ✅ **Summary**

You now have a complete Case Management system that:
- ✅ Tracks all customer issues and requests
- ✅ Integrates with clients and orders
- ✅ Provides full communication timeline
- ✅ Auto-generates case numbers
- ✅ Supports internal/external comments
- ✅ Tracks resolution and closure
- ✅ Includes filtering and search
- ✅ Provides detailed reporting data
- ✅ Follows your existing app patterns
- ✅ Has Row Level Security enabled

**All data is secured and syncs in real-time!** 🚀


