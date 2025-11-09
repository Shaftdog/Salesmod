'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings,
  Trash2,
  Edit,
  TestTube2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface LearningRule {
  id: string;
  key: string;
  rule: string;
  reason: string;
  cardType: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
  isBatch: boolean;
  metadata: {
    cardIds: string[];
    action: string | null;
    patternType: string | null;
    regex: string | null;
  };
}

interface TestResult {
  affectedCardsCount: number;
  totalPendingCards: number;
  cardTypeDistribution: Record<string, number>;
  sampleCards: Array<{
    id: string;
    title: string;
    type: string;
    contactName: string;
    contactEmail: string;
    companyName: string;
  }>;
  message: string;
}

export function RulesManagement() {
  const [rules, setRules] = useState<LearningRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<LearningRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [cardTypeFilter, setCardTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'importance'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LearningRule | null>(null);
  const [editForm, setEditForm] = useState({
    rule: '',
    reason: '',
    importance: 0.5,
    cardType: '',
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<LearningRule | null>(null);

  // Test dialog state
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testingRule, setTestingRule] = useState<LearningRule | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTestingRule, setIsTestingRule] = useState(false);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        limit: '100',
      });

      if (cardTypeFilter !== 'all') {
        params.append('cardType', cardTypeFilter);
      }

      const response = await fetch(`/api/agent/learning/rules?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rules');
      }

      const data = await response.json();
      setRules(data.rules || []);
      setFilteredRules(data.rules || []);
    } catch (err: any) {
      console.error('[Rules Management] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [sortBy, sortOrder, cardTypeFilter]);

  const handleEditRule = (rule: LearningRule) => {
    setEditingRule(rule);
    setEditForm({
      rule: rule.rule,
      reason: rule.reason,
      importance: rule.importance,
      cardType: rule.cardType,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRule) return;

    try {
      const response = await fetch('/api/agent/learning/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRule.id,
          rule: editForm.rule,
          reason: editForm.reason,
          importance: editForm.importance,
          cardType: editForm.cardType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rule');
      }

      setEditDialogOpen(false);
      setEditingRule(null);
      fetchRules(); // Refresh the list
    } catch (err: any) {
      console.error('[Rules Management] Error updating rule:', err);
      setError(err.message);
    }
  };

  const handleDeleteRule = (rule: LearningRule) => {
    setDeletingRule(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRule) return;

    try {
      const response = await fetch(`/api/agent/learning/rules?id=${deletingRule.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete rule');
      }

      setDeleteDialogOpen(false);
      setDeletingRule(null);
      fetchRules(); // Refresh the list
    } catch (err: any) {
      console.error('[Rules Management] Error deleting rule:', err);
      setError(err.message);
    }
  };

  const handleTestRule = async (rule: LearningRule) => {
    setTestingRule(rule);
    setTestDialogOpen(true);
    setIsTestingRule(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/agent/learning/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule: rule.rule,
          cardType: rule.cardType,
          patternType: rule.metadata.patternType,
          regex: rule.metadata.regex,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to test rule');
      }

      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      console.error('[Rules Management] Error testing rule:', err);
      setError(err.message);
    } finally {
      setIsTestingRule(false);
    }
  };

  const handleToggleSort = (column: 'created_at' | 'importance') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchRules} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const uniqueCardTypes = ['all', ...Array.from(new Set(rules.map((r) => r.cardType)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Rules Management
          </h2>
          <p className="text-muted-foreground mt-1">
            View, edit, and manage learning rules ({rules.length} total)
          </p>
        </div>
        <Button onClick={fetchRules} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="cardTypeFilter">Card Type</Label>
            <Select value={cardTypeFilter} onValueChange={setCardTypeFilter}>
              <SelectTrigger id="cardTypeFilter">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCardTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label>Sort By</Label>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'created_at' ? 'default' : 'outline'}
                onClick={() => handleToggleSort('created_at')}
                className="flex-1"
              >
                Date
                {sortBy === 'created_at' && (
                  <ArrowUpDown className={`h-3 w-3 ml-2 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                )}
              </Button>
              <Button
                variant={sortBy === 'importance' ? 'default' : 'outline'}
                onClick={() => handleToggleSort('importance')}
                className="flex-1"
              >
                Importance
                {sortBy === 'importance' && (
                  <ArrowUpDown className={`h-3 w-3 ml-2 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Rules</CardTitle>
          <CardDescription>
            {filteredRules.length} rule{filteredRules.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Rule</TableHead>
                  <TableHead className="w-[200px]">Reason</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[120px]">Importance</TableHead>
                  <TableHead className="w-[150px]">Created</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No rules found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-2">
                          {rule.isBatch && <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />}
                          <span className="line-clamp-2">{rule.rule}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-2 text-sm text-muted-foreground">{rule.reason}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rule.cardType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
                              style={{ width: `${rule.importance * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(rule.importance * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(rule.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestRule(rule)}
                            title="Test rule"
                          >
                            <TestTube2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                            title="Edit rule"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule)}
                            title="Delete rule"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Learning Rule</DialogTitle>
            <DialogDescription>
              Modify the rule details and importance level
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-rule">Rule</Label>
              <Textarea
                id="edit-rule"
                value={editForm.rule}
                onChange={(e) => setEditForm({ ...editForm, rule: e.target.value })}
                placeholder="Enter rule description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reason">Reason</Label>
              <Input
                id="edit-reason"
                value={editForm.reason}
                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                placeholder="Enter reason..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cardType">Card Type</Label>
              <Select value={editForm.cardType} onValueChange={(value) => setEditForm({ ...editForm, cardType: value })}>
                <SelectTrigger id="edit-cardType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_email">Send Email</SelectItem>
                  <SelectItem value="create_task">Create Task</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="create_deal">Create Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-importance">
                Importance: {Math.round(editForm.importance * 100)}%
              </Label>
              <Slider
                id="edit-importance"
                value={[editForm.importance]}
                onValueChange={([value]) => setEditForm({ ...editForm, importance: value })}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher importance means the rule will have more weight in decision making
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the learning rule:
              <br />
              <br />
              <strong>&quot;{deletingRule?.rule}&quot;</strong>
              <br />
              <br />
              This action cannot be undone. The AI will no longer use this rule for future decisions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Rule Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Test Rule Impact</DialogTitle>
            <DialogDescription>
              See how many pending cards this rule would affect
            </DialogDescription>
          </DialogHeader>

          {isTestingRule ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : testResult ? (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Impact Summary</p>
                <p className="text-2xl font-bold">
                  {testResult.affectedCardsCount} of {testResult.totalPendingCards} pending cards
                </p>
                <p className="text-sm text-muted-foreground mt-1">{testResult.message}</p>
              </div>

              {Object.keys(testResult.cardTypeDistribution).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Affected Card Types</p>
                  <div className="space-y-2">
                    {Object.entries(testResult.cardTypeDistribution).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-2 rounded-lg border">
                        <Badge variant="secondary">{type}</Badge>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {testResult.sampleCards.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Sample Cards (first 5)</p>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {testResult.sampleCards.map((card) => (
                        <div key={card.id} className="p-3 rounded-lg border bg-card text-card-foreground">
                          <p className="text-sm font-medium">{card.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {card.contactName} • {card.contactEmail}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {card.companyName} • {card.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Failed to test rule. Please try again.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
