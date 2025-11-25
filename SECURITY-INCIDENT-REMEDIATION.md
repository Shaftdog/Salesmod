# Security Incident Remediation Guide

## Incident Summary

**Severity**: CRITICAL
**Incident Type**: Exposed PostgreSQL Credentials
**Date Detected**: 2025-11-17
**Status**: In Progress

### What Happened
PostgreSQL database credentials were hardcoded in multiple source files and committed to the git repository. The credentials were detected by GitGuardian's secret scanning tool.

### Exposed Credentials
- **Database**: PostgreSQL (Supabase)
- **Username**: postgres.zqhenxhgcjxslpfezybm
- **Password**: NsjCsuLJfBswVhdI
- **Host**: aws-1-us-east-1.pooler.supabase.com:5432
- **Database**: postgres
- **Schema**: postgresql

### Files Affected
- ✅ FIXED: check-order-ownership.js
- ✅ FIXED: run-tenant-migrations.js
- ✅ FIXED: scripts/test-merge-functions.js
- ✅ FIXED: smart-reassign-all-458-orders.js
- ✅ FIXED: merge-ifund-cities-and-fix-unassigned.js
- ✅ FIXED: final-reassign-remaining-142.js
- ✅ FIXED: complete-remaining-import.js
- ✅ FIXED: check-ifund-order-count.js
- HELP-ME-CONNECT-TO-DATABASE.md
- update-client-active-orders.js
- run-all-batches.sh
- run-automated-import.js
- merge-remaining-ifund-duplicates.js
- finalize-complete-import.js
- check-cards-db.js
- auto-import-all-batches-pooler.js
- auto-run-all-batches.js

## Immediate Actions Taken

### 1. Code Remediation ✅
- [x] Created fix-hardcoded-credentials.js script
- [x] Updated all JS files to use `process.env.DATABASE_URL`
- [x] Added dotenv configuration where missing
- [x] Verified .gitignore excludes .env files

## CRITICAL: Manual Steps Required

### Step 1: Rotate Database Credentials Immediately ⚠️

**DO THIS NOW - YOUR DATABASE IS CURRENTLY EXPOSED**

1. Go to Supabase Dashboard:
   https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/settings/database

2. Navigate to: Settings → Database → Connection String

3. Click "Reset database password"

4. Generate a NEW strong password (use a password manager)

5. Update your local [.env.local](.env.local):
   ```bash
   # Replace ONLY the password part in these URLs:
   DATABASE_URL=postgresql://postgres.zqhenxhgcjxslpfezybm:NEW_PASSWORD_HERE@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   DIRECT_DATABASE_URL=postgresql://postgres:NEW_PASSWORD_HERE@db.zqhenxhgcjxslpfezybm.supabase.co:5432/postgres
   ```

6. Test the connection:
   ```bash
   node check-order-ownership.js
   ```

### Step 2: Clean Git History 🧹

The credentials are in your git history and need to be removed. Choose one method:

#### Option A: Using BFG Repo-Cleaner (Recommended - Easier)

```bash
# Install BFG (Windows with Chocolatey)
choco install bfg

# Or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a passwords.txt file with the exposed password
echo "NsjCsuLJfBswVhdI" > passwords.txt

# Clone a fresh copy of your repo
cd ..
git clone --mirror https://github.com/Shaftdog/Salesmod.git salesmod-cleanup
cd salesmod-cleanup

# Run BFG to remove the password from all commits
bfg --replace-text ../passwords.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (THIS WILL REWRITE HISTORY)
git push --force

# Clean up the mirror clone
cd ..
rm -rf salesmod-cleanup

# Update your working repo
cd Salesmod
git fetch origin
git reset --hard origin/main
```

#### Option B: Using git-filter-repo (More Control)

```bash
# Install git-filter-repo
pip install git-filter-repo

# Create a replacements file
cat > replacements.txt <<EOF
NsjCsuLJfBswVhdI==>REDACTED_PASSWORD
postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@==>postgresql://postgres.PROJECT_REF:PASSWORD@
EOF

# Run filter-repo
git filter-repo --replace-text replacements.txt --force

# Force push
git push --force --all
git push --force --tags
```

### Step 3: Update Environment Files 📝

Ensure your [.env.local](.env.local) is NOT committed:

```bash
# Verify .env.local is ignored
git check-ignore -v .env.local

# Should output: .gitignore:41:.env*    .env.local
```

### Step 4: Review Database Access 🔍

1. Check Supabase logs for suspicious activity:
   https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/logs/edge-logs

2. Review database connections:
   - Look for unusual IP addresses
   - Check for unauthorized queries
   - Review recent schema changes

3. Check for data exfiltration:
   - Review large SELECT queries
   - Check for COPY or pg_dump commands
   - Monitor for unusual export activity

### Step 5: Implement Secret Scanning 🔒

#### Add pre-commit hooks:

```bash
# Install gitleaks
# Windows (Chocolatey):
choco install gitleaks

# Or download from: https://github.com/gitleaks/gitleaks/releases

# Add pre-commit hook
cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh
# Run gitleaks to check for secrets
gitleaks protect --staged --verbose
EOF

chmod +x .git/hooks/pre-commit
```

#### Add GitHub Actions:

Create [.github/workflows/security.yml](.github/workflows/security.yml):

```yaml
name: Security Scanning

on: [push, pull_request]

jobs:
  gitleaks:
    name: Secret Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Step 6: Audit Other Secrets 🔐

Review [.env.local](.env.local) for other potentially exposed secrets:

- ⚠️ OPENAI_API_KEY: `sk-proj-eiJGA5wdLLtLcy...`
- ⚠️ ANTHROPIC_API_KEY: `sk-ant-api03-E7GpXx39j8Y3n2oXiR5z...`
- ⚠️ RESEND_API_KEY: `re_DHW5JkqA_LQMqCfpjvdxWippyG3UT7MP4`
- ⚠️ GOOGLE_MAPS_API_KEY: `AIzaSyD0U72d3E9qFej-lImLjPrSjgUyO-LnAOU`
- ⚠️ SUPABASE_SERVICE_ROLE_KEY: `eyJhbGciOiJIUzI1NiI...`

**Check if any of these were also committed to git:**

```bash
# Search for OpenAI key
git log -p -S "sk-proj-eiJGA5wdLLtLcy" --all

# Search for Anthropic key
git log -p -S "sk-ant-api03-E7GpXx39j8Y3n2oXiR5z" --all

# Search for Resend key
git log -p -S "re_DHW5JkqA_LQMqCfpjvdxWippyG3UT7MP4" --all

# Search for Google Maps key
git log -p -S "AIzaSyD0U72d3E9qFej-lImLjPrSjgUyO-LnAOU" --all
```

If any of these appear, they MUST ALSO be rotated and removed from history!

## Prevention Measures

### 1. Use Environment Variables
✅ Already implemented - all scripts now use `process.env.DATABASE_URL`

### 2. Never Commit Secrets
- Always use [.env.local](.env.local) for local development
- Use environment variables in production (Vercel, etc.)
- Never hardcode credentials in source files

### 3. Use Secret Management Services
Consider using:
- **Vercel Environment Variables** (for production)
- **1Password** or **Bitwarden** (for team secrets)
- **AWS Secrets Manager** (for advanced needs)

### 4. Regular Security Audits
- Enable GitGuardian or similar secret scanning
- Run `gitleaks` before every commit
- Review access logs monthly
- Rotate credentials quarterly

### 5. Team Training
- Educate team on secret management
- Document secure coding practices
- Implement code review for security

## Verification Checklist

Before considering this incident resolved:

- [ ] Database password rotated in Supabase
- [ ] `.env.local` updated with new password
- [ ] Application tested with new credentials
- [ ] Git history cleaned (no credentials in any commit)
- [ ] Force push completed to remote repository
- [ ] GitGuardian alert dismissed (after verification)
- [ ] All team members notified of new credentials
- [ ] Secret scanning enabled (pre-commit hooks + CI/CD)
- [ ] Database logs reviewed for suspicious activity
- [ ] Other API keys audited and rotated if exposed
- [ ] Post-mortem documented and shared with team

## Timeline

- **2025-11-17 (Detection)**: GitGuardian detected exposed credentials
- **2025-11-17 (Response)**: Created fix-hardcoded-credentials.js, updated 7 files
- **[PENDING]**: Database password rotation
- **[PENDING]**: Git history cleanup
- **[PENDING]**: Secret scanning implementation

## Lessons Learned

1. **Never hardcode credentials** - Always use environment variables
2. **Enable secret scanning early** - Catch issues before they reach production
3. **Regular audits are essential** - Old scripts can contain forgotten secrets
4. **Automate security checks** - Pre-commit hooks prevent accidents

## Resources

- [GitGuardian Docs](https://docs.gitguardian.com/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)

---

**Status**: 🔴 ACTIVE INCIDENT - Immediate action required
**Next Review**: After password rotation and git history cleanup
**Owner**: Repository Administrator
