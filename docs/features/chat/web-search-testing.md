---
status: current
last_verified: 2025-11-18
updated_by: Claude Code
---

# Web Search Testing Guide

This document provides testing procedures for the web search functionality in the chat agent.

## Pre-Testing Setup

### 1. Configure API Key

```bash
# Add to .env.local
echo "TAVILY_API_KEY=tvly-your-api-key-here" >> .env.local

# Restart the development server
npm run dev
```

### 2. Verify Integration

Check that the following files have been updated:

- ✅ `src/lib/agent/anthropic-tool-registry.ts` - searchWeb tool defined
- ✅ `src/lib/agent/anthropic-tool-executor.ts` - searchWeb executor implemented
- ✅ `src/app/api/agent/chat-direct/route.ts` - Web Search in system prompt
- ✅ `.env.example` - TAVILY_API_KEY documented

## Manual Testing

### Test 1: Tool Available Without API Key

1. **Setup**: Do NOT configure TAVILY_API_KEY
2. **Navigate**: Go to the chat interface
3. **Action**: Ask "Search the web for current mortgage rates"
4. **Expected**: Agent responds with helpful error message:
   ```
   "Web search is not configured. Please add TAVILY_API_KEY to environment variables."
   "Get your free API key at https://tavily.com"
   ```
5. **Result**: ✅ PASS / ❌ FAIL

### Test 2: Basic Web Search

1. **Setup**: Configure TAVILY_API_KEY in .env.local
2. **Restart**: `npm run dev`
3. **Navigate**: Go to the chat interface
4. **Action**: Ask "What are the current mortgage rates in Florida?"
5. **Expected**:
   - Agent uses searchWeb tool
   - Returns 3-5 search results
   - Includes answer summary
   - Shows URLs and excerpts
6. **Result**: ✅ PASS / ❌ FAIL

### Test 3: Market Research

1. **Action**: Ask "Search for recent Florida housing market trends"
2. **Expected**:
   - Agent performs web search
   - Returns current market information
   - Cites sources with URLs
3. **Result**: ✅ PASS / ❌ FAIL

### Test 4: Industry Research

1. **Action**: Ask "Find best practices for residential appraisals"
2. **Expected**:
   - Agent searches for appraisal best practices
   - Returns relevant industry information
   - Provides actionable insights
3. **Result**: ✅ PASS / ❌ FAIL

### Test 5: Parameter Handling

1. **Action**: Ask "Search for property values in Tampa, show me 10 results"
2. **Expected**:
   - Agent respects maxResults parameter
   - Returns up to 10 results (or fewer if less available)
   - Results are relevant to query
3. **Result**: ✅ PASS / ❌ FAIL

### Test 6: Error Recovery

1. **Setup**: Use invalid API key
2. **Action**: Ask for a web search
3. **Expected**:
   - Agent receives API error
   - Returns meaningful error message
   - Suggests checking API key
4. **Result**: ✅ PASS / ❌ FAIL

## Automated Testing

### Backend Integration Test

```bash
# Test the searchWeb tool executor directly
npm run test:web-search
```

**Expected Output:**
```
🔍 Testing Web Search Tool Integration

📋 Test 1: Execute without API key (should show helpful error)
✅ PASS: Returns helpful error when API key not configured

📋 Test 2: Execute with API key (if configured)
✅ PASS: Successfully retrieved 3 results

📋 Test 3: Parameter validation
✅ PASS: Max results properly limited

🏁 Web Search Tool Tests Complete
```

### Unit Tests

Located in `scripts/test-web-search.ts`:

- ✅ Verifies tool is registered
- ✅ Tests executor without API key
- ✅ Tests executor with API key (if available)
- ✅ Validates parameter limits
- ✅ Checks error handling

## API Response Validation

### Success Response Schema

```typescript
{
  success: true,
  query: string,
  answer: string | null,
  results: Array<{
    title: string,
    url: string,
    content: string,
    score: number
  }>,
  resultsCount: number,
  message: string
}
```

### Error Response Schema

```typescript
{
  error: string,
  suggestion?: string,
  query?: string
}
```

## Performance Testing

### Response Time

- **Basic search**: Should complete in 1-3 seconds
- **Advanced search**: May take 3-5 seconds
- **API timeout**: Set to 30 seconds (default Tavily limit)

### Rate Limiting

- **Free tier**: 1,000 searches/month
- **No per-second limit** on free tier
- **Monitor usage** via Tavily dashboard

## Integration Testing with Chat Flow

### End-to-End Test

1. **Start chat session**
2. **Ask**: "What's the current state of the Florida real estate market?"
3. **Verify**:
   - Agent recognizes need for web search
   - Uses searchWeb tool automatically
   - Integrates results into response
   - Cites sources properly
4. **Follow-up**: "Can you search for more information about Tampa specifically?"
5. **Verify**:
   - Agent performs refined search
   - Results are more specific
   - Maintains conversation context

## Common Issues & Solutions

### Issue: "Tool not found" error

**Cause**: Tool registry not properly loaded

**Solution**:
1. Verify tool in `anthropic-tool-registry.ts`
2. Restart dev server
3. Clear Next.js cache: `rm -rf .next`

### Issue: Empty results

**Cause**: Query too specific or API issue

**Solution**:
1. Try broader search terms
2. Check Tavily API status
3. Review API logs for errors

### Issue: Slow responses

**Cause**: Network latency or advanced search depth

**Solution**:
1. Use `searchDepth: 'basic'` for faster results
2. Reduce `maxResults` parameter
3. Check network connection

### Issue: API quota exceeded

**Cause**: Exceeded 1,000 searches/month free tier

**Solution**:
1. Check Tavily dashboard for usage
2. Upgrade to paid tier if needed
3. Implement search result caching

## Test Results Log

| Date | Tester | Test Case | Result | Notes |
|------|--------|-----------|--------|-------|
| 2025-11-18 | Claude | Integration | ✅ | Initial implementation |
| | | | | |

## Next Steps

After successful testing:

1. ✅ Verify all test cases pass
2. ✅ Document any issues found
3. ✅ Update user documentation
4. ✅ Add monitoring/analytics
5. ✅ Consider implementing caching
6. ✅ Add usage tracking

## Related Documentation

- [Web Search Feature Overview](./web-search.md)
- [Chat Agent Architecture](../agents/README.md)
- [Tool System Documentation](../agents/tools.md)
- [Environment Setup](../../getting-started/setup.md)
