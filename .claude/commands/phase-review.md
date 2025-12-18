---
description: Run full phase review workflow - architecture governance, code review, migrations, testing, and security audit
---

Run a comprehensive phase review workflow for: $ARGUMENTS

## Preflight

Before starting gates:
1. Run `git status` and `git diff --stat` to understand scope
2. Identify plan/architecture documents from $ARGUMENTS or search `docs/` for relevant files
3. Summarize what's being reviewed

## Workflow Gates

Execute gates sequentially. If a gate has blockers, fix them before proceeding.

### Gate A: Architecture Review (system-architect agent)

Review phase plan and codebase for architectural alignment:
- Read source-of-truth docs: `docs/ARCHITECTURE-tenancy.md`, `docs/SERVICE-ROLE-AUDIT.md`
- Verify tenant_id isolation patterns in any new/modified tables
- Check service-role usage is justified and manually tenant-scoped
- Validate alignment with `docs/features/agents/AGENT-IMPLEMENTATION-README.md`
- Review `.claude/memory/lessons-learned.json` for relevant patterns

Output: Architectural Alignment Review with Verdict (Approved / Concerns / Blocked)

**If Blocked**: STOP and report blockers. Do not proceed until architecture issues are resolved.

### Gate B: Code Review (code-reviewer agent)

Review all code changes:
- Code quality and best practices
- TypeScript type safety
- Security vulnerabilities (OWASP top 10)
- Error handling patterns
- Provide specific file:line references for issues
- Categorize as Critical/High/Medium/Low

### Gate C: Fix Loop (debugger-specialist agent)

If Gate B found Critical or High issues:
1. Delegate to debugger-specialist to fix each issue
2. After fixes, run: `npm run lint` and `npm run typecheck`
3. If lint/typecheck fail, fix and re-run
4. Re-run code-reviewer for quick verification pass
5. Repeat until no Critical/High issues remain

### Gate D: Database Review (database-architect agent)

Review and apply migrations:
1. Run `node scripts/run-migration.js --check` to see pending migrations
2. Review migration files for:
   - Proper naming (YYYYMMDD_description.sql)
   - tenant_id columns with RLS policies
   - IF EXISTS/IF NOT EXISTS for idempotency
3. Apply pending migrations: `node scripts/run-migration.js`
4. Re-check migration status
5. Verify database state is consistent

### Gate E: Test Review (testing-specialist agent)

Run backend/unit/integration tests:
1. Review testing plan from phase docs (or create one if missing)
2. Run: `npm run test` (vitest)
3. If failures:
   - Delegate to debugger-specialist or database-architect depending on failure type
   - Re-run tests after fixes
   - Repeat until all tests pass
4. Report test coverage and results

### Gate F: UI/E2E Tests (playwright-tester agent)

Run browser automation tests:
1. Ensure dev server is running at http://localhost:9002
2. Run: `npm run test:e2e` (playwright)
3. Test all user workflows affected by the phase
4. If failures:
   - Coordinate fixes with frontend-specialist, backend-architect, or debugger-specialist
   - Re-run E2E tests after fixes
   - Repeat until all E2E tests pass
5. Provide screenshots and detailed test report

### Gate G: Security Audit (security-auditor agent)

Final security review:
- Auth/authz patterns
- RLS policy coverage
- Service-role usage audit
- Secrets scanning (no hardcoded credentials)
- Input validation and sanitization
- OWASP basics

**If security issues require code fixes**:
1. Loop back to Gate C (Fix Loop)
2. Then re-run Gate E (Tests) and Gate F (E2E)
3. Then re-run Gate G (Security)

## Phase Review Report

After all gates pass, output:

```
## Phase Review Report: [Phase Name]

**Overall Status**: PHASE COMPLETE: YES/NO

### Gate Results
| Gate | Status | Notes |
|------|--------|-------|
| A. Architecture | Pass/Fail | [summary] |
| B. Code Review | Pass/Fail | [summary] |
| C. Fix Loop | Pass/Fail | [fixes applied] |
| D. Database | Pass/Fail | [migrations status] |
| E. Tests | Pass/Fail | [pass/fail counts] |
| F. E2E | Pass/Fail | [pass/fail counts] |
| G. Security | Pass/Fail | [summary] |

### Summary
[2-3 sentences on phase status]

### Remaining Issues (if any)
[List any non-blocking issues deferred]
```

## Important Notes

- Do NOT commit or push changes unless user explicitly requests
- All agents should cite file:line references
- Fix loops should iterate until passing (reasonable limit: 5 iterations per gate)
- If a gate cannot pass after iterations, report and ask for user guidance
