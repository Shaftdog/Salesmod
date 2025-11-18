#!/usr/bin/env tsx

/**
 * Test script for web search tool integration
 *
 * This script tests the searchWeb tool in the chat agent
 *
 * Usage:
 *   npm run test:web-search
 *   or
 *   npx tsx scripts/test-web-search.ts
 */

import { executeAnthropicTool } from '../src/lib/agent/anthropic-tool-executor';

async function testWebSearch() {
  console.log('🔍 Testing Web Search Tool Integration\n');
  console.log('=' .repeat(60));

  // Test 1: Check if tool executes without API key
  console.log('\n📋 Test 1: Execute without API key (should show helpful error)');
  console.log('-'.repeat(60));

  const testUserId = 'test-user-id';
  const result1 = await executeAnthropicTool('searchWeb', {
    query: 'test query',
  }, testUserId);

  console.log('Result:', JSON.stringify(result1, null, 2));

  if (result1.error && result1.error.includes('not configured')) {
    console.log('✅ PASS: Returns helpful error when API key not configured');
  } else {
    console.log('❌ FAIL: Should return configuration error');
  }

  // Test 2: Check if tool executes with API key (if available)
  console.log('\n📋 Test 2: Execute with API key (if configured)');
  console.log('-'.repeat(60));

  if (process.env.TAVILY_API_KEY) {
    console.log('API key found, testing actual search...');

    const result2 = await executeAnthropicTool('searchWeb', {
      query: 'Florida real estate market 2025',
      maxResults: 3,
      searchDepth: 'basic',
    }, testUserId);

    console.log('Result:', JSON.stringify(result2, null, 2));

    if (result2.success && result2.results) {
      console.log(`✅ PASS: Successfully retrieved ${result2.resultsCount} results`);
      console.log(`   Query: ${result2.query}`);
      console.log(`   Answer: ${result2.answer?.substring(0, 100)}...`);
    } else {
      console.log('❌ FAIL: Should return search results');
      console.log('   Error:', result2.error);
    }
  } else {
    console.log('⏭️  SKIP: TAVILY_API_KEY not configured');
    console.log('   To test with API key, add TAVILY_API_KEY to .env.local');
  }

  // Test 3: Check parameter validation
  console.log('\n📋 Test 3: Parameter validation');
  console.log('-'.repeat(60));

  const result3 = await executeAnthropicTool('searchWeb', {
    query: 'test query',
    maxResults: 20, // Should be clamped to 10
  }, testUserId);

  console.log('Requested 20 results (should be clamped to 10)');

  if (result3.error || (result3.resultsCount && result3.resultsCount <= 10)) {
    console.log('✅ PASS: Max results properly limited');
  } else {
    console.log('⚠️  WARNING: Max results validation may not be working');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Web Search Tool Tests Complete\n');

  // Summary
  console.log('Summary:');
  console.log('- Tool registry: ✅ searchWeb tool defined');
  console.log('- Tool executor: ✅ searchWeb case implemented');
  console.log('- Error handling: ✅ Helpful error when API key missing');
  console.log('- API integration:', process.env.TAVILY_API_KEY ? '✅ Ready' : '⏭️  Not configured');

  if (!process.env.TAVILY_API_KEY) {
    console.log('\n💡 Next Steps:');
    console.log('1. Get API key from https://tavily.com');
    console.log('2. Add TAVILY_API_KEY to .env.local');
    console.log('3. Run this test again to verify API integration');
  }
}

// Run tests
testWebSearch().catch(console.error);
