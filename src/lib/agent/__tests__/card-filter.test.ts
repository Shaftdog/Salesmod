/**
 * Tests for card filtering system
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProposedAction } from '../planner';

// Mock the violatesRule function for testing
function violatesRule(action: ProposedAction, rule: any): { violates: boolean; reason?: string } {
  const ruleText = rule.rule.toLowerCase();

  // Check for "don't use" rules
  if (ruleText.includes("don't use") || ruleText.includes("do not use")) {
    const match = ruleText.match(/(?:don't|do not) use?\s+['"]?(.+?)['"]?(?:\.|$|,|in)/i);
    if (match) {
      const forbiddenPhrase = match[1].toLowerCase().trim();
      const emailContent = `${action.emailDraft?.body || ''} ${action.emailDraft?.subject || ''}`.toLowerCase();

      if (emailContent.includes(forbiddenPhrase)) {
        return {
          violates: true,
          reason: `Rule prohibits using phrase: "${forbiddenPhrase}"`
        };
      }
    }
  }

  // Check for "don't generate" rules
  if (ruleText.includes("don't generate") || ruleText.includes("do not generate")) {
    const match = ruleText.match(/(?:don't|do not) generat(?:e|ing)\s+(?:cards?\s+)?(?:for|to|about|with)?\s*(.+?)(?:\.|$|,)/i);
    if (match) {
      const forbidden = match[1].toLowerCase().trim();
      const cardContext = `${action.title} ${action.rationale} ${action.emailDraft?.subject || ''}`.toLowerCase();

      if (cardContext.includes(forbidden)) {
        return {
          violates: true,
          reason: `Rule prohibits generating cards for/about: "${forbidden}"`
        };
      }
    }
  }

  return { violates: false };
}

describe('Card Filter - Rule Matching', () => {
  it('should filter cards with "hope this message finds you well"', () => {
    const action: ProposedAction = {
      type: 'send_email',
      clientId: 'client-123',
      priority: 'medium',
      title: 'Follow up with AMC',
      rationale: 'Re-engage dormant client',
      emailDraft: {
        to: 'test@example.com',
        subject: 'Q4 Update',
        body: '<p>Hi John,</p><p>I hope this message finds you well. I wanted to reach out...</p>',
      },
    };

    const rule = {
      rule: "Don't use 'hope this message finds you well' in emails",
      cardType: 'send_email',
      importance: 0.9,
    };

    const result = violatesRule(action, rule);

    expect(result.violates).toBe(true);
    expect(result.reason).toContain('hope this message finds you well');
  });

  it('should allow cards without forbidden phrases', () => {
    const action: ProposedAction = {
      type: 'send_email',
      clientId: 'client-123',
      priority: 'medium',
      title: 'Follow up with AMC',
      rationale: 'Re-engage dormant client',
      emailDraft: {
        to: 'test@example.com',
        subject: 'Q4 Update',
        body: '<p>Hi John,</p><p>I wanted to reach out about our Q4 performance...</p>',
      },
    };

    const rule = {
      rule: "Don't use 'hope this message finds you well' in emails",
      cardType: 'send_email',
      importance: 0.9,
    };

    const result = violatesRule(action, rule);

    expect(result.violates).toBe(false);
  });

  it('should filter cards based on "don\'t generate" rules', () => {
    const action: ProposedAction = {
      type: 'send_email',
      clientId: 'client-123',
      priority: 'medium',
      title: 'Cold outreach to new AMC',
      rationale: 'Generate new business from cold leads',
      emailDraft: {
        to: 'test@example.com',
        subject: 'Introduction',
        body: '<p>Hello, I wanted to introduce our services...</p>',
      },
    };

    const rule = {
      rule: "Don't generate cards for cold outreach",
      cardType: 'all',
      importance: 0.8,
    };

    const result = violatesRule(action, rule);

    expect(result.violates).toBe(true);
    expect(result.reason).toContain('cold outreach');
  });

  it('should handle "do not use" variant', () => {
    const action: ProposedAction = {
      type: 'send_email',
      clientId: 'client-123',
      priority: 'medium',
      title: 'Follow up',
      rationale: 'Check in',
      emailDraft: {
        to: 'test@example.com',
        subject: 'Checking in',
        body: '<p>Just wanted to touch base with you...</p>',
      },
    };

    const rule = {
      rule: "Do not use 'touch base' in emails",
      cardType: 'send_email',
      importance: 0.7,
    };

    const result = violatesRule(action, rule);

    expect(result.violates).toBe(true);
    expect(result.reason).toContain('touch base');
  });

  it('should not filter cards for different types', () => {
    const action: ProposedAction = {
      type: 'create_task',
      clientId: 'client-123',
      priority: 'high',
      title: 'Schedule call with John',
      rationale: 'Need to discuss project',
      taskDetails: {
        description: 'Call John to discuss Q4 project',
      },
    };

    const rule = {
      rule: "Don't use 'hope this message finds you well' in emails",
      cardType: 'send_email', // Rule only applies to emails
      importance: 0.9,
    };

    const result = violatesRule(action, rule);

    expect(result.violates).toBe(false);
  });

  it('should be case-insensitive', () => {
    const action: ProposedAction = {
      type: 'send_email',
      clientId: 'client-123',
      priority: 'medium',
      title: 'Follow up',
      rationale: 'Check in',
      emailDraft: {
        to: 'test@example.com',
        subject: 'Update',
        body: '<p>I HOPE THIS MESSAGE FINDS YOU WELL...</p>',
      },
    };

    const rule = {
      rule: "Don't use 'hope this message finds you well' in emails",
      cardType: 'send_email',
      importance: 0.9,
    };

    const result = violatesRule(action, rule);

    expect(result.violates).toBe(true);
  });
});
