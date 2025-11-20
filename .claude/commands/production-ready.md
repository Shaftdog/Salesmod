---
description: Run full production readiness workflow - code review, migrations, testing, and debugging
---

Orchestrate a complete production readiness workflow for: $ARGUMENTS

## Workflow Steps

Execute the following steps in order, using specialized agents:

### 1. Code Review (code-reviewer agent)
Review all code changes for:
- Code quality and best practices
- Security vulnerabilities (SQL injection, XSS, OWASP top 10)
- TypeScript type safety
- Performance issues
- USPAP compliance (if appraisal logic)
- Error handling
- Provide specific file:line references for any issues

### 2. Fix Issues
- Address all critical and high-priority issues from code review
- Make surgical fixes without breaking existing functionality
- Update code review status after fixes

### 3. Database Review (database-architect agent)
Review and validate:
- Any pending Prisma schema changes
- Migration files that need to be run
- Data integrity and constraints
- Query optimization opportunities
- Provide migration commands to run

### 4. Run Migrations
- Execute any required database migrations
- Verify migration success
- Check database state after migrations

### 5. Automated Testing (playwright-tester agent)
Test the feature/changes at http://localhost:3000:
- All user workflows and interactions
- Happy path scenarios
- Error conditions and validation
- Edge cases and boundary conditions
- Integration points
- Provide detailed test report with screenshots

### 6. Debug Failures (debugger-specialist agent if needed)
If tests fail:
- Delegate bug reports to debugger-specialist
- Let debugger make surgical fixes
- Re-run tests after fixes
- Iterate until all tests pass

### 7. Security Audit (security-auditor agent)
After all tests pass, perform comprehensive security review:
- Authentication and authorization flaws
- SQL injection vulnerabilities
- XSS and CSRF vulnerabilities
- Sensitive data exposure
- Security misconfigurations
- API security issues
- Dependency vulnerabilities
- OWASP Top 10 compliance
- Provide specific file:line references for any security issues
- Fix all critical and high-severity security issues before proceeding

### 8. Final Verification
- Confirm all code review issues resolved
- Confirm all migrations run successfully
- Confirm all tests passing
- Confirm all security audit issues resolved
- Generate production readiness report

### 9. Git Operations
Once everything passes:
- Commit changes with descriptive message
- Push to branch: claude/gmail-agent-card-workflow-013RDtjAPefARTTLHFcLhApt
- Use git push -u origin <branch-name>
- Retry up to 4 times with exponential backoff if network errors

## Success Criteria

Only report production ready when:
- ✅ Zero critical/high priority code review issues
- ✅ All migrations run successfully
- ✅ All automated tests passing
- ✅ Zero critical/high severity security vulnerabilities
- ✅ No console errors or warnings
- ✅ Changes committed and pushed to branch

## Output

Provide a final summary with:
- Code review status and issues resolved
- Migrations run
- Test results (pass/fail counts)
- Security audit status and issues resolved
- Commit hash and branch
- Ready for Vercel deployment: YES/NO
