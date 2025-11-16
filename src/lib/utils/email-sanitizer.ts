/**
 * Email Content Sanitization
 * Prevents XSS, prompt injection, and validates email content
 */

const MAX_EMAIL_BODY_SIZE = 1024 * 1024; // 1MB
const MAX_SUBJECT_LENGTH = 500;

/**
 * Strip HTML tags and return plain text
 */
export function stripHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Sanitize email body text
 */
export function sanitizeEmailBody(body: string | null | undefined): string {
  if (!body) return '';

  // Truncate if too large
  let sanitized = body.substring(0, MAX_EMAIL_BODY_SIZE);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Strip excessive whitespace
  sanitized = sanitized.replace(/\s{10,}/g, '          '); // Max 10 consecutive spaces

  // Truncate and add indicator if truncated
  if (body.length > MAX_EMAIL_BODY_SIZE) {
    sanitized += '\n\n[Content truncated due to size]';
  }

  return sanitized.trim();
}

/**
 * Sanitize email subject
 */
export function sanitizeSubject(subject: string | null | undefined): string {
  if (!subject) return '';

  let sanitized = subject.substring(0, MAX_SUBJECT_LENGTH);

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\0\x00-\x1F\x7F-\x9F]/g, '');

  // Strip HTML if present
  sanitized = stripHtml(sanitized);

  return sanitized.trim();
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.trim().toLowerCase();

  if (!emailRegex.test(sanitized)) {
    throw new Error(`Invalid email address: ${email}`);
  }

  return sanitized;
}

/**
 * Sanitize email content for AI processing
 * Prevents prompt injection attacks
 */
export function sanitizeForAI(content: string): string {
  if (!content) return '';

  // Remove potential prompt injection patterns
  let sanitized = content;

  // Remove common prompt injection attempts
  const injectionPatterns = [
    /ignore (all )?previous (instructions|prompts)/gi,
    /disregard (all )?previous (instructions|prompts)/gi,
    /forget (all )?previous (instructions|prompts)/gi,
    /new (instruction|prompt|task):/gi,
    /system (message|prompt):/gi,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized;
}

/**
 * Complete email sanitization for database storage
 */
export interface SanitizedEmail {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  from: string;
  to: string[];
  cc?: string[];
  snippet: string;
}

export function sanitizeEmailForStorage(email: {
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  from?: string;
  to?: string | string[];
  cc?: string | string[];
}): SanitizedEmail {
  // Sanitize subject
  const subject = sanitizeSubject(email.subject);

  // Sanitize body
  const bodyText = sanitizeEmailBody(email.bodyText);
  const bodyHtml = sanitizeEmailBody(email.bodyHtml);

  // Create snippet (first 200 chars of text)
  const snippet = stripHtml(bodyText || bodyHtml).substring(0, 200);

  // Sanitize email addresses
  const from = email.from ? sanitizeEmail(email.from) : '';
  const to = Array.isArray(email.to)
    ? email.to.map(sanitizeEmail)
    : email.to
    ? [sanitizeEmail(email.to)]
    : [];
  const cc = email.cc
    ? Array.isArray(email.cc)
      ? email.cc.map(sanitizeEmail)
      : [sanitizeEmail(email.cc)]
    : undefined;

  return {
    subject,
    bodyText,
    bodyHtml,
    from,
    to,
    cc,
    snippet,
  };
}
