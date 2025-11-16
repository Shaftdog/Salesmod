'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/currency';
import {
  BOARD_COLUMNS,
  BOARD_COLUMN_COLORS,
  BOARD_COLUMN_ICONS,
} from '@/lib/constants/cashflow';
import type {
  CashflowBoard,
  CashflowBoardItem,
  BoardColumn,
} from '@/types/cashflow';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Receipt,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ICON_MAP = {
  AlertTriangle,
  Clock,
  Calendar,
  CalendarDays,
  CheckCircle2,
};

interface CashflowBoardProps {
  board: CashflowBoard;
  summary?: Record<string, any>;
  onCardClick?: (transaction: CashflowBoardItem) => void;
  onMarkPaid?: (transactionId: string) => void;
  onEdit?: (transaction: CashflowBoardItem) => void;
  onDelete?: (transactionId: string) => void;
}

export function CashflowBoardComponent({
  board,
  summary,
  onCardClick,
  onMarkPaid,
  onEdit,
  onDelete,
}: CashflowBoardProps) {
  const columns: BoardColumn[] = [
    'overdue',
    'current_week',
    'next_week',
    'later',
    'collected',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {columns.map((column) => {
        const items = board[column] || [];
        const columnSummary = summary?.[column];
        const IconComponent = ICON_MAP[BOARD_COLUMN_ICONS[column] as keyof typeof ICON_MAP];

        return (
          <div key={column} className="flex flex-col">
            <Card className={cn('mb-3', BOARD_COLUMN_COLORS[column].border)}>
              <CardHeader className={cn('py-3 px-4', BOARD_COLUMN_COLORS[column].header)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <CardTitle className="text-sm font-semibold">
                      {BOARD_COLUMNS[column]}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {items.length}
                  </Badge>
                </div>
                {columnSummary && (
                  <div className="text-xs mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Income:</span>
                      <span className="font-medium text-green-700">
                        {formatCurrency(columnSummary.income_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses:</span>
                      <span className="font-medium text-red-700">
                        {formatCurrency(columnSummary.expense_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="font-semibold">Net:</span>
                      <span className={cn(
                        'font-semibold',
                        columnSummary.net_amount >= 0 ? 'text-green-700' : 'text-red-700'
                      )}>
                        {formatCurrency(columnSummary.net_amount)}
                      </span>
                    </div>
                  </div>
                )}
              </CardHeader>
            </Card>

            <div className="space-y-3 flex-1">
              {items.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No transactions
                </div>
              ) : (
                items.map((item) => (
                  <TransactionCard
                    key={item.id}
                    transaction={item}
                    onClick={() => onCardClick?.(item)}
                    onMarkPaid={() => onMarkPaid?.(item.id)}
                    onEdit={() => onEdit?.(item)}
                    onDelete={() => onDelete?.(item.id)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TransactionCardProps {
  transaction: CashflowBoardItem;
  onClick?: () => void;
  onMarkPaid?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function TransactionCard({
  transaction,
  onClick,
  onMarkPaid,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isIncome = transaction.transaction_type === 'income';
  const isInvoice = !!transaction.invoice_id;
  const canEdit = !isInvoice && transaction.status !== 'paid' && transaction.status !== 'cancelled';
  const canMarkPaid = !isInvoice && transaction.status === 'pending' || transaction.status === 'overdue';

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        isIncome ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {isIncome ? (
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
            )}
            {isInvoice && (
              <Receipt className="h-3 w-3 text-muted-foreground" />
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canMarkPaid && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkPaid?.(); }}>
                  Mark as Paid
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                  Edit
                </DropdownMenuItem>
              )}
              {!isInvoice && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  className="text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isInvoice && transaction.invoice_number && (
          <Badge variant="outline" className="mb-2 text-xs">
            Invoice #{transaction.invoice_number}
          </Badge>
        )}

        <p className="font-medium text-sm mb-1 line-clamp-2">
          {transaction.description}
        </p>

        {transaction.client_name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{transaction.client_name}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div>
            <p className={cn(
              'font-bold text-lg',
              isIncome ? 'text-green-600' : 'text-red-600'
            )}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
            {transaction.due_date && (
              <p className="text-xs text-muted-foreground">
                Due: {new Date(transaction.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {transaction.days_overdue > 0 && (
            <Badge variant="destructive" className="text-xs">
              {transaction.days_overdue}d overdue
            </Badge>
          )}

          {transaction.days_until_due > 0 && transaction.days_until_due <= 7 && (
            <Badge variant="secondary" className="text-xs">
              {transaction.days_until_due}d left
            </Badge>
          )}
        </div>

        {transaction.category && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {transaction.category.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
