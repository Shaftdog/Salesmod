'use client';

import { useState } from 'react';
import { useKanbanCards, useUpdateCardState, useDeleteCard, KanbanCard } from '@/hooks/use-agent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Check, X, Clock, AlertCircle, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useToast } from '@/hooks/use-toast';

const COLUMNS = [
  { id: 'scheduled', title: 'Scheduled', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'suggested', title: 'Suggested', color: 'bg-blue-50 border-blue-200' },
  { id: 'in_review', title: 'In Review', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'approved', title: 'Approved', color: 'bg-green-50 border-green-200' },
  { id: 'executing', title: 'Executing', color: 'bg-purple-50 border-purple-200' },
  { id: 'done', title: 'Done', color: 'bg-gray-50 border-gray-200' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-50 border-red-200' },
];

/**
 * Format due date for display on scheduled cards
 */
function formatDueDate(dueAt: string): string {
  const due = new Date(dueAt);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;

  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface KanbanBoardProps {
  onCardClick?: (card: KanbanCard) => void;
  jobId?: string;
}

export function KanbanBoard({ onCardClick, jobId }: KanbanBoardProps) {
  const { data: cards, isLoading } = useKanbanCards(undefined, undefined, jobId);
  const updateCardState = useUpdateCardState();
  const deleteCard = useDeleteCard();
  const { toast } = useToast();
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<KanbanCard | null>(null);

  const getCardsByState = (state: string) => {
    return cards?.filter((card) => card.state === state) || [];
  };

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (state: string) => {
    if (draggedCard && draggedCard.state !== state) {
      updateCardState.mutate({
        cardId: draggedCard.id,
        state,
      });
    }
    setDraggedCard(null);
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    
    try {
      await deleteCard.mutateAsync(cardToDelete.id);
      toast({
        title: 'Card Deleted',
        description: `"${cardToDelete.title}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete card',
        variant: 'destructive',
      });
    } finally {
      setCardToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)] overflow-x-auto pb-4">
      {COLUMNS.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-96"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          <Card className={cn('h-full', column.color)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{column.title}</span>
                <Badge variant="secondary" className="ml-2">
                  {getCardsByState(column.id).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2">
                  {getCardsByState(column.id).map((card) => (
                    <KanbanCardItem
                      key={card.id}
                      card={card}
                      onDragStart={handleDragStart}
                      onClick={() => onCardClick?.(card)}
                      onDelete={() => setCardToDelete(card)}
                    />
                  ))}
                  {getCardsByState(column.id).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No cards
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!cardToDelete} onOpenChange={(open) => !open && setCardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{cardToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCard} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface KanbanCardItemProps {
  card: KanbanCard;
  onDragStart: (card: KanbanCard) => void;
  onClick: () => void;
  onDelete: () => void;
}

function KanbanCardItem({ card, onDragStart, onClick, onDelete }: KanbanCardItemProps) {
  const priorityColors = {
    low: 'border-l-gray-400',
    medium: 'border-l-blue-500',
    high: 'border-l-red-500',
  };

  const typeIcons = {
    send_email: '📧',
    create_task: '✓',
    schedule_call: '📞',
    follow_up: '👋',
    create_deal: '💰',
    research: '🔍',
  };

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(card)}
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow border-l-4 group relative',
        priorityColors[card.priority as keyof typeof priorityColors]
      )}
    >
      <CardContent className="p-3 space-y-2" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">{typeIcons[card.type as keyof typeof typeIcons] || '📄'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{card.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              {card.priority}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {card.client && (
          <p className="text-xs text-muted-foreground">
            {card.client.company_name}
          </p>
        )}

        <p className="text-xs text-muted-foreground line-clamp-2">
          {card.rationale}
        </p>

        {card.state === 'scheduled' && card.due_at && (
          <div className="flex items-center gap-1 text-xs text-indigo-600">
            <Calendar className="h-3 w-3" />
            <span>Due: {formatDueDate(card.due_at)}</span>
          </div>
        )}

        {card.state === 'in_review' && (
          <div className="flex items-center gap-1 text-xs text-yellow-600">
            <Clock className="h-3 w-3" />
            <span>Click to edit</span>
          </div>
        )}

        {card.state === 'blocked' && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>Blocked</span>
          </div>
        )}

        {card.executed_at && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Check className="h-3 w-3" />
            <span>Executed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


