---
status: current
last_verified: 2025-11-15
updated_by: Claude Code
---

# Vercel Deployment Checklist - Card Review Feature

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
Ensure these are set in Vercel dashboard:
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `NEXT_PUBLIC_SUPABASE_URL` - Already configured
- `SUPABASE_SERVICE_ROLE_KEY` - Already configured

**How to verify:**
1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Confirm `ANTHROPIC_API_KEY` exists for Production, Preview, and Development
3. If missing, add it (same key you use locally from `.env.local`)

### 2. Dependencies
✅ **Already Installed** - These are in package.json:
- `@anthropic-ai/sdk@0.67.0` - Native Anthropic SDK
- `@supabase/ssr` - Database access

### 3. Code Changes Summary
**File**: `/src/app/api/agent/card-review/route.ts`

**Changes:**
- ✅ Switched from Vercel AI SDK to native Anthropic SDK
- ✅ Added `export const runtime = 'nodejs'` for proper streaming support
- ✅ Manual tool schema definition (no longer using broken `tool()` wrapper)
- ✅ Direct Anthropic API streaming with tool execution

### 4. Runtime Configuration
✅ **Configured**: The route now explicitly uses Node.js runtime
```typescript
export const runtime = 'nodejs';
export const maxDuration = 60;
```

## 🚀 Deployment Steps

### Option 1: Deploy via Git (Recommended)
```bash
git add .
git commit -m "fix: Switch card-review to native Anthropic SDK for tool calling"
git push origin main
```

Vercel will auto-deploy when you push to main.

### Option 2: Deploy via Vercel CLI
```bash
vercel --prod
```

## 🧪 Post-Deployment Testing

### 1. Test Basic Chat
1. Go to your production URL → `/agent`
2. Click "Review with AI Agent" on any card
3. Send: "Why did you suggest this card?"
4. ✅ **Expected**: AI responds with explanation

### 2. Test Tool Calling (CRITICAL)
1. Click "Review with AI Agent" on a card
2. Send: "Store this rule for me: Skip clients with no email"
3. ✅ **Expected**:
   - AI acknowledges storing the rule
   - Check database: `SELECT * FROM agent_memories WHERE scope = 'card_feedback' ORDER BY created_at DESC LIMIT 1;`
   - Should see new row with your rule

### 3. Check Logs
Go to Vercel dashboard → Your Project → Deployments → [Latest] → Logs

**Look for:**
- ✅ `[CardReview] Feedback stored successfully` - Tool executed
- ❌ `AI_APICallError` - Tool schema error (should NOT appear)

## ⚠️ Troubleshooting

### Issue: "Unauthorized" errors
**Fix**: Check that `ANTHROPIC_API_KEY` is set in Vercel environment variables

### Issue: Timeout errors
**Fix**: The route has `maxDuration = 60` (60 seconds). If it times out:
- Check your Vercel plan (Hobby plan: 10s max, Pro plan: 60s max)
- May need to upgrade to Pro plan

### Issue: Still getting tool schema errors
**Fix**: Clear Vercel build cache
```bash
vercel build --force
```

### Issue: No response from AI
**Fix**: Check Vercel logs for specific errors
1. Go to Vercel dashboard → Deployments → [Latest] → Functions
2. Click on `/api/agent/card-review`
3. Check the logs for error details

## 📊 Monitoring

After deployment, monitor:
1. **Vercel Logs** - Real-time errors and tool execution logs
2. **Database** - Check `agent_memories` table for stored feedback
3. **Response times** - Should be < 5 seconds for initial response

## 🔄 Rollback Plan

If deployment fails:
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

Or in Vercel dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## ✨ Success Criteria

The deployment is successful when:
- ✅ Chat interface responds to messages
- ✅ Tool calls execute (feedback stored in database)
- ✅ No API errors in Vercel logs
- ✅ Response times < 5 seconds

---

**Status**: Ready for deployment
**Last Updated**: 2025-11-11
**Breaking Change**: No (backward compatible - chat still works even if tools fail)
