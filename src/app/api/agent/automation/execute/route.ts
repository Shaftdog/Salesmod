import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

/**
 * POST /api/agent/automation/execute
 * Execute automation actions (create rule, consolidate, resolve conflict, deprecate)
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

    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'create_auto_rule':
        result = await createAutoRule(supabase, user.id, data);
        break;

      case 'consolidate_rules':
        result = await consolidateRules(supabase, user.id, data);
        break;

      case 'resolve_conflict':
        result = await resolveConflict(supabase, user.id, data);
        break;

      case 'deprecate_rule':
        result = await deprecateRule(supabase, user.id, data);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result,
      message: getSuccessMessage(action),
    });
  } catch (error: any) {
    console.error('[Automation Execute] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new rule from auto-suggestion
 */
async function createAutoRule(supabase: any, orgId: string, data: any) {
  const { suggestedRule, reason, cardType, patternType, regex, suggestedImportance, feedbackIds } = data;

  const timestamp = Date.now();
  const key = `auto_rule_${timestamp}`;

  const content = {
    type: 'auto_generated_rule',
    rule: suggestedRule,
    reason,
    card_type: cardType,
    pattern_type: patternType || null,
    regex: regex || null,
    source_feedback_ids: feedbackIds || [],
    auto_generated: true,
    action: 'reject',
  };

  const { data: newRule, error } = await supabase
    .from('agent_memories')
    .insert({
      org_id: orgId,
      scope: 'card_feedback',
      key,
      content,
      importance: suggestedImportance || 0.6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create auto rule: ${error.message}`);
  }

  return { ruleId: newRule.id, key };
}

/**
 * Consolidate two rules into one
 */
async function consolidateRules(supabase: any, orgId: string, data: any) {
  const { rule1Id, rule2Id, mergedRule, mergedImportance } = data;

  // Fetch both rules
  const { data: rules, error: fetchError } = await supabase
    .from('agent_memories')
    .select('*')
    .eq('org_id', orgId)
    .in('id', [rule1Id, rule2Id]);

  if (fetchError || !rules || rules.length !== 2) {
    throw new Error('Failed to fetch rules for consolidation');
  }

  const [r1, r2] = rules;

  // Create consolidated rule
  const timestamp = Date.now();
  const key = `consolidated_rule_${timestamp}`;

  const content = {
    type: 'consolidated_rule',
    rule: mergedRule,
    reason: `Consolidated from: "${r1.content?.reason || ''}" and "${r2.content?.reason || ''}"`,
    card_type: r1.content?.card_type,
    pattern_type: r1.content?.pattern_type || r2.content?.pattern_type,
    regex: r1.content?.regex || r2.content?.regex,
    consolidated_from: [rule1Id, rule2Id],
    action: r1.content?.action || 'reject',
  };

  // Insert new consolidated rule
  const { data: newRule, error: insertError } = await supabase
    .from('agent_memories')
    .insert({
      org_id: orgId,
      scope: 'card_feedback',
      key,
      content,
      importance: mergedImportance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create consolidated rule: ${insertError.message}`);
  }

  // Archive old rules (mark them as deprecated in content)
  await supabase
    .from('agent_memories')
    .update({
      content: {
        ...r1.content,
        deprecated: true,
        deprecated_reason: 'Consolidated into new rule',
        consolidated_into: newRule.id,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', rule1Id);

  await supabase
    .from('agent_memories')
    .update({
      content: {
        ...r2.content,
        deprecated: true,
        deprecated_reason: 'Consolidated into new rule',
        consolidated_into: newRule.id,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', rule2Id);

  return { ruleId: newRule.id, archivedRules: [rule1Id, rule2Id] };
}

/**
 * Resolve a conflict between two rules
 */
async function resolveConflict(supabase: any, orgId: string, data: any) {
  const { keepRuleId, removeRuleId, resolution } = data;

  if (resolution === 'keep_both') {
    // User wants to keep both, just mark as reviewed
    const { error } = await supabase
      .from('agent_memories')
      .update({
        content: supabase.rpc('jsonb_set', {
          target: supabase.ref('content'),
          path: '{conflict_reviewed}',
          new_value: 'true',
        }),
        updated_at: new Date().toISOString(),
      })
      .in('id', [keepRuleId, removeRuleId]);

    if (error) {
      throw new Error(`Failed to mark conflict as reviewed: ${error.message}`);
    }

    return { action: 'kept_both', reviewedRules: [keepRuleId, removeRuleId] };
  }

  // Fetch the rule to remove
  const { data: ruleToRemove, error: fetchError } = await supabase
    .from('agent_memories')
    .select('*')
    .eq('id', removeRuleId)
    .eq('org_id', orgId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch rule: ${fetchError.message}`);
  }

  // Mark as deprecated
  const { error: updateError } = await supabase
    .from('agent_memories')
    .update({
      content: {
        ...ruleToRemove.content,
        deprecated: true,
        deprecated_reason: `Conflict resolved - keeping rule ${keepRuleId}`,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', removeRuleId);

  if (updateError) {
    throw new Error(`Failed to deprecate rule: ${updateError.message}`);
  }

  return { action: 'removed_conflicting_rule', keptRule: keepRuleId, removedRule: removeRuleId };
}

/**
 * Deprecate (archive) a rule
 */
async function deprecateRule(supabase: any, orgId: string, data: any) {
  const { ruleId, reason } = data;

  // Fetch the rule
  const { data: rule, error: fetchError } = await supabase
    .from('agent_memories')
    .select('*')
    .eq('id', ruleId)
    .eq('org_id', orgId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch rule: ${fetchError.message}`);
  }

  // Mark as deprecated
  const { error: updateError } = await supabase
    .from('agent_memories')
    .update({
      content: {
        ...rule.content,
        deprecated: true,
        deprecated_reason: reason || 'Not used in the last 30 days',
        deprecated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId);

  if (updateError) {
    throw new Error(`Failed to deprecate rule: ${updateError.message}`);
  }

  return { ruleId, deprecated: true };
}

/**
 * Get success message for action
 */
function getSuccessMessage(action: string): string {
  switch (action) {
    case 'create_auto_rule':
      return 'Auto-rule created successfully';
    case 'consolidate_rules':
      return 'Rules consolidated successfully';
    case 'resolve_conflict':
      return 'Conflict resolved successfully';
    case 'deprecate_rule':
      return 'Rule deprecated successfully';
    default:
      return 'Action completed successfully';
  }
}
