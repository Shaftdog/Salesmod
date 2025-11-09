'use client';

import { useState } from 'react';
import { KanbanBoard } from '@/components/agent/kanban-board';
import { AgentPanel } from '@/components/agent/agent-panel';
import { EmailDraftSheet } from '@/components/agent/email-draft-sheet';
import { CardDetailSheet } from '@/components/agent/card-detail-sheet';
import { JobsFilterBar } from '@/components/agent/jobs-filter-bar';
import { AgentLearningDashboard } from '@/components/agent/learning-dashboard';
import { RulesManagement } from '@/components/agent/rules-management';
import { AutomationDashboard } from '@/components/agent/automation-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanCard, useAgentStats } from '@/hooks/use-agent';
import { Bot, BarChart3, Mail, Target, CheckCircle, Brain, Kanban, Settings, Zap } from 'lucide-react';

export default function AgentPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isDraftSheetOpen, setIsDraftSheetOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { data: stats } = useAgentStats(30);

  const handleCardClick = (card: KanbanCard) => {
    setSelectedCard(card);
    if (card.type === 'send_email') {
      setIsDraftSheetOpen(true);
    } else {
      setIsDetailSheetOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Agent Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated account management and outreach
          </p>
        </div>
        <Button onClick={() => setIsPanelOpen(true)}>
          <Bot className="h-4 w-4 mr-2" />
          Agent Control Panel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emailsSent || 0}</div>
            <p className="text-xs text-muted-foreground">Delivered successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.approvalRate ? `${stats.approvalRate.toFixed(0)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Cards approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.completionRate ? `${stats.completionRate.toFixed(0)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Of approved cards</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Board, Learning Dashboard, Rules Management, and Automation */}
      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">
            <Kanban className="h-4 w-4 mr-2" />
            Board
          </TabsTrigger>
          <TabsTrigger value="learning">
            <Brain className="h-4 w-4 mr-2" />
            Learning
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-2" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Zap className="h-4 w-4 mr-2" />
            Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          {/* Jobs Filter */}
          <JobsFilterBar
            selectedJobId={selectedJobId}
            onJobSelect={setSelectedJobId}
          />

          {/* Kanban Board */}
          <div>
            <KanbanBoard onCardClick={handleCardClick} jobId={selectedJobId || undefined} />
          </div>
        </TabsContent>

        <TabsContent value="learning">
          <AgentLearningDashboard />
        </TabsContent>

        <TabsContent value="rules">
          <RulesManagement />
        </TabsContent>

        <TabsContent value="automation">
          <AutomationDashboard />
        </TabsContent>
      </Tabs>

      {/* Agent Panel */}
      <AgentPanel open={isPanelOpen} onOpenChange={setIsPanelOpen} />

      {/* Email Draft Sheet */}
      <EmailDraftSheet
        card={selectedCard}
        open={isDraftSheetOpen}
        onOpenChange={setIsDraftSheetOpen}
      />

      {/* Card Detail Sheet (for non-email cards) */}
      <CardDetailSheet
        card={selectedCard}
        open={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
      />
    </div>
  );
}


