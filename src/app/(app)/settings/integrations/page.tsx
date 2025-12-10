'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  MailCheck,
} from 'lucide-react';

interface GmailStatus {
  connected: boolean;
  tokenExpired: boolean;
  accountEmail: string | null;
  syncEnabled: boolean;
  autoProcess: boolean;
  lastSyncAt: string | null;
  pollIntervalMinutes: number;
  stats: {
    messagesProcessed: number;
    cardsCreated: number;
    autoResponded: number;
    escalated: number;
  };
}

interface ProcessedMessage {
  id: string;
  gmailMessageId: string;
  threadId: string;
  from: {
    email: string;
    name: string | null;
  };
  subject: string;
  snippet: string;
  category: string | null;
  confidence: number | null;
  receivedAt: string;
  processedAt: string | null;
  isRead: boolean;
  card: {
    id: string;
    type: string;
    state: string;
    title: string;
    priority: string;
  } | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  AMC_ORDER: 'bg-blue-100 text-blue-800',
  OPPORTUNITY: 'bg-green-100 text-green-800',
  CASE: 'bg-red-100 text-red-800',
  STATUS: 'bg-purple-100 text-purple-800',
  SCHEDULING: 'bg-cyan-100 text-cyan-800',
  UPDATES: 'bg-yellow-100 text-yellow-800',
  AP: 'bg-orange-100 text-orange-800',
  AR: 'bg-emerald-100 text-emerald-800',
  INFORMATION: 'bg-gray-100 text-gray-800',
  NOTIFICATIONS: 'bg-slate-100 text-slate-800',
  REMOVE: 'bg-pink-100 text-pink-800',
  ESCALATE: 'bg-amber-100 text-amber-800',
};

const CARD_STATE_COLORS: Record<string, string> = {
  suggested: 'bg-gray-100 text-gray-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  executing: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
  rejected: 'bg-gray-100 text-gray-800',
};

export default function IntegrationsPage() {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Processed messages state
  const [messages, setMessages] = useState<ProcessedMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [messagesPage, setMessagesPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchGmailStatus();
  }, []);

  useEffect(() => {
    if (gmailStatus?.connected) {
      fetchMessages();
    }
  }, [gmailStatus?.connected, messagesPage]);

  const fetchGmailStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/gmail/status');
      const data = await response.json();
      setGmailStatus(data);
    } catch (error) {
      console.error('Error fetching Gmail status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true);
      const offset = messagesPage * PAGE_SIZE;
      const response = await fetch(
        `/api/integrations/gmail/messages?limit=${PAGE_SIZE}&offset=${offset}`
      );
      const data = await response.json();
      setMessages(data.messages || []);
      setMessagesTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/integrations/gmail/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? This will stop all email processing.')) {
      return;
    }

    try {
      setDisconnecting(true);
      const response = await fetch('/api/integrations/gmail/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchGmailStatus();
      } else {
        alert('Failed to disconnect Gmail');
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      alert('Error disconnecting Gmail');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/agent/gmail/poll', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `Sync complete!\n\n` +
            `Messages processed: ${result.data.messagesProcessed}\n` +
            `Cards created: ${result.data.cardsCreated}\n` +
            `Auto-executed: ${result.data.autoExecutedCards}`
        );
        await fetchGmailStatus();
        await fetchMessages();
      } else {
        alert(`Sync failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error syncing Gmail:', error);
      alert('Error syncing Gmail');
    } finally {
      setSyncing(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const totalPages = Math.ceil(messagesTotal / PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Integrations</h1>

      {/* Gmail Integration Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6" />
              <div>
                <CardTitle>Gmail Integration</CardTitle>
                <CardDescription>
                  Connect your Gmail account to automatically process incoming emails
                </CardDescription>
              </div>
            </div>
            {gmailStatus?.connected ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {gmailStatus?.connected ? (
            <>
              {/* Connection Info */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Account:</span>
                  <span className="text-sm">{gmailStatus.accountEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Last Sync:</span>
                  <span className="text-sm">
                    {gmailStatus.lastSyncAt
                      ? new Date(gmailStatus.lastSyncAt).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Poll Interval:</span>
                  <span className="text-sm">{gmailStatus.pollIntervalMinutes} minutes</span>
                </div>
              </div>

              {/* Stats (Last 24h) */}
              <div>
                <h3 className="text-sm font-medium mb-2">Last 24 Hours</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">
                      {gmailStatus.stats.messagesProcessed}
                    </div>
                    <div className="text-xs text-muted-foreground">Emails Processed</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{gmailStatus.stats.cardsCreated}</div>
                    <div className="text-xs text-muted-foreground">Cards Created</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {gmailStatus.stats.autoResponded}
                    </div>
                    <div className="text-xs text-muted-foreground">Auto-Responded</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {gmailStatus.stats.escalated}
                    </div>
                    <div className="text-xs text-muted-foreground">Escalated</div>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync-enabled">Email Processing</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically process incoming emails
                    </p>
                  </div>
                  <Switch
                    id="sync-enabled"
                    checked={gmailStatus.syncEnabled}
                    disabled
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-process">Auto-Process</Label>
                    <p className="text-xs text-muted-foreground">
                      Create cards automatically (vs manual review)
                    </p>
                  </div>
                  <Switch
                    id="auto-process"
                    checked={gmailStatus.autoProcess}
                    disabled
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="flex-1"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  variant="destructive"
                  className="flex-1"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              </div>

              {gmailStatus.tokenExpired && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    Your Gmail token has expired. Please reconnect your account.
                  </p>
                  <Button onClick={handleConnect} className="mt-2" size="sm">
                    Reconnect Gmail
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Not Connected State */}
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Connect Your Gmail Account</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Enable the autonomous agent to monitor your Gmail inbox, classify incoming
                  emails, and create cards for client responses automatically.
                </p>
                <Button onClick={handleConnect} size="lg">
                  <Mail className="mr-2 h-4 w-4" />
                  Connect Gmail
                </Button>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Auto-Classification</h4>
                  <p className="text-sm text-muted-foreground">
                    AI classifies emails into 11 categories (AMC orders, status requests,
                    opportunities, etc.)
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Smart Responses</h4>
                  <p className="text-sm text-muted-foreground">
                    Auto-responds to simple requests (status updates, scheduling) with 95%+
                    confidence
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Human Escalation</h4>
                  <p className="text-sm text-muted-foreground">
                    Complex emails (complaints, orders) escalate to you with full context
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Full Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    All emails and responses logged in your activity feed and kanban board
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Processed Emails List */}
      {gmailStatus?.connected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MailCheck className="h-5 w-5" />
                  Processed Emails
                </CardTitle>
                <CardDescription>
                  {messagesTotal} emails processed • Showing {messages.length} of {messagesTotal}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMessages}
                disabled={messagesLoading}
              >
                {messagesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {messagesLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails processed yet</p>
                <p className="text-sm">Click &quot;Sync Now&quot; to process emails from your inbox</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">From</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="w-[100px]">Category</TableHead>
                        <TableHead className="w-[120px]">Action</TableHead>
                        <TableHead className="w-[100px]">Received</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((msg) => (
                        <TableRow key={msg.id}>
                          <TableCell className="font-medium">
                            <div className="truncate max-w-[180px]" title={msg.from.email}>
                              {msg.from.name || msg.from.email}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {msg.from.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="truncate max-w-[300px]" title={msg.subject}>
                              {msg.subject}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {msg.snippet}
                            </div>
                          </TableCell>
                          <TableCell>
                            {msg.category ? (
                              <Badge
                                variant="secondary"
                                className={CATEGORY_COLORS[msg.category] || 'bg-gray-100'}
                              >
                                {msg.category}
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {msg.card ? (
                              <a
                                href={`/agent?card=${msg.card.id}`}
                                className="flex items-center gap-1 text-sm hover:underline"
                              >
                                <Badge
                                  variant="secondary"
                                  className={CARD_STATE_COLORS[msg.card.state] || 'bg-gray-100'}
                                >
                                  {msg.card.state.replace('_', ' ')}
                                </Badge>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : msg.processedAt ? (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                No card
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm" title={new Date(msg.receivedAt).toLocaleString()}>
                              {formatTimeAgo(msg.receivedAt)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {messagesPage + 1} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMessagesPage((p) => Math.max(0, p - 1))}
                        disabled={messagesPage === 0 || messagesLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMessagesPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={messagesPage >= totalPages - 1 || messagesLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
