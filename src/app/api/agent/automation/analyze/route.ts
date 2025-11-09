import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

/**
 * POST /api/agent/automation/analyze
 * Analyze learning data and provide automation suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all feedback and rules
    const { data: memories, error: memoriesError } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('org_id', user.id)
      .eq('scope', 'card_feedback')
      .order('created_at', { ascending: false })
      .limit(200);

    if (memoriesError) {
      console.error('[Automation] Error fetching memories:', memoriesError);
      return NextResponse.json({ error: memoriesError.message }, { status: 500 });
    }

    const allMemories = memories || [];
    const rules = allMemories.filter((m) => m.content?.rule);
    const feedback = allMemories.filter((m) => m.content?.type?.includes('feedback'));

    // Run all automation analyses
    const autoRuleSuggestions = await analyzeForAutoRules(feedback, rules);
    const consolidationSuggestions = await analyzeForConsolidation(rules);
    const conflicts = await detectConflicts(rules);
    const deprecationCandidates = await findDeprecationCandidates(rules, supabase, user.id);
    const effectiveness = await calculateEffectiveness(rules, supabase, user.id);

    return NextResponse.json({
      success: true,
      automation: {
        autoRuleSuggestions,
        consolidationSuggestions,
        conflicts,
        deprecationCandidates,
        effectiveness,
      },
      stats: {
        totalRules: rules.length,
        totalFeedback: feedback.length,
        suggestionsCount: autoRuleSuggestions.length,
        consolidationCount: consolidationSuggestions.length,
        conflictsCount: conflicts.length,
        deprecationCount: deprecationCandidates.length,
      },
    });
  } catch (error: any) {
    console.error('[Automation] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Analyze feedback to suggest new rules based on patterns
 */
async function analyzeForAutoRules(feedback: any[], existingRules: any[]) {
  const suggestions: any[] = [];

  // Group feedback by reason (case-insensitive)
  const reasonGroups = new Map<string, any[]>();

  feedback.forEach((f) => {
    const reason = (f.content?.reason || '').toLowerCase().trim();
    if (reason) {
      if (!reasonGroups.has(reason)) {
        reasonGroups.set(reason, []);
      }
      reasonGroups.get(reason)!.push(f);
    }
  });

  // Find patterns with 3+ occurrences that don't have rules yet
  for (const [reason, items] of reasonGroups.entries()) {
    if (items.length >= 3) {
      // Check if we already have a rule for this reason
      const hasRule = existingRules.some(
        (rule) => (rule.content?.reason || '').toLowerCase().includes(reason)
      );

      if (!hasRule) {
        // Extract pattern information from the feedback items
        const cardType = items[0].content?.card_type || 'unknown';
        const patternType = items[0].content?.pattern_type || null;
        const regex = items[0].content?.regex || null;

        // Generate suggested rule text
        const ruleText = generateRuleText(reason, patternType, regex);

        suggestions.push({
          type: 'auto_rule',
          reason,
          occurrences: items.length,
          cardType,
          patternType,
          regex,
          suggestedRule: ruleText,
          suggestedImportance: Math.min(0.5 + (items.length * 0.1), 0.95),
          feedbackIds: items.map((i) => i.id),
          confidence: calculateConfidence(items),
        });
      }
    }
  }

  return suggestions;
}

/**
 * Generate human-readable rule text from pattern data
 */
function generateRuleText(reason: string, patternType: string | null, regex: string | null): string {
  if (!patternType || !regex) {
    return `Skip cards with reason: ${reason}`;
  }

  const cleanRegex = regex.replace(/^\^/, '').replace(/\$/, '');

  switch (patternType) {
    case 'contact_name':
      return `Skip contacts with names matching pattern: ${cleanRegex}`;
    case 'email_domain':
      return `Skip contacts with email domains matching: ${cleanRegex}`;
    case 'company_name':
      return `Skip companies with names matching: ${cleanRegex}`;
    default:
      return `Skip cards matching pattern: ${cleanRegex}`;
  }
}

/**
 * Calculate confidence score for auto-rule suggestion
 */
function calculateConfidence(items: any[]): number {
  const count = items.length;
  const hasPattern = items[0].content?.regex ? 0.2 : 0;
  const baseConfidence = Math.min(count * 0.15, 0.7);
  return Math.min(baseConfidence + hasPattern, 0.95);
}

/**
 * Analyze rules to find consolidation opportunities
 */
async function analyzeForConsolidation(rules: any[]) {
  const suggestions: any[] = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const rule1 = rules[i];
      const rule2 = rules[j];

      // Skip if different card types
      if (rule1.content?.card_type !== rule2.content?.card_type) {
        continue;
      }

      const similarity = calculateSimilarity(
        rule1.content?.rule || '',
        rule2.content?.rule || '',
        rule1.content?.reason || '',
        rule2.content?.reason || ''
      );

      if (similarity > 0.7) {
        suggestions.push({
          type: 'consolidation',
          rule1: {
            id: rule1.id,
            rule: rule1.content?.rule,
            reason: rule1.content?.reason,
            importance: rule1.importance,
          },
          rule2: {
            id: rule2.id,
            rule: rule2.content?.rule,
            reason: rule2.content?.reason,
            importance: rule2.importance,
          },
          similarity,
          suggestedMergedRule: mergeSuggestion(rule1, rule2),
          suggestedImportance: Math.max(rule1.importance, rule2.importance),
        });
      }
    }
  }

  // Remove duplicates (same pair in different order)
  const uniqueSuggestions = suggestions.filter((s, index) => {
    return !suggestions.slice(0, index).some(
      (prev) =>
        (prev.rule1.id === s.rule1.id && prev.rule2.id === s.rule2.id) ||
        (prev.rule1.id === s.rule2.id && prev.rule2.id === s.rule1.id)
    );
  });

  return uniqueSuggestions;
}

/**
 * Calculate text similarity between two rules
 */
function calculateSimilarity(
  rule1: string,
  rule2: string,
  reason1: string,
  reason2: string
): number {
  const r1 = rule1.toLowerCase();
  const r2 = rule2.toLowerCase();
  const rs1 = reason1.toLowerCase();
  const rs2 = reason2.toLowerCase();

  // Simple word overlap similarity
  const words1 = new Set([...r1.split(/\s+/), ...rs1.split(/\s+/)]);
  const words2 = new Set([...r2.split(/\s+/), ...rs2.split(/\s+/)]);

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Generate merged rule suggestion
 */
function mergeSuggestion(rule1: any, rule2: any): string {
  const r1 = rule1.content?.rule || '';
  const r2 = rule2.content?.rule || '';

  // If rules are very similar, use the longer one
  if (r1.length > r2.length) {
    return r1;
  } else if (r2.length > r1.length) {
    return r2;
  }

  // Otherwise combine them
  return `${r1} (also applies to: ${r2.toLowerCase()})`;
}

/**
 * Detect conflicting rules
 */
async function detectConflicts(rules: any[]) {
  const conflicts: any[] = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const rule1 = rules[i];
      const rule2 = rules[j];

      // Skip if different card types
      if (rule1.content?.card_type !== rule2.content?.card_type) {
        continue;
      }

      const isConflicting = detectConflict(rule1, rule2);

      if (isConflicting) {
        conflicts.push({
          type: 'conflict',
          rule1: {
            id: rule1.id,
            rule: rule1.content?.rule,
            reason: rule1.content?.reason,
            importance: rule1.importance,
            createdAt: rule1.created_at,
          },
          rule2: {
            id: rule2.id,
            rule: rule2.content?.rule,
            reason: rule2.content?.reason,
            importance: rule2.importance,
            createdAt: rule2.created_at,
          },
          conflictType: isConflicting,
          suggestion: suggestConflictResolution(rule1, rule2),
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detect if two rules conflict
 */
function detectConflict(rule1: any, rule2: any): string | null {
  const r1 = (rule1.content?.rule || '').toLowerCase();
  const r2 = (rule2.content?.rule || '').toLowerCase();

  // Check for skip vs. always patterns
  const r1Skip = r1.includes('skip') || r1.includes('ignore') || r1.includes('avoid');
  const r2Skip = r2.includes('skip') || r2.includes('ignore') || r2.includes('avoid');

  const r1Always = r1.includes('always') || r1.includes('must') || r1.includes('should');
  const r2Always = r2.includes('always') || r2.includes('must') || r2.includes('should');

  // Check for opposite patterns on similar subjects
  const pattern1 = rule1.content?.regex || '';
  const pattern2 = rule2.content?.regex || '';
  const patternType1 = rule1.content?.pattern_type || '';
  const patternType2 = rule2.content?.pattern_type || '';

  if (patternType1 === patternType2 && pattern1 === pattern2) {
    if ((r1Skip && r2Always) || (r1Always && r2Skip)) {
      return 'opposite_actions';
    }
  }

  // Check for similar patterns with different importance (high difference)
  const similarity = calculateSimilarity(
    rule1.content?.rule || '',
    rule2.content?.rule || '',
    rule1.content?.reason || '',
    rule2.content?.reason || ''
  );

  if (similarity > 0.6) {
    const importanceDiff = Math.abs(rule1.importance - rule2.importance);
    if (importanceDiff > 0.5) {
      return 'importance_mismatch';
    }
  }

  return null;
}

/**
 * Suggest resolution for conflicting rules
 */
function suggestConflictResolution(rule1: any, rule2: any): string {
  const importance1 = rule1.importance || 0.5;
  const importance2 = rule2.importance || 0.5;

  if (importance1 > importance2) {
    return `Keep rule 1 (higher importance: ${Math.round(importance1 * 100)}%), consider removing or adjusting rule 2`;
  } else if (importance2 > importance1) {
    return `Keep rule 2 (higher importance: ${Math.round(importance2 * 100)}%), consider removing or adjusting rule 1`;
  }

  // Check which is newer
  const date1 = new Date(rule1.created_at);
  const date2 = new Date(rule2.created_at);

  if (date1 > date2) {
    return `Rule 1 is newer - consider keeping it and removing rule 2`;
  } else {
    return `Rule 2 is newer - consider keeping it and removing rule 1`;
  }
}

/**
 * Find rules that should be deprecated
 */
async function findDeprecationCandidates(rules: any[], supabase: any, orgId: string) {
  const candidates: any[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const rule of rules) {
    const createdAt = new Date(rule.created_at);
    const updatedAt = new Date(rule.updated_at || rule.created_at);

    // Rule is old (30+ days) and hasn't been updated
    if (createdAt < thirtyDaysAgo && updatedAt < thirtyDaysAgo) {
      // Check if rule has been triggered recently
      const triggerCount = await checkRuleTriggers(rule, supabase, orgId, thirtyDaysAgo);

      if (triggerCount === 0) {
        candidates.push({
          type: 'deprecation',
          rule: {
            id: rule.id,
            rule: rule.content?.rule,
            reason: rule.content?.reason,
            importance: rule.importance,
            createdAt: rule.created_at,
            daysSinceCreation: Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)),
          },
          reason: 'Not triggered in the last 30 days',
          suggestion: 'Consider archiving or deleting this rule if it\'s no longer relevant',
        });
      }
    }
  }

  return candidates;
}

/**
 * Check how many times a rule has been triggered
 */
async function checkRuleTriggers(rule: any, supabase: any, orgId: string, since: Date) {
  // Look for feedback entries that reference this rule
  const { data: relatedFeedback } = await supabase
    .from('agent_memories')
    .select('id')
    .eq('org_id', orgId)
    .eq('scope', 'card_feedback')
    .gte('created_at', since.toISOString())
    .filter('content->>rule', 'eq', rule.content?.rule);

  return relatedFeedback?.length || 0;
}

/**
 * Calculate effectiveness metrics for all rules
 */
async function calculateEffectiveness(rules: any[], supabase: any, orgId: string) {
  const effectiveness: any[] = [];

  for (const rule of rules) {
    // Count how many times this rule was used
    const { data: usageCount } = await supabase
      .from('agent_memories')
      .select('id', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('scope', 'card_feedback')
      .filter('content->>rule', 'eq', rule.content?.rule);

    const triggers = usageCount?.length || 0;

    // Calculate time saved estimate (assume 2 minutes per card prevented)
    const timeSavedMinutes = triggers * 2;

    effectiveness.push({
      ruleId: rule.id,
      rule: rule.content?.rule,
      triggers,
      timeSavedMinutes,
      importance: rule.importance,
      createdAt: rule.created_at,
      effectivenessScore: calculateEffectivenessScore(triggers, rule.importance),
    });
  }

  // Sort by effectiveness score
  effectiveness.sort((a, b) => b.effectivenessScore - a.effectivenessScore);

  return effectiveness.slice(0, 10); // Top 10 most effective rules
}

/**
 * Calculate effectiveness score
 */
function calculateEffectivenessScore(triggers: number, importance: number): number {
  return triggers * importance * 10;
}
