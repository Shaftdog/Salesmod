'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

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

export default function IntegrationsPage() {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchGmailStatus();
  }, []);

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
                    ⚠️ Your Gmail token has expired. Please reconnect your account.
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
                  <h4 className="font-medium mb-2">🤖 Auto-Classification</h4>
                  <p className="text-sm text-muted-foreground">
                    AI classifies emails into 11 categories (AMC orders, status requests,
                    opportunities, etc.)
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">✉️ Smart Responses</h4>
                  <p className="text-sm text-muted-foreground">
                    Auto-responds to simple requests (status updates, scheduling) with 95%+
                    confidence
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">👤 Human Escalation</h4>
                  <p className="text-sm text-muted-foreground">
                    Complex emails (complaints, orders) escalate to you with full context
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">📊 Full Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    All emails and responses logged in your activity feed and kanban board
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
