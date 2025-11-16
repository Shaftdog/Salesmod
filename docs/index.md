---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Salesmod Documentation

> Central documentation index for the Salesmod appraisal management system

---

## Quick Navigation

- [Get Started](getting-started/SETUP-STEPS.md) - Setup and installation
- [Architecture Overview](architecture/) - System design and data model
- [Features](features/) - Feature documentation by category
- [Operations](operations/) - Database, imports, and deployment
- [Testing](testing/TESTING-GUIDE.md) - Testing guides and results

---

## 1. Getting Started

**New to Salesmod? Start here:**

- [Setup Guide](getting-started/SETUP-STEPS.md) - Complete setup instructions
- [Database Connection](getting-started/HELP-ME-CONNECT-TO-DATABASE.md) - Connect to Supabase
- [Success Checklist](getting-started/SUCCESS-REFRESH-BROWSER-NOW.md) - Verify everything works

---

## 2. Architecture

**Understanding the system:**

- [Blueprint](blueprint.md) - Original design specifications
- [Data Model](merge-functions-guide.md) - Database schema and merge functions
- [Party Roles](history/status/PARTY-ROLES-IMPLEMENTATION-PLAN.md) - Contact and client role architecture

---

## 3. Features

### Core Features

- **[Agents](features/agents/)** - AI agent system for automated workflows
  - [Implementation](features/agents/AGENT-IMPLEMENTATION-README.md)
  - [Quickstart](features/agents/AGENT-QUICKSTART.md)
  - [Testing](features/agents/AGENT-TESTING-GUIDE.md)
  - [Chat Integration](features/agents/AGENT-COMPLETE-WITH-CHAT.md)

- **[Chat System](features/chat/)** - Conversational interface with RAG
  - [Capabilities](features/chat/CHAT-CAPABILITIES-EXPLAINED.md)
  - [RAG Setup](features/chat/CHAT-RAG-SETUP.md)
  - [Memory Setup](features/chat/CHAT-MEMORY-SETUP.md)
  - [Voice Chat](features/chat/VOICE-CHAT-IMPLEMENTATION.md)

- **[Cards & Kanban](features/cards-kanban/)** - Visual workflow management
  - [Card Review AI](features/cards-kanban/CARD-REVIEW-AI-PHASE-4.4-COMPLETE.md)
  - [Kanban Features](features/cards-kanban/CLICKABLE-CARDS-COMPLETE.md)

- **[Properties](features/properties/)** - Property management system
  - [System Overview](features/properties/PROPERTIES-SYSTEM.md)
  - [Implementation](features/properties/PROPERTIES-IMPLEMENTATION-COMPLETE.md)
  - [Property Units](features/properties/PROPERTY-UNITS-IMPLEMENTATION-COMPLETE.md)

### Business Features

- **[Case Management](features/case-management/)** - Case tracking and workflow
  - [Overview](features/case-management/CASE-MANAGEMENT-OVERVIEW.md)
  - [Guide](features/case-management/CASE-MANAGEMENT-GUIDE.md)
  - [Checklist](features/case-management/CASE-MANAGEMENT-CHECKLIST.md)

- **[Contacts](features/contacts/)** - Contact management
  - [System Complete](features/contacts/CONTACTS-SYSTEM-COMPLETE.md)
  - [Management Plan](features/contacts/CONTACTS-MANAGEMENT-PLAN.md)

- **[Invoicing](features/invoicing/)** - Billing and payment collection
  - [Module Design](features/invoicing/INVOICING-MODULE-DESIGN.md)
  - [Quick Start](features/invoicing/README.md)
  - [System Design](features/invoicing/INVOICING_SYSTEM_DESIGN.md)
  - [API Documentation](features/invoicing/API-ROUTES.md)
  - [SQL Reference](features/invoicing/INVOICING_SQL_REFERENCE.md)
  - [Testing Guide](features/invoicing/INVOICING_TESTING_GUIDE.md)

- **[Admin Panel](features/admin-panel/)** - Administrative controls
  - [Quickstart](features/admin-panel/ADMIN-PANEL-QUICKSTART.md)
  - [Phase 1](features/admin-panel/ADMIN_PANEL_PHASE1_README.md)
  - [Testing](features/admin-panel/ADMIN_PANEL_TESTING_GUIDE.md)

### Additional Features

- **[CRM](features/other/CRM-FEATURES.md)** - Customer relationship management
- **[Goals](features/other/GOALS-FEATURE-IMPLEMENTATION.md)** - Goal tracking
- **[Email](features/other/EMAIL-SETUP-GUIDE.md)** - Email integration
- **[Research System](features/other/RESEARCH-SYSTEM-COMPLETE.md)** - Research tools
- **[Workflow Fields](features/other/WORKFLOW-FIELDS-EDITABLE-NOW.md)** - Custom field configuration

---

## 4. Operations

### Database & Migrations

- [Migration Guide](operations/database-migrations/DATABASE-MIGRATION-GUIDE.md)
- [Supabase CLI](operations/database-migrations/SUPABASE-CLI-GUIDE.md)
- [Jobs System](operations/database-migrations/JOBS_SYSTEM_GUIDE.md)
- [RBAC Migration](operations/database-migrations/RBAC-MIGRATION-SUCCESS.md)
- [All Migrations](operations/database-migrations/)

### Data Imports

- [Historical Import Plan](operations/data-imports/HISTORICAL-IMPORT-PLAN.md)
- [CSV Imports](operations/data-imports/CSV-IMPORT-WITH-ROLES-COMPLETE.md)
- [Contacts Import](operations/data-imports/CONTACTS-IMPORT-COMPLETE-SUCCESS.md)
- [October Orders](operations/data-imports/OCTOBER-IMPORT-100-PERCENT-COMPLETE.md)
- [All Import Guides](operations/data-imports/)

### Production & Deployment

- [Production Readiness Plan](operations/production-deployment/PRODUCTION-READINESS-PLAN.md)
- [Production Quickstart](operations/production-deployment/PRODUCTION-QUICKSTART.md)
- [Vercel Deployment](operations/production-deployment/VERCEL-DEPLOYMENT-CHECKLIST.md)
- [Vercel MCP Setup](operations/production-deployment/VERCEL-MCP-SETUP.md)

---

## 5. Testing

**Testing guides and results:**

- [Testing Guide](testing/TESTING-GUIDE.md) - Main testing documentation
- [Quick Checklist](testing/QUICK-TEST-CHECKLIST.md) - Fast verification steps
- [CRM Testing](testing/CRM-TEST-GUIDE.md) - CRM feature tests
- [Goals Testing](testing/GOALS-TESTING-GUIDE.md) - Goals feature tests
- [Properties Testing](testing/PROPERTIES-TEST-REPORT.md) - Properties test results
- [E2E Testing](testing/E2E-PHASE-4-TESTING-GUIDE.md) - End-to-end test guide
- [All Test Results](testing/)

---

## 6. History & Status

**Project timeline and milestones:**

### Development Phases

- [Phase 0](history/phases/PHASE-0-CHECKLIST.md) - Foundation
- [Phase 1](history/phases/PHASE-1-COMPLETE.md) - Core features
- [Phase 2](history/phases/PHASE-2-COMPLETE.md) - Advanced features
- [Phase 3](history/phases/PHASE-3-COMPLETE.md) - Integration
- [Phase 4](history/phases/PHASE-4-COMPLETE.md) - AI features
- [Phase 5](history/phases/PHASE-5-COMPLETE.md) - Production ready

### Completion Summaries

- [Final Victory](history/completion-summaries/FINAL-VICTORY.md)
- [Complete Implementation](history/completion-summaries/COMPLETE-IMPLEMENTATION-SUMMARY.md)
- [All Features Working](history/completion-summaries/COMPLETE-SUCCESS-ALL-FEATURES-WORKING.md)
- [All Summaries](history/completion-summaries/)

### Status Updates

- [Current Status](history/status/CURRENT-STATUS.md)
- [Party Roles MVP](history/status/PARTY-ROLES-MVP-COMPLETE.md)
- [All Status Updates](history/status/)

---

## 7. Troubleshooting

**Common issues and solutions:**

### By Topic

- **Address Handling**
  - [Address Validation](troubleshooting/ADDRESS-VALIDATION-STATUS.md)
  - [Address Mapping](troubleshooting/ADDRESS-MAPPING-QUICK-START.md)
  - [Multi-line Support](troubleshooting/MULTI-LINE-ADDRESS-SUPPORT.md)

- **Client & Contact Issues**
  - [Client Matching](troubleshooting/CLIENT-MATCHING-FIX.md)
  - [Client Types](troubleshooting/CLIENT-TYPE-SOLUTION-COMPLETE.md)

- **Agent System**
  - [Agent Fixes](troubleshooting/FINAL-AGENT-FIX.md)
  - [AI Hallucination Fix](troubleshooting/AI-HALLUCINATION-FIX.md)

- **Email & Communication**
  - [Email Fixes](troubleshooting/EMAIL-FIXES-COMPLETE.md)
  - [Schedule Call Fix](troubleshooting/SCHEDULE-CALL-FIXED-VERIFIED.md)

- **System Issues**
  - [Next.js 15 Build](troubleshooting/NEXTJS-15-BUILD-FIX.md)
  - [Critical Issues](troubleshooting/CRITICAL-ISSUES-ASSESSMENT.md)
  - [All Troubleshooting](troubleshooting/)

---

## 8. Meta

**Documentation about documentation:**

- [CLAUDE.md](../CLAUDE.md) - Instructions for Claude Code AI assistant
- [Documentation Reorganization Log](../DOCUMENTATION-REORG-LOG.md) - History of this reorganization

---

## Document Status Legend

Documents are marked with status metadata:

- `status: current` - Active, maintained documentation
- `status: legacy` - Historical reference, may be outdated

Always check the `last_verified` date in the document frontmatter.

---

## Contributing to Docs

When adding or updating documentation:

1. Place detailed content under `docs/` in the appropriate category
2. Add YAML frontmatter with status and date
3. Update this index if adding new major sections
4. Link from root files (README.md, etc.) rather than duplicating content

---

**Last Updated:** 2025-11-15
**Total Documents:** ~215 organized files
