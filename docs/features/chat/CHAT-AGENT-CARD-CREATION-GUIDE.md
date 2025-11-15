---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# 📧 Chat Agent Card Creation - Complete Guide

## Summary

The chat agent CAN create email cards, but there are specific requirements that must be met. Based on your conversation, the agent encountered some limitations. Here's the complete breakdown:

## ✅ What Works

### 1. Agent Run Method (Recommended)
**Use the "Run Agent" button** on the `/agent` page. This is the BEST way to create cards because:
- ✅ Automatically analyzes all clients and their needs
- ✅ Creates properly formatted email cards with subjects and bodies
- ✅ Correctly assigns clients and contacts
- ✅ Generates multiple cards at once based on priorities
- ✅ Includes clear rationales for each action

**How to use:**
1. Go to `/agent` page
2. Click "Run Agent" button
3. Wait for analysis to complete
4. Review suggested cards on the Kanban board
5. Approve and send

### 2. Chat Commands (Limited)
The chat agent can create cards via `[CREATE_CARD: ...]` tags, but it has limitations:

**✅ What the chat agent CAN do:**
- Create basic action cards (tasks, research, deals)
- Match client names from your database
- Set priorities and types
- Add rationales

**⚠️ What the chat agent STRUGGLES with:**
- Creating properly formatted email bodies with line breaks
- Including complete email subjects and messages in the tag format
- Handling complex recipient addressing (email vs contact vs client)
- Creating cards with full email drafts

## 🔍 Why Your Test Failed

Looking at your conversation, the agent tried:
```
[CREATE_CARD: type=send_email, title=Test Email to Rod, client=n/a, priority=medium, 
subject=Test Email Formatting, 
message=Hi Rod. This is paragraph one with some test content. This is paragraph two with more content. Here are bullet points: Point one about testing. Point two about formatting. Point three about verification. This is the closing paragraph., 
rationale=Testing email formatting for Rod Haugabrooks]
```

**Problems:**
1. ❌ `client=n/a` - No valid client assignment
2. ❌ `message` is one long string - No formatting
3. ❌ No `contact=` field to specify Rod's email
4. ❌ The tag format doesn't handle multi-line content well

## ✅ Best Practices for Chat Commands

### For Simple Tasks (✅ Works Well)
```
"Create a task card to review Q4 pipeline for iFund Cities"
```

Agent response:
```
[CREATE_CARD: type=create_task, title=Review Q4 Pipeline, client=i Fund Cities LLC, priority=medium, rationale=Quarterly pipeline review]
```

### For Research Cards (✅ Works Well)
```
"Create a research card to analyze competitor pricing"
```

Agent response:
```
[CREATE_CARD: type=research, title=Competitor Pricing Analysis, priority=medium, rationale=Market intelligence for Q1 planning]
```

### For Email Cards (⚠️ Limited)
**Don't use chat for complex emails.** Instead:

1. **Option A: Use Agent Run**
   - Click "Run Agent"
   - Let it analyze and create proper email cards

2. **Option B: Create Manually via API**
   ```bash
   curl -X POST http://localhost:3000/api/agent/chat/create-card \
     -H "Content-Type: application/json" \
     -d '{
       "type": "send_email",
       "clientId": "your-client-uuid-here",
       "title": "Test Email to Rod",
       "rationale": "Testing formatting",
       "priority": "medium",
       "emailDraft": {
         "to": "rod@myroihome.com",
         "subject": "Test Email Formatting",
         "body": "Hi Rod,\n\nThis is paragraph one.\n\nHere are some points:\n\n1. First point\n2. Second point\n3. Third point\n\nBest regards"
       }
     }'
   ```

## 🎯 Recommended Workflow

### For Creating Email Cards:

**Method 1: Agent Run (BEST)**
1. Navigate to `/agent`
2. Click "Run Agent"
3. Review generated email cards
4. Approve and send

**Method 2: Chat for Simple Cards Only**
Use chat for tasks, research, and deals:
- "Create a task to call iFund Cities about their Q4 orders"
- "Create a research card for market analysis"
- "Create a deal card for the ABC Corp contract"

**Method 3: Manual Email Card Creation**
For specific test emails:
1. Use the API endpoint directly (see curl example above)
2. Or create the card through the Kanban board UI manually

## 🔧 Technical Explanation

### Why Chat Has Limitations:

1. **Tag Format Constraints**
   - The `[CREATE_CARD: ...]` format uses comma-separated key=value pairs
   - Multi-line content with line breaks doesn't parse well
   - Complex HTML content can break the parser

2. **Client Matching**
   - Chat agent uses fuzzy matching on client names
   - "n/a" or "[Unassigned Contacts]" won't match real clients
   - Need actual client company names or UUIDs

3. **Email Content**
   - Email cards need `action_payload` with `to`, `subject`, `body`
   - Chat tags don't map these fields correctly
   - The `message` parameter doesn't populate `action_payload.body`

### How Agent Run Works (Better):

1. **Proper Email Draft Structure**
   ```typescript
   actionPayload = {
     to: contact.email,
     subject: "Well-formatted subject",
     body: formatEmailBody("Properly\n\nFormatted\n\n1. With\n2. Lists"),
     replyTo: "Admin@roiappraise.com"
   }
   ```

2. **Automatic Formatting**
   - Uses `formatEmailBody()` function
   - Detects numbered lists
   - Creates proper paragraph breaks
   - Generates clean HTML

3. **Proper Client/Contact Assignment**
   - Looks up actual client IDs
   - Finds contact emails
   - Validates recipients

## 📋 Summary

| Method | Email Cards | Task Cards | Research Cards | Best For |
|--------|-------------|------------|----------------|----------|
| **Agent Run** | ✅ Excellent | ✅ Good | ✅ Good | Creating properly formatted email cards |
| **Chat Commands** | ⚠️ Limited | ✅ Excellent | ✅ Excellent | Quick tasks and research cards |
| **API Direct** | ✅ Excellent | ✅ Good | ✅ Good | Testing and automation |
| **Manual UI** | ✅ Good | ✅ Good | ✅ Good | One-off custom cards |

## 🎯 What To Do Now

**For your test email:**
1. Go to `/agent` page
2. Click "Run Agent"
3. Wait for cards to be generated
4. Find an email card (or let it create one for Rod)
5. Review the formatting in the preview
6. Approve and send
7. Check inbox - it should be properly formatted!

**Or for a quick test:**
Ask the chat agent: *"Create a task card to send a test email to Rod to verify formatting"*

This will create a **task card** (not an email card), reminding you to send a test email. Then you can use Agent Run to create the actual properly formatted email card.

---

The chat agent is designed to be your strategic assistant for quick cards and analysis. For complex email drafts with formatting, always use **Agent Run** for the best results! 🚀



