---
status: current
last_verified: 2025-11-18
updated_by: Claude Code
---

# Web Search Feature for Chat Agent

The chat agent can now search the internet for current information, news, market trends, and industry data.

## Overview

The `searchWeb` tool allows the AI agent to fetch real-time information from the internet using the Tavily Search API. This is useful for:

- Getting current mortgage rates and market trends
- Researching industry best practices
- Finding up-to-date news and information
- Looking up current property values or market conditions
- Researching competitors or market data

## Setup

### 1. Get a Tavily API Key

1. Visit [https://tavily.com](https://tavily.com)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes 1,000 searches per month

### 2. Configure Environment Variables

Add your Tavily API key to your `.env.local` file:

```bash
# Copy .env.example if you haven't already
cp .env.example .env.local

# Add your Tavily API key
echo "TAVILY_API_KEY=tvly-your-api-key-here" >> .env.local
```

### 3. Restart the Development Server

```bash
npm run dev
```

## Usage

The chat agent will automatically use the `searchWeb` tool when it needs current information. You can ask questions like:

- "What are the current mortgage rates in Florida?"
- "Search for recent news about the housing market"
- "What are the latest trends in property appraisals?"
- "Find information about comparable properties in Miami"

## Tool Parameters

The `searchWeb` tool accepts the following parameters:

- **query** (required): Search query string
- **maxResults** (optional): Number of results to return (default: 5, max: 10)
- **searchDepth** (optional): Search depth
  - `basic`: Quick results (default)
  - `advanced`: More comprehensive search

## Response Format

The tool returns:

```json
{
  "success": true,
  "query": "current mortgage rates 2025",
  "answer": "As of November 2025, mortgage rates are...",
  "results": [
    {
      "title": "Article Title",
      "url": "https://example.com/article",
      "content": "Relevant excerpt from the article...",
      "score": 0.95
    }
  ],
  "resultsCount": 5,
  "message": "Found 5 results for: \"current mortgage rates 2025\""
}
```

## Error Handling

If the API key is not configured, the tool will return a helpful error:

```json
{
  "error": "Web search is not configured. Please add TAVILY_API_KEY to environment variables.",
  "suggestion": "Get your free API key at https://tavily.com"
}
```

## Technical Details

### Implementation Files

- **Tool Registry**: `src/lib/agent/anthropic-tool-registry.ts`
  - Defines the `searchWeb` tool schema for Anthropic SDK
- **Tool Executor**: `src/lib/agent/anthropic-tool-executor.ts`
  - Implements the Tavily API integration
- **Chat API**: `src/app/api/agent/chat-direct/route.ts`
  - Includes web search in system prompt capabilities

### API Integration

The implementation uses the [Tavily Search API](https://docs.tavily.com/):

- **Endpoint**: `https://api.tavily.com/search`
- **Method**: POST
- **Features**:
  - Optimized for AI applications
  - Clean, structured responses
  - Direct answer extraction
  - Relevance scoring
  - No rate limiting on free tier (up to 1,000 searches/month)

## Examples

### Basic Search

**User**: "What's the latest news about Florida real estate?"

**Agent**: Uses `searchWeb` with query "Florida real estate news 2025"

**Result**: Gets current articles and news about the Florida real estate market

### Market Research

**User**: "I need to research comparable properties in Tampa"

**Agent**: Uses `searchWeb` with query "Tampa comparable property sales 2025"

**Result**: Gets recent sales data and market information

### Industry Trends

**User**: "What are the current best practices for residential appraisals?"

**Agent**: Uses `searchWeb` with query "residential appraisal best practices 2025"

**Result**: Gets current industry standards and guidelines

## Limitations

- **Free Tier**: 1,000 searches per month
- **Rate Limits**: No specific rate limits on free tier
- **Search Quality**: Depends on Tavily's search quality
- **Real-time Data**: Results may be cached for a few minutes

## Troubleshooting

### "Web search is not configured" Error

**Cause**: TAVILY_API_KEY environment variable is not set

**Solution**:
1. Get API key from https://tavily.com
2. Add to `.env.local`
3. Restart the development server

### Search Returns No Results

**Cause**: Query may be too specific or API error

**Solution**:
1. Try a broader search query
2. Check Tavily API status
3. Verify API key is valid

### API Error Responses

**Cause**: Invalid API key or service issues

**Solution**:
1. Verify API key in `.env.local`
2. Check Tavily API status page
3. Review API logs for error details

## Future Enhancements

Potential improvements for the web search feature:

- [ ] Cache search results to reduce API calls
- [ ] Add domain filtering (e.g., only search .gov sites)
- [ ] Implement search history tracking
- [ ] Add cost tracking and usage analytics
- [ ] Support for image search
- [ ] Integration with property databases
- [ ] Custom search filters for appraisal-specific data

## Related Documentation

- [Chat Agent Architecture](../agents/README.md)
- [Tool System Overview](../agents/tools.md)
- [Environment Configuration](../../getting-started/setup.md)
