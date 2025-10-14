# Account Manager Agent Implementation Plan

## Overview

This plan outlines the implementation of an AI-powered Account Manager Agent that will assist sales teams by drafting communications, providing strategic recommendations, and automating routine account management tasks. The agent will integrate with the existing CRM system and leverage client context, activity history, and deal information to generate personalized, relevant communications.

## Design Philosophy

1. **Human-in-the-Loop**: All AI-generated content requires explicit approval before sending
2. **Context-Aware**: Leverage full CRM context (activities, deals, orders, contacts) for relevant suggestions
3. **Transparent**: Clear indication of AI-generated content with edit capabilities
4. **Incremental**: Build foundation first, add automation gradually
5. **Safe**: Start with suggestions only, never auto-send without approval

---

## Phase 1: Foundation & Context System

### Goal
Build the infrastructure for the AI agent to understand client context and generate relevant suggestions.

### Tasks

#### 1.1 Create Context API Endpoints
**File**: `src/app/api/ai/context/route.ts`

**What to build**:
- API endpoint that aggregates all relevant client data for AI context
- Fetch client details, recent activities, active deals, pending tasks, order history
- Format data into a structured context object optimized for LLM consumption
- Implement caching strategy to reduce database load

**Acceptance Criteria**:
- Endpoint returns comprehensive client context in <2 seconds
- Context includes last 30 days of activities, all active deals, pending tasks
- Data is properly sanitized and formatted for AI consumption
- Implements rate limiting (e.g., 10 requests/minute per user)

**Example Response Structure**:
```typescript
{
  client: { id, name, company, tags },
  recentActivities: [...],
  activeDeals: [...],
  pendingTasks: [...],
  orderHistory: [...],
  contactPreferences: {...},
  lastInteraction: "2025-10-10"
}
```

#### 1.2 Create AI Service Layer
**File**: `src/lib/ai/agent-service.ts`

**What to build**:
- Service class that interfaces with AI API (OpenAI, Anthropic, etc.)
- Implement prompt templates for different communication types:
  - Follow-up emails
  - Check-in messages
  - Deal progression updates
  - Task reminders
- Token management and cost tracking
- Error handling and fallback mechanisms

**Acceptance Criteria**:
- Service successfully generates draft communications
- Supports multiple prompt templates
- Handles API errors gracefully with user-friendly messages
- Logs all AI interactions for audit trail

#### 1.3 Database Schema Extensions
**File**: `supabase-agent-migration.sql`

**What to build**:
```sql
-- Table to store AI-generated drafts
CREATE TABLE ai_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL, -- 'email', 'note', 'task'
  subject TEXT,
  content TEXT NOT NULL,
  context_snapshot JSONB, -- Store the context used to generate
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'edited', 'rejected'
  created_by UUID NOT NULL REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

-- Table to store agent suggestions/recommendations
CREATE TABLE agent_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'follow_up', 'deal_action', 'task_create'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  title TEXT NOT NULL,
  description TEXT,
  reasoning TEXT, -- Why the AI suggested this
  action_data JSONB, -- Structured data for the suggested action
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_ai_drafts_client ON ai_drafts(client_id);
CREATE INDEX idx_ai_drafts_status ON ai_drafts(status);
CREATE INDEX idx_agent_suggestions_client ON agent_suggestions(client_id);
CREATE INDEX idx_agent_suggestions_status ON agent_suggestions(status, priority);
```

**Acceptance Criteria**:
- All tables created successfully
- RLS policies implemented for security
- Proper foreign key relationships established
- Indexes optimize query performance

#### 1.4 Create React Query Hooks
**Files**: 
- `src/hooks/use-ai-drafts.ts`
- `src/hooks/use-agent-suggestions.ts`

**What to build**:
- `useAiDrafts()` - List all drafts for a client
- `useGenerateDraft()` - Trigger AI to generate a new draft
- `useApproveDraft()` - Approve and optionally edit a draft
- `useRejectDraft()` - Reject a draft
- `useAgentSuggestions()` - Fetch pending suggestions for a client
- `useDismissSuggestion()` - Dismiss a suggestion
- `useAcceptSuggestion()` - Accept and execute a suggestion

**Acceptance Criteria**:
- All hooks properly typed with TypeScript
- Automatic cache invalidation on mutations
- Loading and error states properly handled
- Optimistic updates where appropriate

---

## Phase 2: Draft Generation & Review

### Goal
Implement the UI for users to request, review, and approve AI-generated communications.

### Tasks

#### 2.1 Draft Generation Dialog
**File**: `src/components/ai/generate-draft-dialog.tsx`

**What to build**:
- Dialog component triggered from client detail page
- Form to specify draft type (email, note, internal memo)
- Optional context hints (e.g., "mention the upcoming inspection")
- Loading state while AI generates content
- Preview of generated draft with edit capability
- Approve/Reject actions

**UI Flow**:
1. User clicks "Generate AI Draft" button
2. Dialog opens with draft type selector
3. User optionally adds context hints
4. Click "Generate" → loading spinner
5. Draft appears with editable text area
6. User can edit, approve, or reject

**Acceptance Criteria**:
- Clean, intuitive UI matching existing design system
- Real-time editing of generated content
- Clear indication this is AI-generated content
- "Regenerate" option if user doesn't like first draft

#### 2.2 Drafts Management Tab
**File**: `src/components/ai/drafts-list.tsx`

**What to build**:
- New tab on client detail page: "AI Drafts"
- List of all pending, approved, and rejected drafts
- Filter by status (Pending, Approved, Rejected, Sent)
- Click to view/edit draft
- Bulk actions (approve multiple, delete old drafts)

**Acceptance Criteria**:
- Responsive table/card layout
- Status badges with color coding
- Quick actions (approve, edit, reject) on each draft
- Pagination or infinite scroll for large lists

#### 2.3 Draft Approval Workflow
**File**: `src/components/ai/draft-approval.tsx`

**What to build**:
- Dedicated component for reviewing a draft
- Side-by-side view: context used vs. generated content
- Edit functionality with rich text editor
- "Approve & Send" vs. "Approve & Save for Later"
- Option to log as activity or create task after approval
- Feedback mechanism (thumbs up/down for AI learning)

**Acceptance Criteria**:
- All edits properly saved
- Upon approval, draft is logged to activities table
- Email drafts can integrate with email client (mailto link or future email service)
- Feedback stored for future AI improvements

#### 2.4 Integration with Client Detail Page
**File**: `src/app/(app)/clients/[id]/page.tsx`

**What to build**:
- Add "AI Assistant" tab to existing tabs (Overview, Contacts, Activity, Deals, Orders)
- Section showing recent drafts and suggestions
- Quick action button: "Generate Follow-up Email"
- Summary widget showing: X pending drafts, Y suggestions

**Acceptance Criteria**:
- Seamless integration with existing UI
- No layout breaking or performance degradation
- Proper loading states for AI operations
- Mobile responsive

---

## Phase 3: Approval Workflow & Suggestions

### Goal
Build the suggestion system where AI proactively recommends actions based on client data analysis.

### Tasks

#### 3.1 Suggestion Engine
**File**: `src/lib/ai/suggestion-engine.ts`

**What to build**:
- Background logic to analyze client data and generate suggestions
- Rules-based triggers:
  - No activity in 7 days → suggest follow-up
  - Deal stuck in stage >14 days → suggest status check
  - Task overdue → suggest escalation
  - Positive activity → suggest upsell opportunity
- AI-powered analysis for more nuanced suggestions
- Priority scoring algorithm

**Acceptance Criteria**:
- Generates 3-5 relevant suggestions per client
- Avoids duplicate or conflicting suggestions
- Suggestions include actionable next steps
- Clear reasoning for each suggestion

#### 3.2 Suggestions Dashboard Widget
**File**: `src/components/ai/suggestions-widget.tsx`

**What to build**:
- Dashboard widget showing top priority suggestions across all clients
- Card-based layout with:
  - Client name + suggestion title
  - Priority indicator (high/medium/low)
  - AI reasoning snippet
  - Quick actions: Accept, Dismiss, View Client
- Filter by priority or suggestion type

**Acceptance Criteria**:
- Displays 5-10 most urgent suggestions
- Real-time updates when suggestions resolved
- Click to navigate to client with context
- Beautiful, scannable design

#### 3.3 Suggestion Detail & Action
**File**: `src/components/ai/suggestion-detail.tsx`

**What to build**:
- Modal or slide-over panel with full suggestion details
- Context that led to suggestion (e.g., "No contact in 12 days, previous deal in pipeline")
- Pre-filled action (e.g., draft email, create task, schedule call)
- "Accept" button executes the suggested action
- "Dismiss" with optional reason (helps AI learn)
- "Snooze" to revisit later

**Acceptance Criteria**:
- Clear explanation of why suggestion was made
- One-click action execution
- Undo capability for accepted suggestions
- Dismissal feedback improves future suggestions

#### 3.4 Client Intelligence Panel
**File**: `src/components/ai/client-intelligence.tsx`

**What to build**:
- Collapsible panel on client detail page
- AI-generated insights about the client:
  - Communication patterns
  - Deal velocity
  - Engagement score
  - Risk factors (e.g., declining engagement)
  - Opportunities (e.g., ready for upsell)
- Visual indicators (graphs, scores, trends)
- Refreshable (user can request updated analysis)

**Acceptance Criteria**:
- Insights are accurate and actionable
- Visual design is clear and professional
- Data updates reflect recent changes
- Performance: generates in <5 seconds

---

## Phase 4: Learning & Optimization

### Goal
Implement feedback loops and learning mechanisms to improve AI performance over time.

### Tasks

#### 4.1 Feedback Collection System
**File**: `src/components/ai/feedback-widget.tsx`

**What to build**:
- Simple thumbs up/down on every AI-generated draft
- Optional detailed feedback form
- Track which suggestions are accepted vs. dismissed
- Store user edits to drafts (what did they change?)
- A/B testing framework for different prompts

**Acceptance Criteria**:
- Non-intrusive feedback UI
- All feedback stored with context
- Analytics dashboard showing acceptance rates
- Ability to review low-rated outputs

#### 4.2 Agent Performance Dashboard
**File**: `src/app/(app)/ai-analytics/page.tsx`

**What to build**:
- Admin-only page with AI performance metrics:
  - Draft acceptance rate
  - Suggestion acceptance rate
  - Average edits per draft
  - Time saved by AI assistance
  - Cost tracking (API calls, tokens used)
- Charts showing trends over time
- Filter by user, client, or date range
- Export capabilities for reporting

**Acceptance Criteria**:
- Comprehensive metrics collection
- Real-time data updates
- Clear visualizations (charts, graphs)
- Accessible only to admin roles

#### 4.3 Prompt Optimization Pipeline
**File**: `src/lib/ai/prompt-optimizer.ts`

**What to build**:
- System to track which prompt variations perform best
- Automatic prompt refinement based on feedback
- Version control for prompts
- A/B testing between prompt versions
- Rollback capability if new prompts underperform

**Acceptance Criteria**:
- Multiple prompt versions can be tested simultaneously
- Clear metrics on prompt performance
- Easy rollback to previous versions
- Documentation of prompt changes

#### 4.4 Fine-tuning Dataset Generator
**File**: `src/lib/ai/training-data-exporter.ts`

**What to build**:
- Export approved drafts and user edits for fine-tuning
- Format data according to AI provider specs (OpenAI, etc.)
- Privacy controls (anonymize sensitive data)
- Generate training examples from high-quality interactions
- Periodic export automation (weekly/monthly)

**Acceptance Criteria**:
- Exports in correct format for chosen AI provider
- All sensitive data properly anonymized
- User consent for data usage
- Audit trail of all exports

---

## Technical Considerations

### 1. Security & Privacy
- **Data Encryption**: All AI drafts and suggestions encrypted at rest
- **Access Control**: RLS policies ensure users only see their drafts
- **Audit Logging**: Track all AI interactions for compliance
- **Data Retention**: Implement policies for draft deletion after 90 days
- **PII Handling**: Anonymize personal information in training data

### 2. Performance Optimization
- **Caching**: Cache context data for frequently accessed clients
- **Streaming**: Use streaming for real-time draft generation
- **Background Jobs**: Generate suggestions via background workers, not on-demand
- **Rate Limiting**: Prevent API abuse and manage costs
- **Lazy Loading**: Load AI features only when needed

### 3. Cost Management
- **Token Budgets**: Set per-user or org-wide token limits
- **Model Selection**: Use cheaper models for simple tasks, advanced for complex
- **Prompt Optimization**: Minimize token usage in prompts
- **Batch Processing**: Group similar requests to reduce API calls
- **Monitoring**: Real-time cost tracking and alerts

### 4. Error Handling
- **Graceful Degradation**: App functions without AI if service is down
- **Retry Logic**: Automatic retries with exponential backoff
- **User Feedback**: Clear error messages ("AI is temporarily unavailable")
- **Fallback Content**: Pre-written templates if AI generation fails
- **Monitoring**: Alert on high error rates

### 5. Testing Strategy
- **Unit Tests**: Test all AI service functions with mocked responses
- **Integration Tests**: Test full workflow from request to approval
- **E2E Tests**: User journey from client page to approved draft
- **Load Tests**: Ensure system handles concurrent AI requests
- **Quality Tests**: Human review of AI outputs for accuracy

---

## Database Schema Summary

### New Tables

#### `ai_drafts`
Stores AI-generated communication drafts awaiting approval.

**Key Fields**:
- `client_id`: Foreign key to clients table
- `draft_type`: Type of communication (email, note, etc.)
- `content`: The generated text
- `context_snapshot`: Client context used for generation (JSONB)
- `status`: Workflow state (pending, approved, rejected)

**Relationships**:
- `client_id` → `clients.id`
- `created_by` → `profiles.id`
- `approved_by` → `profiles.id`

#### `agent_suggestions`
Stores AI-generated suggestions for account management actions.

**Key Fields**:
- `client_id`: Foreign key to clients table
- `suggestion_type`: Category of suggestion (follow_up, deal_action, etc.)
- `priority`: Urgency level (low, medium, high)
- `reasoning`: Why the AI made this suggestion
- `action_data`: Structured data for the suggested action (JSONB)
- `status`: Whether suggestion is pending, accepted, or dismissed

**Relationships**:
- `client_id` → `clients.id`

#### `ai_feedback`
Stores user feedback on AI-generated content for learning.

**Key Fields**:
- `draft_id` or `suggestion_id`: Link to the AI output
- `rating`: Thumbs up/down or numeric score
- `feedback_text`: Optional detailed feedback
- `user_edits`: Diff of changes user made (JSONB)

**Relationships**:
- `draft_id` → `ai_drafts.id`
- `suggestion_id` → `agent_suggestions.id`
- `user_id` → `profiles.id`

---

## API Endpoints

### AI Context
- `GET /api/ai/context/:clientId` - Fetch aggregated client context
- Response includes recent activities, deals, tasks, orders

### Draft Management
- `POST /api/ai/drafts/generate` - Generate new AI draft
  - Body: `{ clientId, draftType, contextHints }`
- `GET /api/ai/drafts/:clientId` - List drafts for a client
- `PATCH /api/ai/drafts/:draftId` - Edit draft content
- `POST /api/ai/drafts/:draftId/approve` - Approve draft
- `POST /api/ai/drafts/:draftId/reject` - Reject draft

### Suggestions
- `GET /api/ai/suggestions` - List all pending suggestions
- `GET /api/ai/suggestions/:clientId` - List suggestions for a client
- `POST /api/ai/suggestions/:suggestionId/accept` - Accept suggestion
- `POST /api/ai/suggestions/:suggestionId/dismiss` - Dismiss suggestion

### Feedback
- `POST /api/ai/feedback` - Submit feedback on AI output
  - Body: `{ draftId?, suggestionId?, rating, feedbackText }`

### Analytics (Admin only)
- `GET /api/ai/analytics/performance` - Overall AI performance metrics
- `GET /api/ai/analytics/costs` - Cost tracking and token usage

---

## UI Components Structure

### New Components

```
src/components/ai/
├── generate-draft-dialog.tsx          # Modal to request AI draft
├── draft-approval.tsx                 # Review and approve drafts
├── drafts-list.tsx                    # List of all drafts for a client
├── suggestion-detail.tsx              # Detailed view of a suggestion
├── suggestions-widget.tsx             # Dashboard widget for suggestions
├── client-intelligence.tsx            # AI insights panel for client
├── feedback-widget.tsx                # Thumbs up/down feedback UI
└── agent-status-indicator.tsx         # Shows if AI is active/processing
```

### Existing Component Updates

```
src/app/(app)/clients/[id]/page.tsx    # Add "AI Assistant" tab
src/app/(app)/dashboard/page.tsx       # Add suggestions widget
src/components/layout/sidebar.tsx      # Add "AI Insights" nav item (admin only)
```

---

## React Query Hooks

### `use-ai-drafts.ts`
```typescript
export function useAiDrafts(clientId: string)
export function useGenerateDraft()
export function useApproveDraft()
export function useRejectDraft()
export function useEditDraft()
```

### `use-agent-suggestions.ts`
```typescript
export function useAgentSuggestions(clientId?: string)
export function useAcceptSuggestion()
export function useDismissSuggestion()
export function useSnoozeSuggestion()
```

### `use-ai-feedback.ts`
```typescript
export function useSubmitFeedback()
export function useFeedbackStats()
```

---

## Success Metrics

### Phase 1 (Foundation)
- ✅ Context API responds in <2 seconds
- ✅ AI service successfully generates drafts
- ✅ All database tables created and secured
- ✅ React Query hooks functional and typed

### Phase 2 (Draft Generation)
- ✅ Users can generate and approve drafts
- ✅ 70%+ of generated drafts require minimal editing
- ✅ Average time to draft communication reduced by 50%
- ✅ UI is intuitive (user testing with 5+ people)

### Phase 3 (Suggestions)
- ✅ Suggestions appear within 5 seconds of viewing client
- ✅ 50%+ suggestion acceptance rate
- ✅ Users report feeling "helped" by suggestions (survey)
- ✅ Zero missed follow-ups due to AI reminders

### Phase 4 (Learning)
- ✅ Draft quality improves 20% month-over-month (measured by edit rate)
- ✅ Suggestion relevance improves (acceptance rate increases)
- ✅ Cost per draft decreases 15% through optimization
- ✅ Fine-tuned model performs 30% better than base model

### Business Impact
- **Time Saved**: 2-3 hours per user per week on drafting
- **Response Speed**: 50% faster response times to clients
- **Conversion Rate**: 10-15% increase in deal progression
- **User Satisfaction**: 8+/10 rating for AI assistant features
- **ROI**: AI assistant pays for itself within 3 months

---

## Implementation Timeline

### Phase 1: Foundation (2-3 weeks)
- Week 1: Database schema, context API, AI service layer
- Week 2: React Query hooks, basic testing
- Week 3: Integration testing, security review

### Phase 2: Draft Generation (2-3 weeks)
- Week 1: Draft generation dialog, preview UI
- Week 2: Approval workflow, drafts management tab
- Week 3: Client detail page integration, user testing

### Phase 3: Suggestions (3-4 weeks)
- Week 1: Suggestion engine logic and triggers
- Week 2: Suggestions widget, detail views
- Week 3: Client intelligence panel
- Week 4: Polish, testing, performance optimization

### Phase 4: Learning (2-3 weeks)
- Week 1: Feedback collection system
- Week 2: Analytics dashboard
- Week 3: Prompt optimization pipeline, training data export

**Total Timeline**: 9-13 weeks for full implementation

---

## Dependencies & Prerequisites

### Required Services
- **AI Provider Account**: OpenAI (GPT-4), Anthropic (Claude), or similar
- **API Keys**: Secured in environment variables
- **Supabase**: Edge Functions for background jobs (optional)
- **Email Service**: For sending approved drafts (future phase)

### Required Skills
- TypeScript/React expertise
- AI/LLM prompt engineering
- Database design and optimization
- API design and security best practices
- UI/UX design for AI interactions

### Testing Requirements
- Playwright for E2E tests
- Jest for unit tests
- User testing group (5-10 sales team members)
- QA environment for testing AI features

---

## Risk Mitigation

### Risk 1: Poor AI Output Quality
**Mitigation**:
- Start with well-tested prompt templates
- Human approval required for all outputs
- Continuous feedback collection
- A/B test prompt variations

### Risk 2: High API Costs
**Mitigation**:
- Implement strict token budgets
- Use caching aggressively
- Monitor costs in real-time
- Choose appropriate model sizes (not always largest)

### Risk 3: User Adoption Resistance
**Mitigation**:
- Extensive user training and documentation
- Show clear time savings (metrics)
- Make AI optional, not forced
- Collect feedback and iterate quickly

### Risk 4: Data Privacy Concerns
**Mitigation**:
- Clear privacy policy and consent flows
- Anonymize all training data
- Comply with GDPR, CCPA, etc.
- Regular security audits

### Risk 5: AI Service Outages
**Mitigation**:
- Graceful degradation (app works without AI)
- Status indicator shows when AI unavailable
- Fallback to manual workflows
- Monitor service health proactively

---

## Future Enhancements (Post-Launch)

### Voice Integration
- Dictate drafts instead of typing
- Voice notes automatically transcribed and structured

### Multi-Channel Support
- SMS drafts
- Social media post suggestions
- Video script outlines

### Advanced Analytics
- Sentiment analysis on client communications
- Churn prediction models
- Upsell opportunity detection

### Autonomous Actions (with strict controls)
- Auto-send low-risk communications (e.g., appointment confirmations)
- Auto-create tasks based on triggers
- Auto-update deal stages based on activities

### Team Collaboration
- Share successful drafts as templates
- Team-wide suggestion feed
- Collaborative editing of AI outputs

---

## Appendix

### A. Sample Prompts

#### Follow-up Email Prompt
```
You are a professional account manager. Based on the following client context, draft a friendly follow-up email:

Client: {client_name}
Company: {company_name}
Last Contact: {last_contact_date}
Recent Activities: {activities_summary}
Active Deals: {deals_summary}

Guidelines:
- Tone: Professional but warm
- Length: 100-150 words
- Include a specific call-to-action
- Reference recent interactions naturally

Draft:
```

#### Suggestion Reasoning Prompt
```
Analyze the following client data and determine if any proactive actions are needed:

{client_context}

Consider:
- Communication gaps (no contact >7 days)
- Stalled deals (no progress >14 days)
- Overdue tasks
- Upsell opportunities

Provide:
1. Suggestion type
2. Priority level
3. Clear reasoning
4. Recommended action

Output as JSON.
```

### B. Transformation Functions

#### Draft Transform (snake_case ↔ camelCase)
```typescript
export function transformAiDraft(data: any): AiDraft {
  return {
    id: data.id,
    clientId: data.client_id,
    draftType: data.draft_type,
    subject: data.subject,
    content: data.content,
    contextSnapshot: data.context_snapshot,
    status: data.status,
    createdBy: data.created_by,
    approvedBy: data.approved_by,
    createdAt: data.created_at,
    approvedAt: data.approved_at,
    sentAt: data.sent_at,
  }
}
```

### C. RLS Policies

#### ai_drafts Policies
```sql
-- Users can view their own drafts
CREATE POLICY "Users can view their own drafts"
ON ai_drafts FOR SELECT
USING (auth.uid() = created_by);

-- Users can create drafts
CREATE POLICY "Users can create drafts"
ON ai_drafts FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can update their pending drafts
CREATE POLICY "Users can update their pending drafts"
ON ai_drafts FOR UPDATE
USING (auth.uid() = created_by AND status = 'pending');
```

---

## Questions & Considerations for Codex

1. **AI Provider**: Which AI service would you like to use? (OpenAI GPT-4, Anthropic Claude, or other?)

2. **Email Integration**: Should approved drafts integrate with an email service (SendGrid, Resend, etc.) or just provide mailto links?

3. **Roles**: Should AI features be available to all users or limited to certain roles (e.g., admin only)?

4. **Budget**: What's the monthly budget for AI API costs? This will inform token limits and model selection.

5. **Priority**: Which phase should be built first? Recommend Phase 1 + Phase 2 (drafts) for immediate user value.

6. **Background Jobs**: Should we use Supabase Edge Functions for background suggestion generation, or run it on-demand?

7. **Mobile**: Do AI features need mobile app support, or web-only initially?

8. **Languages**: Single language (English) or multi-language support for drafts?

---

## Getting Started Checklist

Before starting implementation:

- [ ] Set up AI provider account (OpenAI/Anthropic/etc.)
- [ ] Generate and secure API keys in `.env.local`
- [ ] Review and approve database schema
- [ ] Run initial migration (`supabase-agent-migration.sql`)
- [ ] Set up testing environment
- [ ] Define token budget and rate limits
- [ ] Create sample prompt templates
- [ ] Set up monitoring and logging
- [ ] Plan user training and rollout strategy
- [ ] Document privacy policy updates

---

## Conclusion

This plan provides a comprehensive roadmap for building an AI Account Manager Agent that will significantly enhance the productivity of your sales team. By following a phased approach, we ensure:

1. **Solid Foundation**: Context system and AI service layer are robust
2. **User Value Early**: Draft generation provides immediate time savings
3. **Safe Deployment**: Human approval loop prevents mistakes
4. **Continuous Improvement**: Feedback and learning systems improve over time

The estimated timeline of 9-13 weeks allows for thorough testing and iteration. Each phase delivers standalone value, so you can pause and assess before proceeding to the next phase.

**Next Steps**: Review this plan, answer the questions in Appendix D, and then begin Phase 1 implementation.

