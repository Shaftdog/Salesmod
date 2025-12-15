'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CashflowBoardComponent } from '@/components/cashflow/cashflow-board';
import { AddExpenseDialog } from '@/components/cashflow/add-expense-dialog';
import {
  useCashflowBoard,
  useMarkTransactionPaid,
  useDeleteCashflowTransaction,
} from '@/lib/hooks/use-cashflow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, RefreshCw, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/currency';
import type { CashflowBoardItem, TransactionType } from '@/types/cashflow';

export default function CashflowPage() {
  const { toast } = useToast();
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | 'all'>('all');
  const [includeCollected, setIncludeCollected] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Fetch cashflow board
  const {
    data: boardData,
    isLoading,
    error,
    refetch,
  } = useCashflowBoard({
    transaction_type: transactionTypeFilter === 'all' ? undefined : transactionTypeFilter,
    include_collected: includeCollected,
  });

  // Mutations
  const markPaid = useMarkTransactionPaid();
  const deleteTransaction = useDeleteCashflowTransaction();

  const handleMarkPaid = async (transactionId: string) => {
    try {
      await markPaid.mutateAsync({
        id: transactionId,
        actual_date: new Date().toISOString().split('T')[0],
      });
      toast({
        title: 'Success',
        description: 'Transaction marked as paid',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark transaction as paid',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await deleteTransaction.mutateAsync(transactionId);
      toast({
        title: 'Success',
        description: 'Transaction deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete transaction',
        variant: 'destructive',
      });
    }
  };

  const handleCardClick = (transaction: CashflowBoardItem) => {
    // TODO: Open detail modal/sheet
    console.log('Transaction clicked:', transaction);
  };

  const handleEdit = (transaction: CashflowBoardItem) => {
    // TODO: Open edit modal/sheet
    console.log('Edit transaction:', transaction);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Cash Flow</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Failed to load cashflow data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const board = boardData?.data?.board || {
    overdue: [],
    current_week: [],
    next_week: [],
    later: [],
    collected: [],
  };

  const summary = boardData?.data?.summary || {};

  // Calculate overall stats
  const allItems = [
    ...(board.overdue || []),
    ...(board.current_week || []),
    ...(board.next_week || []),
    ...(board.later || []),
    ...(board.collected || []),
  ];

  const totalIncome = allItems
    .filter((item) => item.transaction_type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = allItems
    .filter((item) => item.transaction_type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const netCashflow = totalIncome - totalExpenses;

  const overdueAmount = (board.overdue || []).reduce((sum, item) => {
    return item.transaction_type === 'income' ? sum + item.amount : sum - item.amount;
  }, 0);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Cash Flow Planner
          </h1>
          <p className="text-muted-foreground mt-1">
            Track income and expenses across your pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddExpense(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Add Expense Dialog */}
      <AddExpenseDialog open={showAddExpense} onOpenChange={setShowAddExpense} />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expected Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expected Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className={`h-5 w-5 ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(netCashflow))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={overdueAmount < 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${overdueAmount < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {formatCurrency(Math.abs(overdueAmount))}
              </span>
            </div>
            {board.overdue && board.overdue.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {board.overdue.length} item{board.overdue.length !== 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Type:</label>
          <Select
            value={transactionTypeFilter}
            onValueChange={(value) => setTransactionTypeFilter(value as TransactionType | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="income">Income Only</SelectItem>
              <SelectItem value="expense">Expenses Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">
            <input
              type="checkbox"
              checked={includeCollected}
              onChange={(e) => setIncludeCollected(e.target.checked)}
              className="mr-2"
            />
            Show Collected
          </label>
        </div>
      </div>

      {/* Cashflow Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <CashflowBoardComponent
          board={board}
          summary={summary}
          onCardClick={handleCardClick}
          onMarkPaid={handleMarkPaid}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
