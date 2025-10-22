import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { SearchResult } from './web-search';
import { ClientIntel, formatClientIntel } from './internal-search';

/**
 * Summarize research findings using AI
 */
export async function summarizeResearch(
  intel: ClientIntel,
  webResults: SearchResult[]
): Promise<string> {
  const internalData = formatClientIntel(intel);
  
  const webData = webResults.length > 0
    ? webResults.map(r => `**${r.title}**\n${r.snippet}\nSource: ${r.url}`).join('\n\n')
    : 'No web research results available.';

  const prompt = `You are a research analyst for a property appraisal management company. Create a comprehensive research summary for this client.

# INTERNAL DATABASE FINDINGS:

${internalData}

# WEB RESEARCH RESULTS:

${webData}

---

Create a professional research summary with these sections:

## 1. Company Overview
Brief description of the company and what they do.

## 2. Our Relationship History
Summarize our business relationship, order history, and engagement patterns.

## 3. Current Status & Recent Activity
Any recent changes, market activity, or news worth noting.

## 4. Engagement Opportunities
Specific opportunities for us to provide value based on their needs and our capabilities.

## 5. Recommended Next Actions
Concrete steps we should take to engage or re-engage this client.

## 6. Risk Factors & Considerations
Any concerns or things to be aware of.

Be concise but actionable. Focus on information that helps us provide better service and grow the relationship.`;

  try {
    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt,
      temperature: 0.5, // More consistent outputs
    });

    return text;
  } catch (error) {
    console.error('AI summarization failed:', error);
    
    // Fallback to basic summary
    return `# Research Summary: ${intel.client.company_name}

## Our Relationship
- Total Orders: ${intel.metrics.totalOrders}
- Total Revenue: $${intel.metrics.totalRevenue.toFixed(2)}
- Last Order: ${intel.metrics.lastOrderDate ? new Date(intel.metrics.lastOrderDate).toLocaleDateString() : 'Never'}
- Last Contact: ${intel.metrics.daysSinceLastContact} days ago

## Status
${intel.metrics.daysSinceLastContact > 30 ? '⚠️ Needs re-engagement' : '✓ Recently contacted'}
${intel.metrics.activeDeals > 0 ? `📊 ${intel.metrics.activeDeals} active deal(s)` : ''}

## Recommended Actions
${intel.metrics.daysSinceLastContact > 30 ? '1. Re-engagement outreach\n' : ''}${intel.metrics.activeDeals > 0 ? '2. Follow up on active deals\n' : ''}3. Review recent order patterns

Web research unavailable. AI summarization failed: ${error}`;
  }
}

/**
 * Extract opportunities from research summary
 */
export function extractOpportunities(summary: string): string[] {
  const opportunities: string[] = [];

  // Look for opportunity section
  const oppSection = summary.match(/## 4\. Engagement Opportunities([\s\S]*?)##/i);
  if (oppSection) {
    const lines = oppSection[1].split('\n').filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./));
    opportunities.push(...lines.map(l => l.trim().replace(/^[-\d.]\s*/, '')).filter(Boolean));
  }

  // If no structured opportunities found, look for keywords
  if (opportunities.length === 0) {
    if (summary.toLowerCase().includes('volume')) opportunities.push('Volume package opportunity');
    if (summary.toLowerCase().includes('expand')) opportunities.push('Expansion opportunity');
    if (summary.toLowerCase().includes('re-engage')) opportunities.push('Re-engagement needed');
  }

  return opportunities.slice(0, 5); // Top 5 opportunities
}

/**
 * Extract key insights for agent memories
 */
export function extractKeyInsights(summary: string): any {
  return {
    summary: summary.substring(0, 500),
    opportunities: extractOpportunities(summary),
    timestamp: new Date().toISOString(),
  };
}

