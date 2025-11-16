'use client';

/**
 * Finance Reports Page
 * Dashboard for financial analytics and reports
 */

import { useAgingReport } from '@/lib/hooks/use-invoices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/currency';
import { InvoiceStatusBadge } from '@/components/invoicing/invoice-status-badge';
import type { InvoiceStatusType } from '@/types/invoicing';

export default function FinanceReportsPage() {
  const { data: agingReport, isLoading } = useAgingReport();

  const aging = agingReport?.aging_buckets || {
    current: 0,
    days_1_30: 0,
    days_31_60: 0,
    days_61_90: 0,
    days_over_90: 0,
  };

  const outstandingInvoices = agingReport?.outstanding_invoices || [];
  const totalOutstanding = agingReport?.total_outstanding || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/finance">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Analytics and insights for your invoices
          </p>
        </div>
      </div>

      {/* Total Outstanding */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Total Outstanding
          </CardTitle>
          <CardDescription className="text-blue-700">
            Total amount owed across all unpaid invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-900">
            {formatCurrency(totalOutstanding)}
          </div>
        </CardContent>
      </Card>

      {/* Aging Report */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts Receivable Aging</CardTitle>
          <CardDescription>
            Breakdown of outstanding invoices by age
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading aging report...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Current
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(aging.current)}</div>
                    <p className="text-xs text-muted-foreground mt-1">0 days overdue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      1-30 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(aging.days_1_30)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Recently overdue</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      31-60 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{formatCurrency(aging.days_31_60)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      61-90 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(aging.days_61_90)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Urgent</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Over 90 Days
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-700">{formatCurrency(aging.days_over_90)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Critical</p>
                  </CardContent>
                </Card>
              </div>

              {/* Visual Progress Bars */}
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Current</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${totalOutstanding > 0 ? (aging.current / totalOutstanding) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-32 text-right">
                    {formatCurrency(aging.current)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">1-30 Days</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500"
                      style={{
                        width: `${totalOutstanding > 0 ? (aging.days_1_30 / totalOutstanding) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-32 text-right">
                    {formatCurrency(aging.days_1_30)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">31-60 Days</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{
                        width: `${totalOutstanding > 0 ? (aging.days_31_60 / totalOutstanding) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-32 text-right">
                    {formatCurrency(aging.days_31_60)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">61-90 Days</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${totalOutstanding > 0 ? (aging.days_61_90 / totalOutstanding) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-32 text-right">
                    {formatCurrency(aging.days_61_90)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm w-24">Over 90 Days</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-700"
                      style={{
                        width: `${totalOutstanding > 0 ? (aging.days_over_90 / totalOutstanding) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-32 text-right">
                    {formatCurrency(aging.days_over_90)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outstanding Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Invoices</CardTitle>
          <CardDescription>
            All invoices with unpaid balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outstandingInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground">No outstanding invoices!</p>
              <p className="text-sm text-muted-foreground mt-2">
                All invoices are paid up. Great job!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Invoice Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingInvoices.map((invoice: {
                  id: string;
                  invoice_number: string;
                  client?: { company_name: string } | null;
                  invoice_date: string;
                  due_date?: string | null;
                  days_overdue?: number | null;
                  total_amount: number;
                  amount_paid: number;
                  status: InvoiceStatusType;
                }) => {
                  const daysOverdue = invoice.days_overdue || 0;
                  const isOverdue = daysOverdue > 0;

                  return (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/finance/invoicing/${invoice.id}`}
                          className="font-medium hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.client?.company_name || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {isOverdue ? (
                          <span className="text-red-600 font-medium">
                            {daysOverdue} days
                          </span>
                        ) : (
                          <span className="text-green-600">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount_paid)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.total_amount - invoice.amount_paid)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
