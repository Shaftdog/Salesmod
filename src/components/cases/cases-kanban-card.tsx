'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { CasePriorityBadge } from './case-status-badge';
import { cn } from '@/lib/utils';
import type { Case, CasePriority } from '@/lib/types';
import { Building2, FileText, User, Calendar, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDeleteCase } from '@/hooks/use-cases';

const PRIORITY_BORDER_COLORS: Record<CasePriority, string> = {
  low: 'border-l-gray-400',
  normal: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-400',
  critical: 'border-l-red-600',
};

interface CasesKanbanCardProps {
  caseItem: Case;
  onDragStart: (caseItem: Case) => void;
  onClick: () => void;
  isDragging: boolean;
}

export function CasesKanbanCard({
  caseItem,
  onDragStart,
  onClick,
  isDragging,
}: CasesKanbanCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteCase = useDeleteCase();

  const formatCaseType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteCase.mutate(caseItem.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete case {caseItem.caseNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    <Card
      draggable
      onDragStart={() => onDragStart(caseItem)}
      onClick={onClick}
      className={cn(
        'cursor-pointer hover:shadow-md transition-all border-l-4',
        PRIORITY_BORDER_COLORS[caseItem.priority],
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Case Number & Priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{caseItem.subject}</p>
            <p className="text-xs text-muted-foreground">{caseItem.caseNumber}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CasePriorityBadge priority={caseItem.priority} className="text-xs" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Case Type */}
        <Badge variant="outline" className="text-xs">
          {formatCaseType(caseItem.caseType)}
        </Badge>

        {/* Description Preview */}
        {caseItem.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {caseItem.description}
          </p>
        )}

        {/* Related Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {caseItem.client && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{caseItem.client.companyName}</span>
            </div>
          )}
          {caseItem.order && (
            <div className="flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              <span>Order #{caseItem.order.orderNumber}</span>
            </div>
          )}
          {caseItem.assignee && (
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span className="truncate">{caseItem.assignee.name}</span>
            </div>
          )}
        </div>

        {/* Created Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
