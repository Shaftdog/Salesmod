/**
 * Contact Enricher Tests
 *
 * Tests for contact data extraction and signal detection:
 * - Email signature parsing with regex
 * - Role inference from titles
 * - Opportunity signal detection
 * - Edge cases and malformed data
 */

import { describe, it, expect } from 'vitest';
import {
  parseEmailSignature,
  inferRoleFromTitle,
  detectOpportunitySignals,
  type ExtractedContactData,
  type SignalDetectionResult,
} from '../contact-enricher';

// ============================================================================
// P1 CRITICAL: EMAIL SIGNATURE PARSING
// ============================================================================

describe('parseEmailSignature - Phone Number Extraction (P1)', () => {
  it('should extract US phone number with parentheses', () => {
    const email = `Best regards,
John Doe
(555) 123-4567`;

    const result = parseEmailSignature(email);

    expect(result.phone).toBeDefined();
    expect(result.phone).toBe('5551234567');
  });

  it('should extract phone number with dashes', () => {
    const email = `Thanks,
Jane Smith
555-123-4567`;

    const result = parseEmailSignature(email);

    expect(result.phone).toBe('5551234567');
  });

  it('should extract phone number with dots', () => {
    const email = `Regards,
Bob Johnson
555.123.4567`;

    const result = parseEmailSignature(email);

    expect(result.phone).toBe('5551234567');
  });

  it('should extract multiple phone numbers (office and mobile)', () => {
    const email = `Best regards,
Alice Cooper
Office: (555) 123-4567
Mobile: (555) 987-6543`;

    const result = parseEmailSignature(email);

    expect(result.phone).toBe('5551234567');
    expect(result.mobile).toBe('5559876543');
  });

  it('should extract phone number with +1 country code', () => {
    const email = `Cheers,
Tom Wilson
+1 (555) 123-4567`;

    const result = parseEmailSignature(email);

    expect(result.phone).toContain('5551234567');
  });

  it('should handle missing phone numbers', () => {
    const email = `Thanks,
John Doe
john@example.com`;

    const result = parseEmailSignature(email);

    expect(result.phone).toBeUndefined();
  });
});

describe('parseEmailSignature - Email Extraction (P1)', () => {
  it('should extract email address', () => {
    const email = `Best regards,
John Doe
john.doe@example.com`;

    const result = parseEmailSignature(email);

    expect(result.email).toBe('john.doe@example.com');
  });

  it('should extract email with subdomain', () => {
    const email = `Thanks,
Jane Smith
jane@mail.company.co.uk`;

    const result = parseEmailSignature(email);

    expect(result.email).toBe('jane@mail.company.co.uk');
  });

  it('should handle multiple emails (take first)', () => {
    const email = `Regards,
Bob Johnson
bob@company.com
support@company.com`;

    const result = parseEmailSignature(email);

    expect(result.email).toBe('bob@company.com');
  });

  it('should lowercase email addresses', () => {
    const email = `Best,
Alice
ALICE@EXAMPLE.COM`;

    const result = parseEmailSignature(email);

    expect(result.email).toBe('alice@example.com');
  });
});

describe('parseEmailSignature - Title Extraction (P1)', () => {
  it('should extract Director title', () => {
    const email = `Best regards,
John Doe
Director of Operations
Acme Corp`;

    const result = parseEmailSignature(email);

    expect(result.title).toContain('Director');
  });

  it('should extract Manager title', () => {
    const email = `Thanks,
Jane Smith
Senior Manager
Tech Inc`;

    const result = parseEmailSignature(email);

    expect(result.title).toContain('Manager');
  });

  it('should extract C-level title', () => {
    const email = `Regards,
Bob Johnson
Chief Technology Officer`;

    const result = parseEmailSignature(email);

    expect(result.title).toContain('Chief Technology Officer');
  });

  it('should extract VP title', () => {
    const email = `Best,
Alice Cooper
VP of Sales`;

    const result = parseEmailSignature(email);

    expect(result.title).toContain('VP');
  });

  it('should extract title from "Title:" label', () => {
    const email = `Regards,
Tom Wilson
Title: Senior Developer`;

    const result = parseEmailSignature(email);

    expect(result.title).toBe('Senior Developer');
  });
});

describe('parseEmailSignature - Company Extraction (P1)', () => {
  it('should extract company with LLC', () => {
    const email = `Best regards,
John Doe
Acme Solutions LLC`;

    const result = parseEmailSignature(email);

    expect(result.company).toContain('Acme Solutions LLC');
  });

  it('should extract company with Inc', () => {
    const email = `Thanks,
Jane Smith
Tech Innovations Inc`;

    const result = parseEmailSignature(email);

    expect(result.company).toContain('Tech Innovations Inc');
  });

  it('should extract company from "Company:" label', () => {
    const email = `Regards,
Bob Johnson
Company: Global Enterprises Corp`;

    const result = parseEmailSignature(email);

    expect(result.company).toBe('Global Enterprises Corp');
  });
});

describe('parseEmailSignature - Social Media (P1)', () => {
  it('should extract LinkedIn URL', () => {
    const email = `Best regards,
John Doe
linkedin.com/in/johndoe`;

    const result = parseEmailSignature(email);

    expect(result.linkedin).toBe('https://linkedin.com/in/johndoe');
  });

  it('should extract Twitter handle', () => {
    const email = `Thanks,
Jane Smith
@janesmith`;

    const result = parseEmailSignature(email);

    expect(result.twitter).toBe('@janesmith');
  });

  it('should extract website excluding social media', () => {
    const email = `Regards,
Bob Johnson
www.example.com
linkedin.com/in/bob`;

    const result = parseEmailSignature(email);

    expect(result.website).toContain('example.com');
    expect(result.website).not.toContain('linkedin');
  });
});

describe('parseEmailSignature - Edge Cases (P1)', () => {
  it('should handle empty email body', () => {
    const result = parseEmailSignature('');

    expect(result).toBeDefined();
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('should handle email with no signature', () => {
    const email = 'This is just a plain email with no signature.';

    const result = parseEmailSignature(email);

    expect(result).toBeDefined();
  });

  it('should extract from multiple signature delimiters', () => {
    const email = `Email content here

--
John Doe
john@example.com
(555) 123-4567`;

    const result = parseEmailSignature(email);

    expect(result.email).toBe('john@example.com');
    expect(result.phone).toBe('5551234567');
  });

  it('should handle Unicode characters', () => {
    const email = `Regards,
François Müller
françois@example.com`;

    const result = parseEmailSignature(email);

    expect(result.email).toBeDefined();
  });
});

// ============================================================================
// P1 CRITICAL: ROLE INFERENCE
// ============================================================================

describe('inferRoleFromTitle - Decision Makers (P1)', () => {
  const decisionMakerTitles = [
    'Chief Executive Officer',
    'CEO',
    'President',
    'Owner',
    'Partner',
    'VP of Sales',
    'Vice President',
    'Director of Engineering',
    'CFO',
    'CTO',
    'COO',
    'General Manager',
    'Head of Operations',
  ];

  decisionMakerTitles.forEach(title => {
    it(`should classify "${title}" as decision_maker`, () => {
      const result = inferRoleFromTitle(title);
      expect(result).toBe('decision_maker');
    });
  });
});

describe('inferRoleFromTitle - Influencers (P1)', () => {
  const influencerTitles = [
    'Senior Manager',
    'Manager',
    'Team Lead',
    'Lead Developer',
    'Principal Engineer',
    'Senior Specialist',
    'Coordinator',
    'Consultant',
  ];

  influencerTitles.forEach(title => {
    it(`should classify "${title}" as influencer`, () => {
      const result = inferRoleFromTitle(title);
      expect(result).toBe('influencer');
    });
  });
});

describe('inferRoleFromTitle - Users (P1)', () => {
  const userTitles = [
    'Developer',
    'Engineer',
    'Analyst',
    'Associate',
    'Intern',
    'Assistant',
  ];

  userTitles.forEach(title => {
    it(`should classify "${title}" as user`, () => {
      const result = inferRoleFromTitle(title);
      expect(result).toBe('user');
    });
  });
});

describe('inferRoleFromTitle - Case Insensitive (P1)', () => {
  it('should handle uppercase titles', () => {
    expect(inferRoleFromTitle('CEO')).toBe('decision_maker');
    expect(inferRoleFromTitle('MANAGER')).toBe('influencer');
  });

  it('should handle mixed case titles', () => {
    expect(inferRoleFromTitle('Chief Technology Officer')).toBe('decision_maker');
    expect(inferRoleFromTitle('Senior Manager')).toBe('influencer');
  });

  it('should handle lowercase titles', () => {
    expect(inferRoleFromTitle('ceo')).toBe('decision_maker');
    expect(inferRoleFromTitle('manager')).toBe('influencer');
  });
});

// ============================================================================
// P1 CRITICAL: OPPORTUNITY SIGNAL DETECTION
// ============================================================================

describe('detectOpportunitySignals - Complaint Signals (P1)', () => {
  it('should detect single complaint keyword', () => {
    const result = detectOpportunitySignals(
      'I am very disappointed with the service',
      { sourceType: 'email' }
    );

    const complaintSignal = result.signals.find(s => s.type === 'complaint');
    expect(complaintSignal).toBeDefined();
    expect(complaintSignal?.strength).toBeGreaterThan(0);
  });

  it('should detect multiple complaint keywords', () => {
    const result = detectOpportunitySignals(
      'This is unacceptable. I am frustrated and unhappy with the poor quality.',
      { sourceType: 'email' }
    );

    const complaintSignal = result.signals.find(s => s.type === 'complaint');
    expect(complaintSignal).toBeDefined();
    expect(complaintSignal?.strength).toBeGreaterThan(0.4); // Higher strength for multiple keywords
  });

  it('should include matched keywords in context', () => {
    const result = detectOpportunitySignals(
      'I have a problem with this issue',
      { sourceType: 'email' }
    );

    const complaintSignal = result.signals.find(s => s.type === 'complaint');
    expect(complaintSignal?.context.keywords).toContain('problem');
    expect(complaintSignal?.context.keywords).toContain('issue');
  });
});

describe('detectOpportunitySignals - Urgency Signals (P1)', () => {
  it('should detect urgency keywords', () => {
    const result = detectOpportunitySignals(
      'This is urgent and time sensitive. Please respond ASAP.',
      { sourceType: 'email' }
    );

    const urgencySignal = result.signals.find(s => s.type === 'urgency');
    expect(urgencySignal).toBeDefined();
    expect(urgencySignal?.strength).toBeGreaterThan(0);
  });

  it('should have higher strength for multiple urgency indicators', () => {
    const result = detectOpportunitySignals(
      'Urgent: Critical issue needs immediate attention right away!',
      { sourceType: 'email' }
    );

    const urgencySignal = result.signals.find(s => s.type === 'urgency');
    expect(urgencySignal?.strength).toBeGreaterThan(0.5);
  });
});

describe('detectOpportunitySignals - Budget Mentions (P1)', () => {
  it('should detect budget with dollar amount', () => {
    const result = detectOpportunitySignals(
      'We have a budget of $50,000 for this project',
      { sourceType: 'email' }
    );

    const budgetSignal = result.signals.find(s => s.type === 'budget_mention');
    expect(budgetSignal).toBeDefined();
    expect(budgetSignal?.strength).toBe(0.7);
  });

  it('should extract amount from signal', () => {
    const result = detectOpportunitySignals(
      'Budget: $100,000',
      { sourceType: 'email' }
    );

    const budgetSignal = result.signals.find(s => s.type === 'budget_mention');
    expect(budgetSignal?.context.extractedAmount).toContain('100,000');
  });
});

describe('detectOpportunitySignals - Competitor Mentions (P1)', () => {
  it('should detect competitor keywords', () => {
    const result = detectOpportunitySignals(
      'We are comparing your solution with other vendors',
      { sourceType: 'email' }
    );

    const competitorSignal = result.signals.find(s => s.type === 'competitor_mention');
    expect(competitorSignal).toBeDefined();
    expect(competitorSignal?.strength).toBe(0.6);
  });
});

describe('detectOpportunitySignals - Expansion Signals (P1)', () => {
  it('should detect expansion keywords', () => {
    const result = detectOpportunitySignals(
      'We are expanding to new locations and scaling up operations',
      { sourceType: 'email' }
    );

    const expansionSignal = result.signals.find(s => s.type === 'expansion');
    expect(expansionSignal).toBeDefined();
    expect(expansionSignal?.strength).toBe(0.8);
  });
});

describe('detectOpportunitySignals - Renewal Signals (P1)', () => {
  it('should detect renewal keywords', () => {
    const result = detectOpportunitySignals(
      'Our contract is expiring next year and we want to renew',
      { sourceType: 'email' }
    );

    const renewalSignal = result.signals.find(s => s.type === 'renewal');
    expect(renewalSignal).toBeDefined();
    expect(renewalSignal?.strength).toBe(0.7);
  });
});

describe('detectOpportunitySignals - Referral Signals (P1)', () => {
  it('should detect referral keywords', () => {
    const result = detectOpportunitySignals(
      'A colleague recommended your services',
      { sourceType: 'email' }
    );

    const referralSignal = result.signals.find(s => s.type === 'referral');
    expect(referralSignal).toBeDefined();
    expect(referralSignal?.strength).toBe(0.85);
  });
});

describe('detectOpportunitySignals - Churn Risk (P1)', () => {
  it('should detect churn risk keywords', () => {
    const result = detectOpportunitySignals(
      'We are considering canceling and switching to another provider',
      { sourceType: 'email' }
    );

    const churnSignal = result.signals.find(s => s.type === 'churn_risk');
    expect(churnSignal).toBeDefined();
    expect(churnSignal?.strength).toBeGreaterThan(0);
  });
});

describe('detectOpportunitySignals - High Priority Detection (P1)', () => {
  it('should flag high-priority signals (strength >= 0.7)', () => {
    const result = detectOpportunitySignals(
      'We are expanding with a budget of $100,000',
      { sourceType: 'email' }
    );

    expect(result.hasHighPrioritySignal).toBe(true);
  });

  it('should not flag low-priority signals', () => {
    const result = detectOpportunitySignals(
      'I have a small issue',
      { sourceType: 'email' }
    );

    expect(result.hasHighPrioritySignal).toBe(false);
  });
});

describe('detectOpportunitySignals - Multiple Signals (P1)', () => {
  it('should detect multiple signal types in one text', () => {
    const result = detectOpportunitySignals(
      'This is urgent. We have a budget of $50,000 but are also looking at competitors.',
      { sourceType: 'email' }
    );

    expect(result.signals.length).toBeGreaterThanOrEqual(3);
    expect(result.signals.map(s => s.type)).toContain('urgency');
    expect(result.signals.map(s => s.type)).toContain('budget_mention');
    expect(result.signals.map(s => s.type)).toContain('competitor_mention');
  });

  it('should return empty array when no signals detected', () => {
    const result = detectOpportunitySignals(
      'Just a regular email with no special indicators',
      { sourceType: 'email' }
    );

    expect(result.signals).toHaveLength(0);
    expect(result.hasHighPrioritySignal).toBe(false);
  });
});

describe('detectOpportunitySignals - Case Insensitivity (P1)', () => {
  it('should detect signals regardless of case', () => {
    const result = detectOpportunitySignals(
      'URGENT: BUDGET $100,000',
      { sourceType: 'email' }
    );

    expect(result.signals.length).toBeGreaterThan(0);
    const urgencySignal = result.signals.find(s => s.type === 'urgency');
    expect(urgencySignal).toBeDefined();
  });
});

describe('detectOpportunitySignals - Edge Cases (P1)', () => {
  it('should handle empty text', () => {
    const result = detectOpportunitySignals('', { sourceType: 'email' });

    expect(result.signals).toHaveLength(0);
    expect(result.hasHighPrioritySignal).toBe(false);
  });

  it('should handle very long text', () => {
    const longText = 'Regular text. '.repeat(1000) + 'This is urgent!';
    const result = detectOpportunitySignals(longText, { sourceType: 'email' });

    const urgencySignal = result.signals.find(s => s.type === 'urgency');
    expect(urgencySignal).toBeDefined();
  });

  it('should handle special characters', () => {
    const result = detectOpportunitySignals(
      'Urgent!!! Budget: $50,000!!!',
      { sourceType: 'email' }
    );

    expect(result.signals.length).toBeGreaterThan(0);
  });
});
