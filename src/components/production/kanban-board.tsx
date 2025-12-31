'use client';

import { useState } from 'react';
import { useProductionBoardData, useMoveProductionCard } from '@/hooks/use-production';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Calendar, CalendarCheck, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  ProductionCardWithOrder,
  ProductionStage,
  PRODUCTION_STAGES,
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_STAGE_COLORS,
  PRIORITY_COLORS,
  calculateCompletionPercent,
} from '@/types/production';
import { format, formatDistanceToNow, isPast } from 'date-fns';

// Helper to parse date strings as local dates, not UTC
// Handles both date-only strings (YYYY-MM-DD) and full ISO timestamps
// This prevents timezone issues where Dec 23 becomes Dec 22
function parseLocalDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;

  let date: Date;

  // Check if it's a full ISO timestamp (contains 'T')
  if (dateString.includes('T')) {
    // Parse the ISO timestamp and extract date parts in UTC, then create local date
    const isoDate = new Date(dateString);
    if (isNaN(isoDate.getTime())) return undefined;
    // Create a new date using the UTC date components as local
    date = new Date(isoDate.getUTCFullYear(), isoDate.getUTCMonth(), isoDate.getUTCDate());
  } else {
    // Date-only string (YYYY-MM-DD) - add time component to force local interpretation
    date = new Date(dateString + 'T00:00:00');
  }

  // Return undefined if invalid date
  if (isNaN(date.getTime())) return undefined;
  return date;
}

// Safe date formatter that handles null/invalid dates
function formatLocalDate(dateString: string | null | undefined, formatStr: string): string {
  const date = parseLocalDate(dateString);
  if (!date) return '';
  return format(date, formatStr);
}

interface ProductionKanbanBoardProps {
  onCardClick?: (card: ProductionCardWithOrder) => void;
}

export function ProductionKanbanBoard({ onCardClick }: ProductionKanbanBoardProps) {
  const { data: boardData, isLoading, error } = useProductionBoardData();
  const moveCard = useMoveProductionCard();
  const { toast } = useToast();
  const [draggedCard, setDraggedCard] = useState<ProductionCardWithOrder | null>(null);

  const handleDragStart = (card: ProductionCardWithOrder) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStage: ProductionStage) => {
    if (!draggedCard) return;

    // Don't allow dropping on the same stage
    if (draggedCard.current_stage === targetStage) {
      setDraggedCard(null);
      return;
    }

    // Don't allow dragging from ON_HOLD or CANCELLED
    if (draggedCard.current_stage === 'ON_HOLD' || draggedCard.current_stage === 'CANCELLED') {
      toast({
        title: 'Cannot Move',
        description: 'Use the detail panel to resume or restore this order.',
        variant: 'destructive',
      });
      setDraggedCard(null);
      return;
    }

    // Don't allow dropping into ON_HOLD or CANCELLED via drag
    if (targetStage === 'ON_HOLD' || targetStage === 'CANCELLED') {
      toast({
        title: 'Cannot Move',
        description: 'Use the detail panel to hold or cancel this order.',
        variant: 'destructive',
      });
      setDraggedCard(null);
      return;
    }

    // Get adjacent stages for validation (excluding ON_HOLD and CANCELLED from index calculation)
    const workflowStages = PRODUCTION_STAGES.filter(s => s !== 'ON_HOLD' && s !== 'CANCELLED');
    const currentIndex = workflowStages.indexOf(draggedCard.current_stage);
    const targetIndex = workflowStages.indexOf(targetStage);

    // For now, only allow moving to adjacent stages
    // In the future, could allow skipping with confirmation
    if (Math.abs(targetIndex - currentIndex) > 1) {
      toast({
        title: 'Invalid Move',
        description: 'Cards can only move to adjacent stages.',
        variant: 'destructive',
      });
      setDraggedCard(null);
      return;
    }

    try {
      await moveCard.mutateAsync({
        cardId: draggedCard.id,
        targetStage,
      });
    } catch (error: any) {
      // Error toast is handled by the hook
    } finally {
      setDraggedCard(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        <AlertTriangle className="h-6 w-6 mr-2" />
        <span>Failed to load production board</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 h-[calc(100vh-12rem)] overflow-x-auto pb-4">
      {boardData?.columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-72"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          <Card className={cn('h-full border', PRODUCTION_STAGE_COLORS[column.id])}>
            <CardHeader className="pb-2 px-3 py-2">
              <CardTitle className="text-xs font-medium flex items-center justify-between">
                <span className="truncate">{PRODUCTION_STAGE_LABELS[column.id]}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {column.count}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-2">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2 p-1">
                  {column.cards.map((card) => (
                    <ProductionCardItem
                      key={card.id}
                      card={card}
                      onDragStart={handleDragStart}
                      onClick={() => onCardClick?.(card)}
                      isDragging={draggedCard?.id === card.id}
                    />
                  ))}
                  {column.count === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No orders
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

interface ProductionCardItemProps {
  card: ProductionCardWithOrder;
  onDragStart: (card: ProductionCardWithOrder) => void;
  onClick: () => void;
  isDragging: boolean;
}

// Role abbreviations for compact display
const ROLE_ABBREV: Record<string, string> = {
  appraiser: 'App',
  reviewer: 'Rev',
  admin: 'Adm',
  trainee: 'Trn',
  researcher_level_1: 'R1',
  researcher_level_2: 'R2',
  researcher_level_3: 'R3',
  inspector: 'Ins',
};

const ROLE_COLORS: Record<string, string> = {
  appraiser: 'bg-blue-100 text-blue-700',
  reviewer: 'bg-purple-100 text-purple-700',
  admin: 'bg-orange-100 text-orange-700',
  trainee: 'bg-green-100 text-green-700',
  researcher_level_1: 'bg-cyan-100 text-cyan-700',
  researcher_level_2: 'bg-teal-100 text-teal-700',
  researcher_level_3: 'bg-emerald-100 text-emerald-700',
  inspector: 'bg-amber-100 text-amber-700',
};

function AssignedResourcesDisplay({ card }: { card: ProductionCardWithOrder }) {
  const assignments = [
    { role: 'appraiser', user: card.assigned_appraiser },
    { role: 'reviewer', user: card.assigned_reviewer },
    { role: 'admin', user: card.assigned_admin },
    { role: 'trainee', user: card.assigned_trainee },
    { role: 'researcher_level_1', user: card.assigned_researcher_level_1 },
    { role: 'researcher_level_2', user: card.assigned_researcher_level_2 },
    { role: 'researcher_level_3', user: card.assigned_researcher_level_3 },
    { role: 'inspector', user: card.assigned_inspector },
  ].filter(a => a.user);

  if (assignments.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        <span>No assignments</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {assignments.map(({ role, user }) => (
          <Tooltip key={role}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-default',
                  ROLE_COLORS[role]
                )}
              >
                <span className="font-medium">{ROLE_ABBREV[role]}</span>
                <span className="max-w-[60px] truncate">
                  {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{ROLE_ABBREV[role]}: {user?.name || user?.email}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

function ProductionCardItem({ card, onDragStart, onClick, isDragging }: ProductionCardItemProps) {
  const completionPercent = calculateCompletionPercent(card.completed_tasks, card.total_tasks);
  const parsedDueDate = parseLocalDate(card.due_date);
  const isOverdue = parsedDueDate && isPast(parsedDueDate);

  return (
    <Card
      draggable
      onDragStart={() => onDragStart(card)}
      onClick={onClick}
      className={cn(
        'cursor-pointer hover:shadow-md transition-all border-l-4',
        PRIORITY_COLORS[card.priority].replace('bg-', 'border-l-').replace('text-', ''),
        isDragging && 'opacity-50 scale-95',
        isOverdue && 'ring-2 ring-red-300'
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Order Number & Priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {card.order?.order_number || 'No Order #'}
            </p>
            {card.order?.property_address && (
              <p className="text-xs text-muted-foreground truncate">
                {card.order.property_address}
              </p>
            )}
          </div>
          <Badge
            variant="secondary"
            className={cn('text-xs shrink-0', PRIORITY_COLORS[card.priority])}
          >
            {card.priority}
          </Badge>
        </div>

        {/* Inspection Date - Prominent Display */}
        {card.order?.inspection_date && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-teal-50 border border-teal-200">
            <CalendarCheck className="h-4 w-4 text-teal-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-teal-700">Inspection</p>
              <p className="text-sm font-semibold text-teal-800">
                {format(new Date(card.order.inspection_date), 'EEE, MMM d')}
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                completionPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {card.completed_tasks} / {card.total_tasks} tasks
          </p>
        </div>

        {/* Due Date */}
        {card.due_date && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
          )}>
            <Calendar className="h-3 w-3" />
            <span>
              {isOverdue ? 'Overdue: ' : 'Due: '}
              {formatLocalDate(card.due_date, 'MMM d')}
            </span>
            <span className="text-xs">
              {parseLocalDate(card.due_date) && `(${formatDistanceToNow(parseLocalDate(card.due_date)!, { addSuffix: true })})`}
            </span>
          </div>
        )}

        {/* Assigned Resources */}
        <AssignedResourcesDisplay card={card} />

        {/* Status Indicators */}
        {completionPercent === 100 && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>Ready to advance</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductionKanbanBoard;
