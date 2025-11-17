/**
 * Card Filtering System
 * Validates generated cards against learning rules before they are created
 */

import { createClient } from '@/lib/supabase/server';
import { ProposedAction } from './planner';

interface LearningRule {
  id: string;
  rule: string;
  reason: string;
  cardType: string;
  importance: number;
  patternType?: string;
  regex?: string;
}

interface CardFilterResult {
  allowedActions: ProposedAction[];
  filteredActions: Array<{
    action: ProposedAction;
    rule: LearningRule;
    reason: string;
  }>;
}

/**
 * Load all active learning rules from agent_memories
 */
async function loadLearningRules(orgId: string): Promise<LearningRule[]> {
  const supabase = await createClient();

  const { data: rules, error } = await supabase
    .from('agent_memories')
    .select('*')
    .eq('org_id', orgId)
    .eq('scope', 'card_feedback')
    .not('content->>rule', 'is', null)
    .gte('importance', 0.5) // Only use rules with importance >= 50%
    .order('importance', { ascending: false });

  if (error) {
    console.error('[CardFilter] Error loading rules:', error);
    return [];
  }

  return (rules || []).map((r: any) => ({
    id: r.id,
    rule: r.content?.rule || '',
    reason: r.content?.reason || '',
    cardType: r.content?.card_type || 'all',
    importance: r.importance,
    patternType: r.content?.pattern_type,
    regex: r.content?.regex,
  }));
}

/**
 * Check if a card violates a specific rule
 */
function violatesRule(action: ProposedAction, rule: LearningRule): { violates: boolean; reason?: string } {
  // Skip if rule is for a different card type
  if (rule.cardType !== 'all' && rule.cardType !== action.type) {
    return { violates: false };
  }

  const ruleText = rule.rule.toLowerCase();

  // Pattern-based rules (regex matching)
  if (rule.patternType && rule.regex) {
    try {
      const pattern = new RegExp(rule.regex, 'i');

      switch (rule.patternType) {
        case 'email_content':
          const emailBody = action.emailDraft?.body?.toLowerCase() || '';
          const emailSubject = action.emailDraft?.subject?.toLowerCase() || '';
          if (pattern.test(emailBody) || pattern.test(emailSubject)) {
            return {
              violates: true,
              reason: `Email content matches forbidden pattern: "${rule.regex}"`
            };
          }
          break;

        case 'contact_name':
        case 'email_domain':
        case 'company_name':
          // These would need contact/client data - skip for now
          break;
      }
    } catch (e) {
      console.warn(`[CardFilter] Invalid regex in rule ${rule.id}:`, rule.regex);
    }
  }

  // Text-based rule matching
  // Check common forbidden phrases
  const forbiddenPhrases = extractForbiddenPhrases(ruleText);

  if (forbiddenPhrases.length > 0) {
    const emailBody = action.emailDraft?.body?.toLowerCase() || '';
    const emailSubject = action.emailDraft?.subject?.toLowerCase() || '';
    const title = action.title.toLowerCase();
    const rationale = action.rationale.toLowerCase();

    const allText = `${emailBody} ${emailSubject} ${title} ${rationale}`;

    for (const phrase of forbiddenPhrases) {
      if (allText.includes(phrase.toLowerCase())) {
        return {
          violates: true,
          reason: `Contains forbidden phrase: "${phrase}"`
        };
      }
    }
  }

  // Check for "don't generate" or "avoid generating" rules
  if (ruleText.includes("don't generate") || ruleText.includes("do not generate") ||
      ruleText.includes("avoid generating") || ruleText.includes("stop generating")) {

    // Extract what not to generate
    const match = ruleText.match(/(?:don't|do not|avoid|stop) generat(?:e|ing)\s+(?:cards?\s+)?(?:for|to|about|with)?\s*(.+?)(?:\.|$|,)/i);
    if (match) {
      const forbidden = match[1].toLowerCase().trim();
      const cardContext = `${action.title} ${action.rationale} ${action.emailDraft?.subject || ''}`.toLowerCase();

      // Check if the forbidden term appears in the card
      if (cardContext.includes(forbidden)) {
        return {
          violates: true,
          reason: `Rule prohibits generating cards for/about: "${forbidden}"`
        };
      }
    }
  }

  // Check for "don't use" or "avoid using" rules
  if (ruleText.includes("don't use") || ruleText.includes("do not use") ||
      ruleText.includes("avoid using") || ruleText.includes("stop using")) {

    const match = ruleText.match(/(?:don't|do not|avoid|stop) us(?:e|ing)\s+['"]?(.+?)['"]?(?:\.|$|,|in)/i);
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

  return { violates: false };
}

/**
 * Extract forbidden phrases from a rule text
 */
function extractForbiddenPhrases(ruleText: string): string[] {
  const phrases: string[] = [];

  // Pattern: "don't use 'X'" or "avoid 'X'" or "don't say 'X'"
  const patterns = [
    /(?:don't|do not|avoid|stop)\s+(?:use|say|include|mention)\s+['"](.+?)['"]/gi,
    /(?:don't|do not|avoid|stop)\s+(?:use|say|include|mention)\s+(\w+(?:\s+\w+){0,5})\s+(?:in|when|for)/gi,
  ];

  for (const pattern of patterns) {
    const matches = ruleText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        phrases.push(match[1].trim());
      }
    }
  }

  return phrases;
}

/**
 * Filter proposed actions based on learning rules
 */
export async function filterCards(orgId: string, actions: ProposedAction[]): Promise<CardFilterResult> {
  console.log(`[CardFilter] Filtering ${actions.length} proposed actions against learning rules...`);

  // Load rules
  const rules = await loadLearningRules(orgId);
  console.log(`[CardFilter] Loaded ${rules.length} learning rules`);

  if (rules.length === 0) {
    // No rules to apply - allow all cards
    return {
      allowedActions: actions,
      filteredActions: [],
    };
  }

  const allowedActions: ProposedAction[] = [];
  const filteredActions: Array<{ action: ProposedAction; rule: LearningRule; reason: string }> = [];

  // Check each action against all rules
  for (const action of actions) {
    let violated = false;
    let violatedRule: LearningRule | null = null;
    let violationReason = '';

    // Check against each rule (sorted by importance, highest first)
    for (const rule of rules) {
      const result = violatesRule(action, rule);

      if (result.violates) {
        violated = true;
        violatedRule = rule;
        violationReason = result.reason || rule.rule;

        console.log(`[CardFilter] ✗ Filtered action "${action.title}": ${violationReason}`);
        break; // Stop at first violation
      }
    }

    if (violated && violatedRule) {
      filteredActions.push({
        action,
        rule: violatedRule,
        reason: violationReason,
      });
    } else {
      allowedActions.push(action);
      console.log(`[CardFilter] ✓ Allowed action "${action.title}"`);
    }
  }

  console.log(`[CardFilter] Result: ${allowedActions.length} allowed, ${filteredActions.length} filtered`);

  return {
    allowedActions,
    filteredActions,
  };
}

/**
 * Log filtered cards to agent_memories for transparency
 */
export async function logFilteredCards(
  orgId: string,
  filteredActions: Array<{ action: ProposedAction; rule: LearningRule; reason: string }>
): Promise<void> {
  if (filteredActions.length === 0) return;

  const supabase = await createClient();

  for (const { action, rule, reason } of filteredActions) {
    await supabase.from('agent_memories').insert({
      org_id: orgId,
      scope: 'card_filter_log',
      key: `auto_filtered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: {
        action_title: action.title,
        action_type: action.type,
        filtered_by_rule: rule.rule,
        filter_reason: reason,
        rule_id: rule.id,
        timestamp: new Date().toISOString(),
      },
      importance: 0.3, // Low importance - just for logging
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
  }

  console.log(`[CardFilter] Logged ${filteredActions.length} auto-filtered cards to agent_memories`);
}
