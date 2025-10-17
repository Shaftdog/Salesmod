'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanCard, useApproveCard, useExecuteCard, useRejectCard } from '@/hooks/use-agent';
import { Send, Check, X, Loader2, AlertCircle, Calendar, DollarSign, Phone, FileSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CardDetailSheetProps {
  card: KanbanCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDetailSheet({ card, open, onOpenChange }: CardDetailSheetProps) {
  const { toast } = useToast();
  const approveCard = useApproveCard();
  const executeCard = useExecuteCard();
  const rejectCard = useRejectCard();

  if (!card) {
    return null;
  }

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'send_email': return <Send className="h-5 w-5" />;
      case 'create_task': return <Check className="h-5 w-5" />;
      case 'schedule_call': return <Phone className="h-5 w-5" />;
      case 'create_deal': return <DollarSign className="h-5 w-5" />;
      case 'research': return <FileSearch className="h-5 w-5" />;
      default: return <Check className="h-5 w-5" />;
    }
  };

  const getCardTypeLabel = (type: string) => {
    switch (type) {
      case 'send_email': return 'Email';
      case 'create_task': return 'Task';
      case 'schedule_call': return 'Call';
      case 'create_deal': return 'Deal';
      case 'research': return 'Research';
      case 'follow_up': return 'Follow-up';
      default: return type;
    }
  };

  const handleApprove = async () => {
    try {
      await approveCard.mutateAsync(card.id);
      toast({
        title: 'Card Approved',
        description: `${card.title} has been approved`,
      });
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async () => {
    try {
      await executeCard.mutateAsync(card.id);
      toast({
        title: 'Executed Successfully',
        description: `${card.title} has been completed`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Execution Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    try {
      await rejectCard.mutateAsync(card.id);
      toast({
        title: 'Card Rejected',
        description: `${card.title} has been rejected`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isApproved = card.state === 'approved';
  const isDone = card.state === 'done';
  const isBlocked = card.state === 'blocked';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {getCardIcon(card.type)}
            <span>{getCardTypeLabel(card.type)}</span>
            {isDone && (
              <Badge variant="default" className="ml-auto">
                <Check className="h-3 w-3 mr-1" />
                Done
              </Badge>
            )}
            {isApproved && !isDone && (
              <Badge variant="secondary" className="ml-auto">
                Approved
              </Badge>
            )}
            {isBlocked && (
              <Badge variant="destructive" className="ml-auto">
                Blocked
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {card.title}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-6">
          <div className="space-y-6">
            {/* Client Info */}
            {card.client && (
              <div>
                <h3 className="text-sm font-medium mb-2">Client</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="font-medium">{card.client.company_name}</p>
                    {card.client.email && (
                      <p className="text-sm text-muted-foreground">{card.client.email}</p>
                    )}
                  </div>
                  <Badge variant="outline">{card.priority} priority</Badge>
                </div>
              </div>
            )}

            <Separator />

            {/* Rationale */}
            <div>
              <h3 className="text-sm font-medium mb-2">Why This Action?</h3>
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm">{card.rationale}</p>
              </div>
            </div>

            <Separator />

            {/* Action Details */}
            <div>
              <h3 className="text-sm font-medium mb-2">Action Details</h3>
              
              {card.type === 'send_email' && card.action_payload && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">To</p>
                    <p className="text-sm font-medium">{card.action_payload.to}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Subject</p>
                    <p className="text-sm font-medium">{card.action_payload.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Message</p>
                    <div
                      className="prose prose-sm max-w-none rounded-md border p-4 bg-white text-sm"
                      dangerouslySetInnerHTML={{ __html: card.action_payload.body }}
                    />
                  </div>
                </div>
              )}

              {card.type === 'create_task' && card.action_payload && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Task Description</p>
                    <p className="text-sm">{card.action_payload.description || card.rationale}</p>
                  </div>
                  {card.action_payload.dueDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <p className="text-sm">{new Date(card.action_payload.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {card.type === 'create_deal' && card.action_payload && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Deal Title</p>
                    <p className="text-sm font-medium">{card.action_payload.title || card.title}</p>
                  </div>
                  {card.action_payload.value && (
                    <div>
                      <p className="text-xs text-muted-foreground">Deal Value</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <p className="text-sm font-medium">${card.action_payload.value.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Stage</p>
                    <Badge>{card.action_payload.stage || 'lead'}</Badge>
                  </div>
                  {card.action_payload.description && (
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-sm">{card.action_payload.description}</p>
                    </div>
                  )}
                </div>
              )}

              {card.type === 'schedule_call' && card.action_payload && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Call Purpose</p>
                    <p className="text-sm">{card.title}</p>
                  </div>
                  {card.action_payload.scheduledAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Scheduled For</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <p className="text-sm">{new Date(card.action_payload.scheduledAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {card.action_payload.durationMinutes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm">{card.action_payload.durationMinutes} minutes</p>
                    </div>
                  )}
                </div>
              )}

              {card.type === 'research' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Research Scope</p>
                    <p className="text-sm">{card.description || card.rationale}</p>
                  </div>
                  <div className="rounded-md bg-blue-50 p-3 text-sm">
                    <p className="font-medium mb-2">What the agent will do:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Gather all internal data (orders, activities, contacts)</li>
                      <li>• Search the web for company information (Tavily)</li>
                      <li>• Analyze and summarize findings with AI</li>
                      <li>• Store results in activities, RAG, and memories</li>
                      <li>• Make searchable forever</li>
                    </ul>
                  </div>
                </div>
              )}

              {card.type === 'follow_up' && (
                <div>
                  <p className="text-xs text-muted-foreground">Follow-up Details</p>
                  <p className="text-sm">{card.description || card.rationale}</p>
                </div>
              )}
            </div>

            {card.description && card.state === 'blocked' && (
              <div className="rounded-md bg-red-50 border-red-200 p-3">
                <div className="flex items-center gap-2 text-red-800 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Execution Failed</span>
                </div>
                <p className="text-sm text-red-700">{card.description}</p>
              </div>
            )}

            {card.executed_at && (
              <div className="rounded-md bg-green-50 border-green-200 p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Executed on {new Date(card.executed_at).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {!isDone && !isApproved && !isBlocked && (
            <>
              <Button
                onClick={handleReject}
                variant="outline"
                className="flex-1"
                disabled={rejectCard.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                className="flex-1"
                disabled={approveCard.isPending}
              >
                {approveCard.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
            </>
          )}

          {isApproved && !isDone && (
            <div className="flex-1">
              <div className="text-sm text-muted-foreground text-center py-2 mb-2">
                💡 This card will execute when you click "Start Agent Cycle"
              </div>
              <Button
                onClick={handleExecute}
                className="w-full"
                disabled={executeCard.isPending}
              >
                {executeCard.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Execute Now
              </Button>
            </div>
          )}

          {isDone && (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2">
              ✓ This action has been completed
            </div>
          )}

          {isBlocked && (
            <div className="flex-1">
              <Button
                onClick={() => approveCard.mutate(card.id)}
                variant="outline"
                className="w-full"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

