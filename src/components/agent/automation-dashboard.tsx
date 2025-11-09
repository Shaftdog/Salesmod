'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Archive,
  Zap,
  Check,
  X,
  GitMerge,
  Clock,
  Target,
} from 'lucide-react';

// TypeScript interfaces
interface AutoRuleSuggestion {
  type: 'auto_rule';
  reason: string;
  occurrences: number;
  cardType: string;
  patternType: string | null;
  regex: string | null;
  suggestedRule: string;
  suggestedImportance: number;
  feedbackIds: string[];
  confidence: number;
}

interface ConsolidationSuggestion {
  type: 'consolidation';
  rule1: {
    id: string;
    rule: string;
    reason: string;
    importance: number;
  };
  rule2: {
    id: string;
    rule: string;
    reason: string;
    importance: number;
  };
  similarity: number;
  suggestedMergedRule: string;
  suggestedImportance: number;
}

interface Conflict {
  type: 'conflict';
  rule1: {
    id: string;
    rule: string;
    reason: string;
    importance: number;
    createdAt: string;
  };
  rule2: {
    id: string;
    rule: string;
    reason: string;
    importance: number;
    createdAt: string;
  };
  conflictType: string;
  suggestion: string;
}

interface DeprecationCandidate {
  type: 'deprecation';
  rule: {
    id: string;
    rule: string;
    reason: string;
    importance: number;
    createdAt: string;
    daysSinceCreation: number;
  };
  reason: string;
  suggestion: string;
}

interface EffectivenessMetric {
  ruleId: string;
  rule: string;
  triggers: number;
  timeSavedMinutes: number;
  importance: number;
  createdAt: string;
  effectivenessScore: number;
}

interface AutomationData {
  autoRuleSuggestions: AutoRuleSuggestion[];
  consolidationSuggestions: ConsolidationSuggestion[];
  conflicts: Conflict[];
  deprecationCandidates: DeprecationCandidate[];
  effectiveness: EffectivenessMetric[];
}

interface AutomationStats {
  totalRules: number;
  totalFeedback: number;
  suggestionsCount: number;
  consolidationCount: number;
  conflictsCount: number;
  deprecationCount: number;
}

export function AutomationDashboard() {
  const [automation, setAutomation] = useState<AutomationData | null>(null);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    fetchAutomation();
  }, []);

  const fetchAutomation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/agent/automation/analyze', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch automation data');
      }

      const data = await response.json();
      setAutomation(data.automation);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (action: string, data: any) => {
    try {
      setIsExecuting(true);

      const response = await fetch('/api/agent/automation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute action');
      }

      setActionDialogOpen(false);
      setCurrentAction(null);

      // Refresh automation data
      await fetchAutomation();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const openActionDialog = (actionType: string, actionData: any) => {
    setCurrentAction({ type: actionType, data: actionData });
    setActionDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Analyzing learning data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" onClick={fetchAutomation} className="ml-4">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!automation || !stats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No automation data available</AlertDescription>
      </Alert>
    );
  }

  const totalSuggestions =
    stats.suggestionsCount + stats.consolidationCount + stats.conflictsCount + stats.deprecationCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Automation Insights
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered suggestions to optimize your learning rules
          </p>
        </div>
        <Button onClick={fetchAutomation} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuggestions}</div>
            <p className="text-xs text-muted-foreground">Pending actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Rules</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suggestionsCount}</div>
            <p className="text-xs text-muted-foreground">Ready to create</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conflictsCount}</div>
            <p className="text-xs text-muted-foreground">Need resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consolidations</CardTitle>
            <GitMerge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consolidationCount}</div>
            <p className="text-xs text-muted-foreground">Can be merged</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Rule Suggestions */}
      {automation.autoRuleSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Auto-Rule Suggestions
              <Badge variant="secondary">{automation.autoRuleSuggestions.length}</Badge>
            </CardTitle>
            <CardDescription>
              Create rules automatically based on repeated feedback patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {automation.autoRuleSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{suggestion.cardType}</Badge>
                          <Badge variant="secondary">{suggestion.occurrences}x occurrences</Badge>
                          <Badge
                            variant={suggestion.confidence > 0.8 ? 'default' : 'secondary'}
                            className={
                              suggestion.confidence > 0.8
                                ? 'bg-green-500 hover:bg-green-600'
                                : ''
                            }
                          >
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="font-medium mb-1">{suggestion.suggestedRule}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Reason: {suggestion.reason}
                        </p>
                        {suggestion.regex && (
                          <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                            Pattern: {suggestion.regex}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">Importance: </span>
                          <div className="inline-block w-24 h-2 bg-muted rounded-full overflow-hidden align-middle ml-2">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
                              style={{ width: `${suggestion.suggestedImportance * 100}%` }}
                            />
                          </div>
                          <span className="text-xs ml-2">
                            {Math.round(suggestion.suggestedImportance * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            openActionDialog('create_auto_rule', {
                              suggestedRule: suggestion.suggestedRule,
                              reason: suggestion.reason,
                              cardType: suggestion.cardType,
                              patternType: suggestion.patternType,
                              regex: suggestion.regex,
                              suggestedImportance: suggestion.suggestedImportance,
                              feedbackIds: suggestion.feedbackIds,
                            })
                          }
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Create Rule
                        </Button>
                        <Button size="sm" variant="ghost">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Consolidation Suggestions */}
      {automation.consolidationSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-blue-500" />
              Rule Consolidation
              <Badge variant="secondary">{automation.consolidationSuggestions.length}</Badge>
            </CardTitle>
            <CardDescription>Merge similar rules to reduce redundancy</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {automation.consolidationSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {Math.round(suggestion.similarity * 100)}% similar
                          </Badge>
                        </div>

                        {/* Rule 1 */}
                        <div className="bg-muted/50 p-3 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Rule 1:</p>
                          <p className="text-sm font-medium">{suggestion.rule1.rule}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.rule1.reason}
                          </p>
                        </div>

                        {/* Rule 2 */}
                        <div className="bg-muted/50 p-3 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Rule 2:</p>
                          <p className="text-sm font-medium">{suggestion.rule2.rule}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.rule2.reason}
                          </p>
                        </div>

                        <Separator />

                        {/* Merged Result */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Merged Rule:</p>
                          <p className="text-sm font-medium">{suggestion.suggestedMergedRule}</p>
                          <div className="mt-2">
                            <span className="text-xs text-muted-foreground">Importance: </span>
                            <span className="text-xs ml-2">
                              {Math.round(suggestion.suggestedImportance * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            openActionDialog('consolidate_rules', {
                              rule1Id: suggestion.rule1.id,
                              rule2Id: suggestion.rule2.id,
                              mergedRule: suggestion.suggestedMergedRule,
                              mergedImportance: suggestion.suggestedImportance,
                            })
                          }
                        >
                          <GitMerge className="h-4 w-4 mr-1" />
                          Merge
                        </Button>
                        <Button size="sm" variant="ghost">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Conflicts */}
      {automation.conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Rule Conflicts
              <Badge variant="destructive">{automation.conflicts.length}</Badge>
            </CardTitle>
            <CardDescription>Resolve contradictory rules</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {automation.conflicts.map((conflict, index) => (
                  <div key={index} className="border-2 border-red-200 dark:border-red-900 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{conflict.conflictType}</Badge>
                        </div>

                        {/* Rule 1 */}
                        <div className="bg-muted/50 p-3 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-muted-foreground">Rule 1:</p>
                            <Badge variant="outline">
                              {Math.round(conflict.rule1.importance * 100)}% importance
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{conflict.rule1.rule}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conflict.rule1.reason}
                          </p>
                        </div>

                        {/* Rule 2 */}
                        <div className="bg-muted/50 p-3 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-muted-foreground">Rule 2:</p>
                            <Badge variant="outline">
                              {Math.round(conflict.rule2.importance * 100)}% importance
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{conflict.rule2.rule}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {conflict.rule2.reason}
                          </p>
                        </div>

                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {conflict.suggestion}
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openActionDialog('resolve_conflict', {
                              keepRuleId: conflict.rule1.id,
                              removeRuleId: conflict.rule2.id,
                              resolution: 'keep_rule1',
                            })
                          }
                        >
                          Keep #1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openActionDialog('resolve_conflict', {
                              keepRuleId: conflict.rule2.id,
                              removeRuleId: conflict.rule1.id,
                              resolution: 'keep_rule2',
                            })
                          }
                        >
                          Keep #2
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            openActionDialog('resolve_conflict', {
                              keepRuleId: conflict.rule1.id,
                              removeRuleId: conflict.rule2.id,
                              resolution: 'keep_both',
                            })
                          }
                        >
                          Keep Both
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Deprecation Candidates */}
      {automation.deprecationCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-500" />
              Deprecation Candidates
              <Badge variant="secondary">{automation.deprecationCandidates.length}</Badge>
            </CardTitle>
            <CardDescription>Archive unused rules to keep your system clean</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {automation.deprecationCandidates.map((candidate, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {candidate.rule.daysSinceCreation} days old
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{candidate.rule.rule}</p>
                        <p className="text-xs text-muted-foreground">{candidate.reason}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openActionDialog('deprecate_rule', {
                            ruleId: candidate.rule.id,
                            reason: candidate.reason,
                          })
                        }
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Top Effective Rules */}
      {automation.effectiveness.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Performing Rules
            </CardTitle>
            <CardDescription>Rules with the highest impact and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automation.effectiveness.map((metric, index) => (
                <div key={metric.ruleId} className="flex items-center gap-4 border rounded-lg p-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-green-500 text-white font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{metric.rule}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {metric.triggers} triggers
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ~{metric.timeSavedMinutes} min saved
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Score: {metric.effectivenessScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {Math.round(metric.importance * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">importance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Suggestions */}
      {totalSuggestions === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Check className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
            <p className="text-sm text-muted-foreground text-center">
              No automation suggestions at the moment. Your learning rules are well optimized.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {currentAction?.type === 'create_auto_rule' &&
                'This will create a new learning rule based on the pattern detected.'}
              {currentAction?.type === 'consolidate_rules' &&
                'This will merge the two rules into one and archive the originals.'}
              {currentAction?.type === 'resolve_conflict' &&
                'This will resolve the conflict between the rules.'}
              {currentAction?.type === 'deprecate_rule' &&
                'This will archive the rule and it will no longer be used.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={isExecuting}>
              Cancel
            </Button>
            <Button
              onClick={() => handleExecuteAction(currentAction?.type, currentAction?.data)}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
