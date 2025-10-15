'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useLatestRun,
  useKanbanCards,
  useTriggerRun,
  useAgentSettings,
  useAgentStats,
} from '@/hooks/use-agent';
import { Play, Loader2, TrendingUp, Mail, Target, CheckCircle, MessageSquare, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AgentChat } from './agent-chat';

interface AgentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentPanel({ open, onOpenChange }: AgentPanelProps) {
  const { toast } = useToast();
  const { data: latestRun } = useLatestRun();
  const { data: settings } = useAgentSettings();
  const { data: stats } = useAgentStats(30);
  const { data: upcomingCards } = useKanbanCards('suggested');
  const triggerRun = useTriggerRun();

  const handleTriggerRun = async () => {
    try {
      await triggerRun.mutateAsync('review');
      toast({
        title: 'Agent Started',
        description: 'Agent work cycle has been triggered',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Start',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusInfo = () => {
    if (!latestRun) {
      return { label: 'Idle', color: 'bg-gray-500' };
    }
    
    switch (latestRun.status) {
      case 'running':
        return { label: 'Working', color: 'bg-blue-500 animate-pulse' };
      case 'completed':
        return { label: 'Idle', color: 'bg-green-500' };
      case 'failed':
        return { label: 'Error', color: 'bg-red-500' };
      default:
        return { label: 'Idle', color: 'bg-gray-500' };
    }
  };

  const status = getStatusInfo();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>🤖</span>
            <span>AI Agent</span>
          </SheetTitle>
          <SheetDescription>
            Chat with your AI account manager
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="control" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Control
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 mt-4">
            <AgentChat />
          </TabsContent>

          {/* Control Panel Tab */}
          <TabsContent value="control" className="flex-1 mt-4 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Status</span>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', status.color)} />
                    <span className="text-sm font-normal">{status.label}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mode">Review Mode</Label>
                    <Switch
                      id="mode"
                      checked={settings?.mode === 'review'}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All actions require approval before execution
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trigger Run */}
            <Button
              onClick={handleTriggerRun}
              disabled={triggerRun.isPending || latestRun?.status === 'running'}
              className="w-full"
            >
              {triggerRun.isPending || latestRun?.status === 'running' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Agent Cycle
                </>
              )}
            </Button>

            <Separator />

            {/* Mini Telemetry */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Performance (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Target className="h-3 w-3" />
                      <span className="text-xs">Cards Created</span>
                    </div>
                    <p className="text-2xl font-bold">{stats?.totalCards || 0}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="text-xs">Emails Sent</span>
                    </div>
                    <p className="text-2xl font-bold">{stats?.emailsSent || 0}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs">Approval Rate</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {stats?.approvalRate ? `${stats.approvalRate.toFixed(0)}%` : '0%'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">Work Cycles</span>
                    </div>
                    <p className="text-2xl font-bold">{stats?.totalRuns || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latest Run Info */}
            {latestRun && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Latest Run</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started</span>
                      <span>{new Date(latestRun.started_at).toLocaleTimeString()}</span>
                    </div>
                    {latestRun.ended_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ended</span>
                        <span>{new Date(latestRun.ended_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actions Planned</span>
                      <span>{latestRun.planned_actions}</span>
                    </div>
                    {latestRun.goal_pressure !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Goal Pressure</span>
                        <Badge variant={latestRun.goal_pressure > 0.5 ? 'destructive' : 'secondary'}>
                          {(latestRun.goal_pressure * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Upcoming Actions</span>
                  <Badge variant="secondary">{upcomingCards?.length || 0}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingCards && upcomingCards.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingCards.slice(0, 3).map((card) => (
                      <div key={card.id} className="text-sm border-l-2 border-blue-500 pl-2">
                        <p className="font-medium">{card.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {card.client?.company_name}
                        </p>
                      </div>
                    ))}
                    {upcomingCards.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{upcomingCards.length - 3} more
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending actions
                  </p>
                )}
              </CardContent>
            </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}


