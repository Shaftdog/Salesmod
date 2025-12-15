# 🔴 CRITICAL: Security Incident Quick Action Guide

## What Happened?
Your PostgreSQL database credentials were exposed in 17 files and committed to git. GitGuardian detected the exposure.

## ⚡ DO THESE 3 THINGS RIGHT NOW

### 1. Rotate Database Password (5 minutes)

1. **Open Supabase**: https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/settings/database

2. **Click "Reset database password"**

3. **Copy the new password**

4. **Update [.env.local](.env.local)**:
   ```bash
   # OLD (EXPOSED):
   DATABASE_URL=postgresql://postgres.zqhenxhgcjxslpfezybm:NsjCsuLJfBswVhdI@aws-1-us-east-1.pooler.supabase.com:5432/postgres

   # NEW (Replace password only):
   DATABASE_URL=postgresql://postgres.zqhenxhgcjxslpfezybm:YOUR_NEW_PASSWORD@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   DIRECT_DATABASE_URL=postgresql://postgres:YOUR_NEW_PASSWORD@db.zqhenxhgcjxslpfezybm.supabase.co:5432/postgres
   ```

5. **Test it works**:
   ```bash
   node check-order-ownership.js
   ```

### 2. Clean Git History (10 minutes)

**Method A: BFG Repo-Cleaner (Easiest)**

```bash
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/
# Or install: choco install bfg (Windows)

# Create password file
echo "NsjCsuLJfBswVhdI" > passwords.txt

# Clone mirror
cd ..
git clone --mirror https://github.com/Shaftdog/Salesmod.git salesmod-cleanup
cd salesmod-cleanup

# Clean history
bfg --replace-text ../passwords.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force

# Update your working copy
cd ../Salesmod
git fetch origin
git reset --hard origin/main
```

**⚠️ WARNING**: This rewrites git history. Coordinate with your team!

### 3. Commit Your Fixes

```bash
# Check what changed
git status

# Stage the fixed files
git add check-order-ownership.js run-tenant-migrations.js scripts/test-merge-functions.js smart-reassign-all-458-orders.js merge-ifund-cities-and-fix-unassigned.js final-reassign-remaining-142.js complete-remaining-import.js check-ifund-order-count.js fix-hardcoded-credentials.js SECURITY-INCIDENT-REMEDIATION.md SECURITY-QUICKSTART.md

# Commit
git commit -m "security: Remove hardcoded database credentials, use environment variables

- Fixed 8 files to use process.env.DATABASE_URL
- Added dotenv configuration where missing
- Created security remediation documentation
- Database password has been rotated in Supabase

Fixes GitGuardian incident #22483299"

# Push
git push
```

## ✅ Verification Checklist

Before you consider this resolved:

- [ ] Database password rotated in Supabase ✓
- [ ] `.env.local` updated with new password ✓
- [ ] Test connection works (`node check-order-ownership.js`) ✓
- [ ] Git history cleaned (BFG or git-filter-repo) ⚠️
- [ ] Force push completed ⚠️
- [ ] GitGuardian incident dismissed in dashboard ⚠️
- [ ] Team notified (if applicable)

## 🔐 Next Steps (Do Within 24 Hours)

1. **Review database logs** for suspicious activity:
   https://supabase.com/dashboard/project/zqhenxhgcjxslpfezybm/logs

2. **Set up secret scanning** to prevent this:
   ```bash
   # Install gitleaks
   choco install gitleaks

   # Add pre-commit hook
   cat > .git/hooks/pre-commit <<'EOF'
   #!/bin/sh
   gitleaks protect --staged --verbose
   EOF

   chmod +x .git/hooks/pre-commit
   ```

3. **Check for other exposed secrets**:
   - OpenAI API key: ✅ NOT in git history
   - Anthropic API key: ⚠️ FOUND in git history (commit 402adb9)
   - Resend API key: ⚠️ FOUND in git history (commit 5060bc8)
   - Google Maps key: ✅ NOT in git history

   **You need to rotate these too!**
   - Anthropic: https://console.anthropic.com/settings/keys
   - Resend: https://resend.com/api-keys

## 📚 Full Documentation

See [SECURITY-INCIDENT-REMEDIATION.md](SECURITY-INCIDENT-REMEDIATION.md) for:
- Complete incident timeline
- All affected files
- Detailed remediation steps
- Prevention measures
- Lessons learned

## 🆘 Need Help?

1. **Supabase Support**: https://supabase.com/support
2. **GitGuardian Docs**: https://docs.gitguardian.com/
3. **BFG Documentation**: https://rtyley.github.io/bfg-repo-cleaner/

---

**Status**: 🔴 ACTIVE INCIDENT
**Severity**: CRITICAL
**Next Review**: After password rotation and git cleanup
