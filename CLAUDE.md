# Project Context for Claude Code

## Long-Term Memory (Vector Database)

**Primary memory system**: Use the MCP memory tools (`mcp__memory__*`) for persistent, searchable memory across sessions. See `~/.claude/CLAUDE.md` for auto-store/retrieve instructions.

- Semantic search finds relevant memories without keyword matching
- Memories tagged by project with global scope option
- Categories: decision, pattern, preference, lesson, context

**Legacy file-based memory** (still available):
- `.claude/memory/preferences.json` - Valuation preferences and standards
- `.claude/memory/market-conditions.json` - Current market data
- `.claude/memory/lessons-learned.json` - Past decisions and improvements

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
- **playwright-tester**: For automated browser testing after feature completion, never ask user to manually test
- **debugger-specialist**: For bug reproduction, root cause analysis, and surgical fixes when tests fail

### Agent Usage Guidelines
- Use agents proactively when their expertise matches the task
- Delegate to specialists rather than handling complex domain logic directly
- For multi-faceted tasks, use multiple agents in sequence or parallel
- Always use appraisal-expert when working on valuation or USPAP-related features

## Three-Agent Development Workflow

### Agent Responsibilities

**Main Development Agent (YOU)**
- Feature planning and implementation
- Writing business logic
- Creating new functionality
- Moving project forward
- Coordination between agents

**Playwright Tester Agent**
- Automated browser testing
- Comprehensive test execution
- Bug detection and reporting
- Test evidence collection
- Quality gatekeeping

**Debugger Specialist Agent**
- Bug reproduction and analysis
- Root cause diagnosis
- Surgical bug fixes
- Fix verification
- Issue resolution iteration

### Standard Development Cycle

```
┌─────────────────┐
│  Main Agent     │
│  Builds Feature │
└────────┬────────┘
         │
         ↓
┌─────────────────────┐
│ Playwright Tester   │
│ Tests Feature       │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
   ✅ Pass    ❌ Fail
    │         │
    │         ↓
    │    ┌──────────────────┐
    │    │ Debugger Agent   │
    │    │ Fixes Bugs       │
    │    └────────┬─────────┘
    │             │
    │             ↓
    │    ┌──────────────────┐
    │    │ Tester Re-tests  │
    │    └────────┬─────────┘
    │             │
    │        ┌────┴────┐
    │        │         │
    │        ↓         ↓
    │     ✅ Pass    ❌ Fail
    │        │         │
    │        │         └──→ (Iterate)
    │        │
    └────────┴────→ ✅ Complete
```

### Development Process

#### Step 1: Feature Development
```
# You (main agent) build the feature
"Implement user registration with email validation"
```

#### Step 2: Automated Testing
```
# Delegate to playwright-tester
Use Task tool with subagent_type: "playwright-tester"

Prompt: "Test user registration:
- Valid email submission
- Invalid email rejection
- Duplicate email handling
- Success redirect

App running at http://localhost:3000"
```

#### Step 3: Bug Resolution (if needed)
```
# Tester finds bugs, forwards to debugger
Use Task tool with subagent_type: "debugger-specialist"

Prompt: "Fix bugs from test report:

Bug 1: Email validation not working
- Expected: Invalid emails rejected
- Actual: All emails accepted
- Screenshot: [link]
- Console: TypeError at line 45

Bug 2: Duplicate email shows wrong error
- Expected: 'Email already exists'
- Actual: Generic 500 error"
```

#### Step 4: Re-verification
```
# Debugger fixes bugs, sends back to tester
# Tester re-runs all tests
# If pass → Report success
# If fail → Back to debugger
```

### Agent Communication Flow

- **Tester → Debugger**: Bug reports with evidence
- **Debugger → Tester**: Fix confirmations for re-test
- **Tester → Main**: Final pass/fail status
- **Main → User**: Feature completion announcement

### Rules for Main Agent

1. **Never skip testing**: Every feature goes to playwright-tester
2. **Don't debug yourself**: Let debugger agent handle test failures
3. **Stay focused**: Keep building while other agents test/debug
4. **Coordinate**: Ensure agents have info they need
5. **Report accurately**: Only claim completion after tester confirms

### Context Window Optimization

- **Main Agent**: 100K tokens for development
- **Tester Agent**: 100K tokens for test iterations
- **Debugger Agent**: 100K tokens for debug loops
- **Total Effective**: 300K tokens vs 100K single-agent

### Parallel Work Pattern

You can work on next feature while:
- Playwright-tester verifies previous feature
- Debugger-specialist fixes bugs from testing
- Each agent uses separate context window

### Example Session

```
10:00 AM - You build Feature A
           "Build login form"

10:20 AM - Delegate to tester
           /agent playwright-tester "Test login form..."

10:20 AM - You start Feature B (parallel work!)
           "Build user dashboard"

10:35 AM - Tester finds bugs in Feature A
           Auto-delegates to debugger

10:50 AM - You finish Feature B
           /agent playwright-tester "Test dashboard..."

10:55 AM - Debugger fixes Feature A bugs
           Re-tests automatically

11:00 AM - Tester confirms Feature A passing
           "✅ Login form complete"

11:15 AM - Tester confirms Feature B passing
           "✅ Dashboard complete"

11:15 AM - You report to user
           "Completed: Login form and user dashboard, fully tested"
```

### Testing Delegation Protocol

**CRITICAL: Never ask the user to manually test anything**

When feature implementation is complete:
- ✅ DO: Delegate to playwright-tester for automated verification
- ✅ DO: Let debugger-specialist handle any failures
- ✅ DO: Wait for final test results before claiming completion
- ✅ DO: Work on next feature while testing/debugging happens
- ❌ DON'T: Ask user to manually test
- ❌ DON'T: Debug test failures yourself (delegate to debugger-specialist)
- ❌ DON'T: Report feature complete without tester confirmation
- ❌ DON'T: Move to next task until tests pass

---

## Documentation Organization

### Documentation Structure

All detailed documentation lives under `docs/` in an organized hierarchy:

```
docs/
├── index.md                   # Central documentation index
├── getting-started/           # Setup and quickstart guides
├── architecture/              # System design and data model
├── features/                  # Feature documentation by category
│   ├── agents/               # AI agent system
│   ├── chat/                 # Chat interface
│   ├── cards-kanban/         # Kanban boards
│   ├── properties/           # Property management
│   ├── case-management/      # Case workflows
│   ├── contacts/             # Contact management
│   ├── admin-panel/          # Admin features
│   └── other/                # Additional features
├── operations/                # Database, imports, deployment
│   ├── database-migrations/  # Migration guides
│   ├── data-imports/         # Import procedures
│   └── production-deployment/ # Production ops
├── testing/                   # Test guides and results
├── history/                   # Historical docs
│   ├── phases/               # Development phases
│   ├── completion-summaries/ # Milestone reports
│   └── status/               # Progress updates
├── troubleshooting/          # Bug fixes and solutions
└── meta/                      # Documentation about docs
```

### Root Documentation Files

Three files remain in the root as entry points:

1. **README.md** - High-level project overview and quick start
2. **PROJECT-SUMMARY.md** - Executive summary with links to details
3. **CLAUDE.md** - Instructions for Claude Code (this file)

**These files should NOT contain detailed content.** They should link to docs/ for details.

### Documentation Conventions

**When adding or updating documentation:**

1. **Placement** - Put detailed content under `docs/` in the appropriate category
2. **Status Metadata** - Add YAML frontmatter to all docs:
   ```yaml
   ---
   status: current    # or "legacy" for historical docs
   last_verified: 2025-11-15
   updated_by: Claude Code
   ---
   ```
3. **Linking** - Link from root files (README.md, etc.) rather than duplicating content
4. **Index Updates** - Update `docs/index.md` when adding new major sections
5. **Historical Docs** - Mark outdated docs as `status: legacy` rather than deleting them

**Current vs Legacy:**
- `status: current` = Active, maintained documentation
- `status: legacy` = Historical reference, may be outdated

### Documentation Maintenance Instructions

**When reorganizing or adding documentation:**

1. **Create new docs in the appropriate `docs/` subfolder**
   - Feature docs → `docs/features/<category>/`
   - Setup guides → `docs/getting-started/`
   - Operations → `docs/operations/<subcategory>/`
   - Troubleshooting → `docs/troubleshooting/`

2. **Use git mv when moving existing files** to preserve history:
   ```bash
   git mv OLD-FILE.md docs/features/agents/
   ```

3. **Add frontmatter to all documentation files:**
   ```yaml
   ---
   status: current
   last_verified: YYYY-MM-DD
   updated_by: Claude Code
   ---
   ```

4. **Update docs/index.md** if adding new categories or major sections

5. **Keep root files lean** - README.md and PROJECT-SUMMARY.md should link to docs/, not duplicate content

### Finding Documentation

**For users:**
- Start with [docs/index.md](docs/index.md) for complete navigation
- Check [docs/troubleshooting/](docs/troubleshooting/) for common issues
- Browse by feature in [docs/features/](docs/features/)

**For Claude Code:**
- Read relevant docs from `docs/` before starting tasks
- Update docs when implementing features
- Mark docs as `status: legacy` when they become outdated
- Always check `last_verified` dates to assess doc freshness

