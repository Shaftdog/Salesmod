# Project Context for Claude Code

## Agent Memory
Agents should read/update files in `.claude/memory/`:
- `preferences.json` - My valuation preferences and standards
- `market-conditions.json` - Current market data
- `lessons-learned.json` - Past decisions and improvements

## Project-Specific Instructions

### Salesmod (Appraisal Software)
This is a Next.js application for residential appraisal workflow management:
- Properties, Orders, Clients, Comparables
- Automated agent system for outreach and follow-ups
- Goal tracking and CRM features
- Integration with Supabase and various APIs

## Code Standards
- TypeScript strict mode
- Tailwind CSS for styling
- Prisma for database
- Zod for validation
- React Hook Form for forms
- Next.js 15 App Router

## Testing Requirements
- Unit tests for all business logic
- Integration tests for API routes
- E2E tests for critical paths
- Minimum 80% coverage

## USPAP Compliance
When working on appraisal logic:
- Follow Standards Rules 1 & 2
- Document all adjustments
- Ensure proper comparable selection
- Maintain audit trail

## Agent System (Application Architecture)
- Orchestrator coordinates workflow
- Context builder aggregates business data
- Planner creates strategic action plans
- Executor handles card execution
- Tools provide chat interface capabilities

## Claude Code Sub-Agents
Use specialized sub-agents via the Task tool for focused expertise:

### When to Use Sub-Agents
- **appraisal-expert**: For USPAP compliance, valuation logic, adjustment calculations, Florida market analysis
- **backend-architect**: For API design, database schema, Next.js architecture, scalability planning
- **code-reviewer**: After completing significant code changes, before committing major features
- **testing-specialist**: For test strategy, writing test suites, improving coverage
- **security-auditor**: When handling auth, payments, sensitive data, or reviewing security
- **frontend-specialist**: For React components, UI/UX, accessibility, responsive design
- **documentation-writer**: For README updates, API docs, technical documentation
- **database-architect**: For Prisma schema changes, query optimization, data modeling

### Agent Usage Guidelines
- Use agents proactively when their expertise matches the task
- Delegate to specialists rather than handling complex domain logic directly
- For multi-faceted tasks, use multiple agents in sequence or parallel
- Always use appraisal-expert when working on valuation or USPAP-related features
