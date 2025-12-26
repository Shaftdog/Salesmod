'use client';

import { useState } from 'react';
import { useCasesBoardData, useMoveCase } from '@/hooks/use-cases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Case, CaseStatus } from '@/lib/types';
import { CASE_STATUS_COLORS, CASE_STATUS_LABELS } from '@/lib/types';
import { CasesKanbanCard } from './cases-kanban-card';
import { Button } from '@/components/ui/button';

interface CasesKanbanBoardProps {
  onCardClick?: (caseItem: Case) => void;
  onCreateCase?: (status?: CaseStatus) => void;
}

export function CasesKanbanBoard({ onCardClick, onCreateCase }: CasesKanbanBoardProps) {
  const { data: boardData, isLoading, error } = useCasesBoardData();
  const moveCase = useMoveCase();
  const { toast } = useToast();
  const [draggedCase, setDraggedCase] = useState<Case | null>(null);

  const handleDragStart = (caseItem: Case) => {
    setDraggedCase(caseItem);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStatus: CaseStatus) => {
    if (!draggedCase) return;

    // Don't allow dropping on the same status
    if (draggedCase.status === targetStatus) {
      setDraggedCase(null);
      return;
    }

    try {
      await moveCase.mutateAsync({
        caseId: draggedCase.id,
        targetStatus,
      });
      toast({
        title: 'Case Moved',
        description: `Moved to ${CASE_STATUS_LABELS[targetStatus]}`,
      });
    } catch (error: any) {
      // Error toast is handled by the hook
    } finally {
      setDraggedCase(null);
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
        <span>Failed to load cases board</span>
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
          <Card className={cn('h-full border', CASE_STATUS_COLORS[column.id])}>
            <CardHeader className="pb-2 px-3 py-2">
              <CardTitle className="text-xs font-medium flex items-center justify-between">
                <span className="truncate">{column.label}</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {column.count}
                  </Badge>
                  {onCreateCase && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => onCreateCase(column.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-2">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2 p-1">
                  {column.cases.map((caseItem) => (
                    <CasesKanbanCard
                      key={caseItem.id}
                      caseItem={caseItem}
                      onDragStart={handleDragStart}
                      onClick={() => onCardClick?.(caseItem)}
                      isDragging={draggedCase?.id === caseItem.id}
                    />
                  ))}
                  {column.count === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No cases
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

export default CasesKanbanBoard;
