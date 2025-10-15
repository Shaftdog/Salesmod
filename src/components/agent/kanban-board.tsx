'use client';

import { useState } from 'react';
import { useKanbanCards, useUpdateCardState, KanbanCard } from '@/hooks/use-agent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Check, X, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { id: 'suggested', title: 'Suggested', color: 'bg-blue-50 border-blue-200' },
  { id: 'in_review', title: 'In Review', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'approved', title: 'Approved', color: 'bg-green-50 border-green-200' },
  { id: 'executing', title: 'Executing', color: 'bg-purple-50 border-purple-200' },
  { id: 'done', title: 'Done', color: 'bg-gray-50 border-gray-200' },
  { id: 'blocked', title: 'Blocked', color: 'bg-red-50 border-red-200' },
];

interface KanbanBoardProps {
  onCardClick?: (card: KanbanCard) => void;
}

export function KanbanBoard({ onCardClick }: KanbanBoardProps) {
  const { data: cards, isLoading } = useKanbanCards();
  const updateCardState = useUpdateCardState();
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);

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
          className="flex-shrink-0 w-80"
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
    </div>
  );
}

interface KanbanCardItemProps {
  card: KanbanCard;
  onDragStart: (card: KanbanCard) => void;
  onClick: () => void;
}

function KanbanCardItem({ card, onDragStart, onClick }: KanbanCardItemProps) {
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
      onClick={onClick}
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow border-l-4',
        priorityColors[card.priority as keyof typeof priorityColors]
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeIcons[card.type as keyof typeof typeIcons] || '📄'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{card.title}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {card.priority}
          </Badge>
        </div>

        {card.client && (
          <p className="text-xs text-muted-foreground truncate">
            {card.client.company_name}
          </p>
        )}

        <p className="text-xs text-muted-foreground line-clamp-2">
          {card.rationale}
        </p>

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


