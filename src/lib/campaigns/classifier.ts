/**
 * AI Response Classifier
 * Classifies email responses for sentiment and disposition
 */

import OpenAI from 'openai';
import type { ClassificationResult } from './types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Classify an email response using AI
 * V1: NO AUTO-SEND - Only classification
 */
export async function classifyResponse({
  campaignName,
  responseText,
  originalMessage,
}: {
  campaignName: string;
  responseText: string;
  originalMessage: string;
}): Promise<ClassificationResult> {
  const prompt = `
Analyze this email response to our campaign and classify it:

Campaign: ${campaignName}
Original message: ${originalMessage}
Response: ${responseText}

Provide:
1. Sentiment: positive, neutral, or negative
2. Disposition: one of:
   - HAS_ACTIVE_PROFILE: They confirm they have an active profile
   - NO_ACTIVE_PROFILE: They don't have an active profile
   - INTERESTED: Expressing interest in our service
   - NEEDS_MORE_INFO: Asking for more information
   - NOT_INTERESTED: Declining/not interested
   - OUT_OF_OFFICE: Auto-reply/OOO
   - ESCALATE_UNCLEAR: Can't determine intent

3. is_unsubscribe: true if they explicitly ask to unsubscribe/remove from list
4. Brief summary (1-2 sentences)

Return JSON only (no markdown, no code blocks):
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "disposition": "HAS_ACTIVE_PROFILE" | "NO_ACTIVE_PROFILE" | ...,
  "is_unsubscribe": true | false,
  "summary": "..."
}
`;

  try {
    // Call your AI service (OpenAI, Anthropic, etc.)
    // For now, using a mock implementation
    const result = await callLLM(prompt);

    // Parse and validate the response
    const parsed = JSON.parse(result);

    return {
      sentiment: parsed.sentiment,
      disposition: parsed.disposition,
      is_unsubscribe: parsed.is_unsubscribe || false,
      summary: parsed.summary,
    };
  } catch (error) {
    console.error('[Classifier] Failed to classify response:', error);
    // Return default classification on error
    return {
      sentiment: 'NEUTRAL',
      disposition: 'ESCALATE_UNCLEAR',
      is_unsubscribe: false,
      summary: 'Failed to classify response automatically',
    };
  }
}

/**
 * Generate AI draft reply for NEEDS_MORE_INFO disposition
 * V1: Returns draft only, NO AUTO-SEND
 */
export async function generateReplyDraft({
  campaignName,
  responseText,
  originalMessage,
}: {
  campaignName: string;
  responseText: string;
  originalMessage: string;
}): Promise<string> {
  const prompt = `
The contact asked for more information in response to our campaign.

Campaign: ${campaignName}
Original message: ${originalMessage}
Their response: ${responseText}

Draft a helpful reply that:
- Answers their question professionally
- Provides relevant information
- Offers a call if needed
- Maintains a professional, friendly tone
- Keeps it concise (2-3 paragraphs)

Return ONLY the email body text (no subject, no formatting instructions):
`;

  try {
    const draft = await callLLM(prompt);
    return draft.trim();
  } catch (error) {
    console.error('[Classifier] Failed to generate reply draft:', error);
    return `Thank you for your response. I'll have someone from our team reach out to address your question.`;
  }
}

/**
 * Call LLM service (OpenAI GPT-4)
 */
async function callLLM(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[Classifier] OPENAI_API_KEY not configured, using fallback');
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: 'You are an expert email classifier for customer service. Analyze emails and return structured JSON responses only. Be concise and accurate.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: 'json_object' } // Ensures JSON response
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    return content;
  } catch (error) {
    console.error('[Classifier] OpenAI API error:', error);
    throw error;
  }
}

/**
 * Check if response contains unsubscribe keywords
 * Fallback detection method
 */
export function detectUnsubscribeKeywords(text: string): boolean {
  const unsubscribePatterns = [
    /unsubscribe/i,
    /remove me/i,
    /opt out/i,
    /stop sending/i,
    /do not contact/i,
    /take me off/i,
  ];

  return unsubscribePatterns.some(pattern => pattern.test(text));
}
