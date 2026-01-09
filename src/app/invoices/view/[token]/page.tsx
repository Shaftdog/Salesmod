'use client';

/**
 * Public Invoice View Page
 * Displays invoice to clients without authentication
 * Accessible via: /invoices/view/[token]
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2, Download, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate?: number;
  tax_amount?: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  payment_method: string;
  notes?: string;
  terms_and_conditions?: string;
  stripe_payment_link?: string;
  client: {
    company_name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  // Payer fields - when populated, shows separate "Bill To" section
  payer_name?: string;
  payer_company?: string;
  payer_email?: string;
  payer_phone?: string;
  payer_address?: string;
  line_items: LineItem[];
  org: {
    name: string;
    email?: string;
  };
  is_first_view?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Draft', color: 'bg-gray-500', icon: <Clock className="h-4 w-4" /> },
    sent: { label: 'Sent', color: 'bg-blue-500', icon: <Clock className="h-4 w-4" /> },
    viewed: { label: 'Viewed', color: 'bg-cyan-500', icon: <CheckCircle className="h-4 w-4" /> },
    partially_paid: { label: 'Partially Paid', color: 'bg-yellow-500', icon: <AlertCircle className="h-4 w-4" /> },
    paid: { label: 'Paid', color: 'bg-green-500', icon: <CheckCircle className="h-4 w-4" /> },
    overdue: { label: 'Overdue', color: 'bg-red-500', icon: <AlertCircle className="h-4 w-4" /> },
  };
  return configs[status] || { label: status, color: 'bg-gray-500', icon: null };
}

export default function PublicInvoiceViewPage() {
  const params = useParams();
  const token = params.token as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/invoices/view/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load invoice');
          return;
        }

        setInvoice(data.invoice);
      } catch (err) {
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const handlePayNow = async () => {
    if (!invoice) return;

    // If there's already a Stripe payment link, use it
    if (invoice.stripe_payment_link) {
      window.open(invoice.stripe_payment_link, '_blank');
      return;
    }

    // Otherwise, generate a new payment link
    setPaymentLoading(true);
    try {
      const response = await fetch(`/api/invoices/view/${token}/pay`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.payment_url) {
        window.open(data.payment_url, '_blank');
      } else {
        alert('Payment link could not be generated. Please contact support.');
      }
    } catch (err) {
      alert('Failed to generate payment link');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="mt-4 text-xl font-semibold">Invoice Not Found</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) return null;

  const statusConfig = getStatusConfig(invoice.status);
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';
  const canPay = !isPaid && invoice.amount_due > 0;

  // Company information
  const companyInfo = {
    name: 'ROI Home Services',
    address: '522 S. Hunt Club Blvd, Suite 166',
    cityStateZip: 'Apopka, FL 32703',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {companyInfo.name}
                </h1>
                <p className="text-muted-foreground">{companyInfo.address}</p>
                <p className="text-muted-foreground">{companyInfo.cityStateZip}</p>
                {invoice.org?.email && (
                  <p className="text-muted-foreground mt-1">{invoice.org.email}</p>
                )}
              </div>
              <div className="text-right">
                <Badge className={`${statusConfig.color} text-white`}>
                  {statusConfig.icon}
                  <span className="ml-1">{statusConfig.label}</span>
                </Badge>
                <h2 className="text-2xl font-bold mt-2">{invoice.invoice_number}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Alert for Overdue */}
        {isOverdue && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-semibold text-red-800">This invoice is overdue</p>
                  <p className="text-sm text-red-600">
                    Payment was due on {format(new Date(invoice.due_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paid Confirmation */}
        {isPaid && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-800">Payment Received</p>
                  <p className="text-sm text-green-600">
                    Thank you! This invoice has been paid in full.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Invoice Card */}
        <Card>
          <CardContent className="pt-6">
            {/* Ordered By / Bill To / Invoice Details */}
            {/* When payer fields are set, show both "Ordered By" (client) and "Bill To" (payer) */}
            {/* When no payer, show only "Bill To" with client info */}
            {(invoice.payer_name || invoice.payer_company) ? (
              // Payer exists - show both sections
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Ordered By
                  </h3>
                  <p className="font-semibold text-lg">{invoice.client?.company_name}</p>
                  {invoice.client?.email && (
                    <p className="text-muted-foreground">{invoice.client.email}</p>
                  )}
                  {invoice.client?.phone && (
                    <p className="text-muted-foreground">{invoice.client.phone}</p>
                  )}
                  {invoice.client?.address && (
                    <p className="text-muted-foreground whitespace-pre-line">{invoice.client.address}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Bill To
                  </h3>
                  <p className="font-semibold text-lg">
                    {invoice.payer_company || invoice.payer_name}
                  </p>
                  {invoice.payer_company && invoice.payer_name && (
                    <p className="text-muted-foreground">{invoice.payer_name}</p>
                  )}
                  {invoice.payer_email && (
                    <p className="text-muted-foreground">{invoice.payer_email}</p>
                  )}
                  {invoice.payer_phone && (
                    <p className="text-muted-foreground">{invoice.payer_phone}</p>
                  )}
                  {invoice.payer_address && (
                    <p className="text-muted-foreground whitespace-pre-line">{invoice.payer_address}</p>
                  )}
                </div>
                <div className="md:text-right">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Invoice Date: </span>
                      <span className="font-medium">
                        {format(new Date(invoice.invoice_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Due Date: </span>
                      <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                        {format(new Date(invoice.due_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // No payer - traditional layout with client as Bill To
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Bill To
                  </h3>
                  <p className="font-semibold text-lg">{invoice.client?.company_name}</p>
                  {invoice.client?.email && (
                    <p className="text-muted-foreground">{invoice.client.email}</p>
                  )}
                  {invoice.client?.phone && (
                    <p className="text-muted-foreground">{invoice.client.phone}</p>
                  )}
                  {invoice.client?.address && (
                    <p className="text-muted-foreground whitespace-pre-line">{invoice.client.address}</p>
                  )}
                </div>
                <div className="md:text-right">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Invoice Date: </span>
                      <span className="font-medium">
                        {format(new Date(invoice.invoice_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Due Date: </span>
                      <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                        {format(new Date(invoice.due_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Line Items */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-semibold">Description</th>
                    <th className="text-right py-3 px-2 font-semibold">Qty</th>
                    <th className="text-right py-3 px-2 font-semibold">Unit Price</th>
                    <th className="text-right py-3 px-2 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items?.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-2">{item.description}</td>
                      <td className="text-right py-3 px-2">{item.quantity}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right py-3 px-2 font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
                {invoice.amount_paid > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>-{formatCurrency(invoice.amount_paid)}</span>
                  </div>
                )}
                {!isPaid && (
                  <div className="flex justify-between font-bold text-xl pt-2 border-t-2">
                    <span>Amount Due</span>
                    <span className={isOverdue ? 'text-red-600' : ''}>
                      {formatCurrency(invoice.amount_due)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms_and_conditions) && (
              <>
                <Separator className="my-6" />
                <div className="grid md:grid-cols-2 gap-6">
                  {invoice.notes && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Notes
                      </h3>
                      <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms_and_conditions && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Terms & Conditions
                      </h3>
                      <p className="text-sm whitespace-pre-line">{invoice.terms_and_conditions}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Payment Button */}
            {canPay && (
              <>
                <Separator className="my-6" />
                <div className="flex flex-col items-center gap-4">
                  <Button
                    size="lg"
                    className="w-full md:w-auto px-8"
                    onClick={handlePayNow}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Now - {formatCurrency(invoice.amount_due)}
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Secure payment powered by Stripe
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-1">{companyInfo.name} | {companyInfo.address}, {companyInfo.cityStateZip}</p>
        </div>
      </div>
    </div>
  );
}
