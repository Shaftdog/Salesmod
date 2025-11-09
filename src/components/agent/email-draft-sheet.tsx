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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanCard, useApproveCard, useExecuteCard, useRejectCard } from '@/hooks/use-agent';
import { Send, Check, X, Loader2, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CardReviewChat } from './card-review-chat';

interface EmailDraftSheetProps {
  card: KanbanCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailDraftSheet({ card, open, onOpenChange }: EmailDraftSheetProps) {
  const { toast } = useToast();
  const approveCard = useApproveCard();
  const executeCard = useExecuteCard();
  const rejectCard = useRejectCard();
  const [isApproving, setIsApproving] = useState(false);
  const [showReviewChat, setShowReviewChat] = useState(false);

  if (!card || card.type !== 'send_email') {
    return null;
  }

  const emailData = card.action_payload || {};

  const handleApprove = async () => {
    try {
      await approveCard.mutateAsync(card.id);
      toast({
        title: 'Card Approved',
        description: 'Email draft has been approved',
      });
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleApproveAndSend = async () => {
    setIsApproving(true);
    try {
      // First approve
      await approveCard.mutateAsync(card.id);
      
      // Then execute (send)
      await executeCard.mutateAsync(card.id);
      
      toast({
        title: 'Email Sent',
        description: `Email sent successfully to ${emailData.to}`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Send Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectAndReview = async () => {
    try {
      await rejectCard.mutateAsync(card.id);
      setShowReviewChat(true);
      toast({
        title: 'Card Rejected',
        description: 'Review this card with the AI agent below',
      });
    } catch (error: any) {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCardRevised = (newCard: any) => {
    toast({
      title: 'Card Revised',
      description: 'A new card has been created. Check the Suggested column.',
    });
    setShowReviewChat(false);
    onOpenChange(false);
  };

  const handleFeedbackStored = (feedback: any) => {
    toast({
      title: 'Feedback Stored',
      description: 'The agent will learn from this feedback.',
    });
  };

  const isApproved = card.state === 'approved';
  const isDone = card.state === 'done';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>📧</span>
            <span>Email Draft</span>
            {isDone && (
              <Badge variant="default" className="ml-auto">
                <Check className="h-3 w-3 mr-1" />
                Sent
              </Badge>
            )}
            {isApproved && !isDone && (
              <Badge variant="secondary" className="ml-auto">
                Approved
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Review and approve this email before sending
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-6">
          <div className="space-y-6">
            {/* Client Info */}
            {card.client && (
              <div>
                <h3 className="text-sm font-medium mb-2">To</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="font-medium">{card.client.company_name}</p>
                    <p className="text-sm text-muted-foreground">{emailData.to}</p>
                  </div>
                  <Badge variant="outline">{card.priority} priority</Badge>
                </div>
              </div>
            )}

            <Separator />

            {/* Rationale */}
            <div>
              <h3 className="text-sm font-medium mb-2">Why This Email?</h3>
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm">{card.rationale}</p>
              </div>
            </div>

            <Separator />

            {/* Email Content */}
            <div>
              <h3 className="text-sm font-medium mb-2">Subject</h3>
              <p className="text-sm font-medium">{emailData.subject}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Message</h3>
              <div
                className="prose prose-sm max-w-none rounded-md border p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: emailData.body }}
              />
            </div>

            {emailData.replyTo && (
              <div>
                <h3 className="text-sm font-medium mb-2">Reply To</h3>
                <p className="text-sm text-muted-foreground">{emailData.replyTo}</p>
              </div>
            )}

            {card.state === 'blocked' && card.description && (
              <div className="rounded-md bg-red-50 border-red-200 p-3">
                <div className="flex items-center gap-2 text-red-800 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Execution Failed</span>
                </div>
                <p className="text-sm text-red-700">{card.description}</p>
              </div>
            )}

            {/* Card Review Chat - shown when rejected */}
            {showReviewChat && (
              <div className="mt-6">
                <CardReviewChat
                  card={card}
                  onCardRevised={handleCardRevised}
                  onFeedbackStored={handleFeedbackStored}
                  onClose={() => setShowReviewChat(false)}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {!isDone && !isApproved && !showReviewChat && (
            <>
              <Button
                onClick={handleRejectAndReview}
                variant="outline"
                className="flex-1"
                disabled={rejectCard.isPending}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Reject & Review
              </Button>
              <Button
                onClick={handleApprove}
                variant="secondary"
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
              <Button
                onClick={handleApproveAndSend}
                className="flex-1"
                disabled={isApproving}
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Approve & Send
              </Button>
            </>
          )}

          {isApproved && !isDone && (
            <Button
              onClick={() => executeCard.mutate(card.id)}
              className="flex-1"
              disabled={executeCard.isPending}
            >
              {executeCard.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Now
            </Button>
          )}

          {isDone && (
            <div className="flex-1 text-center text-sm text-muted-foreground py-2">
              Email has been sent
            </div>
          )}

          {showReviewChat && (
            <Button
              onClick={() => {
                setShowReviewChat(false);
                onOpenChange(false);
              }}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


