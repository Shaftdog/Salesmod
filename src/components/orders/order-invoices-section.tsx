"use client";

import React from 'react';
import { useOrderInvoices } from '@/lib/hooks/use-invoices';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Plus, ExternalLink, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

interface OrderInvoicesSectionProps {
  orderId: string;
}

export function OrderInvoicesSection({ orderId }: OrderInvoicesSectionProps) {
  const { data: invoices, isLoading, error } = useOrderInvoices(orderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-destructive">Failed to load invoices</p>
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Invoices</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          No invoices have been created for this order yet.
        </p>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      viewed: 'bg-cyan-500',
      partially_paid: 'bg-yellow-500',
      paid: 'bg-green-500',
      overdue: 'bg-red-500',
      cancelled: 'bg-gray-400',
      void: 'bg-gray-300',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4">
      {invoices.map((invoice: any) => (
        <Card key={invoice.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                <CardDescription>
                  Issued {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(invoice.status)}>
                {getStatusLabel(invoice.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invoice Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(invoice.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
                <p className="text-lg font-semibold">{formatCurrency(invoice.amount_due)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-sm">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <p className="text-sm capitalize">{invoice.payment_method?.replace(/_/g, ' ')}</p>
              </div>
            </div>

            {/* Line Items */}
            {invoice.line_items && invoice.line_items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Line Items</h4>
                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2">Description</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Unit Price</th>
                        <th className="text-right p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.line_items.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.description}</td>
                          <td className="text-right p-2">{item.quantity}</td>
                          <td className="text-right p-2">{formatCurrency(item.unit_price)}</td>
                          <td className="text-right p-2 font-medium">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="default" size="sm">
                <Link href={`/invoices/${invoice.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Invoice
                </Link>
              </Button>
              {invoice.status !== 'paid' && invoice.status !== 'void' && (
                <Button variant="outline" size="sm">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
