'use client';

/**
 * Invoice Detail Page
 * View and manage a specific invoice
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useInvoice,
  useRecordPayment,
  useGenerateStripeLink,
  useMarkInvoicePaid,
  useCancelInvoice,
} from '@/lib/hooks/use-invoices';
import { InvoiceStatusBadge } from '@/components/invoicing/invoice-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CreditCard, DollarSign, ExternalLink, Ban, FileText, Send, ChevronDown, Pencil, AlertTriangle, Copy, Check, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EditInvoiceDialog } from '@/components/invoicing/edit-invoice-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { INVOICE_STATUS_TRANSITIONS, type InvoiceStatus } from '@/lib/constants/invoicing';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/currency';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const RecordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payment_method: z.enum(['cash', 'check', 'credit_card', 'bank_transfer', 'other']),
  payment_date: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

const CancelInvoiceSchema = z.object({
  cancellation_reason: z.string().min(1, 'Reason is required').max(500),
});

type CancelInvoiceInput = z.infer<typeof CancelInvoiceSchema>;

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const recordPayment = useRecordPayment(invoiceId);
  const generateStripeLink = useGenerateStripeLink();
  const markAsPaid = useMarkInvoicePaid();
  const cancelInvoice = useCancelInvoice();
  const { toast } = useToast();

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stripeLink, setStripeLink] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [invoiceViewUrl, setInvoiceViewUrl] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  const paymentForm = useForm<RecordPaymentInput>({
    resolver: zodResolver(RecordPaymentSchema),
    defaultValues: {
      amount: 0,
      payment_method: 'cash',
      notes: '',
    },
  });

  const cancelForm = useForm<CancelInvoiceInput>({
    resolver: zodResolver(CancelInvoiceSchema),
    defaultValues: {
      cancellation_reason: '',
    },
  });

  const handleRecordPayment = async (data: RecordPaymentInput) => {
    try {
      await recordPayment.mutateAsync(data);
      setIsPaymentDialogOpen(false);
      paymentForm.reset();
    } catch (error) {
      console.error('Failed to record payment:', error);
    }
  };

  const handleGenerateStripeLink = async () => {
    if (!invoice?.client?.email) {
      console.error('Client email is required');
      return;
    }
    try {
      const result = await generateStripeLink.mutateAsync({
        id: invoiceId,
        customer_email: invoice.client.email,
        description: `Invoice ${invoice.invoice_number}`,
      });
      setStripeLink(result.payment_url);
    } catch (error) {
      console.error('Failed to generate Stripe link:', error);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await markAsPaid.mutateAsync({
        id: invoiceId,
        payment_method: 'other',
      });
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    }
  };

  const handleCancelInvoice = async (data: CancelInvoiceInput) => {
    try {
      await cancelInvoice.mutateAsync({
        id: invoiceId,
        reason: data.cancellation_reason,
      });
      setIsCancelDialogOpen(false);
      router.push('/finance/invoicing');
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
    }
  };

  const handleSendInvoice = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show user-friendly error message
        toast({
          title: 'Failed to send invoice',
          description: data.error || 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setIsSendDialogOpen(false);

      // Store the view URL for display
      if (data.data?.view_url) {
        setInvoiceViewUrl(data.data.view_url);
      }

      // Show appropriate toast based on email status
      if (data.data?.email_simulated) {
        toast({
          title: 'Invoice ready to send',
          description: 'Email service not configured. Copy the invoice link below to share manually.',
        });
      } else if (data.data?.email_sent === false) {
        toast({
          title: 'Invoice link generated',
          description: data.message || 'Email delivery failed. Copy the link below to share manually.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invoice sent',
          description: data.message || `Invoice sent successfully!`,
        });
      }

      // Refresh the page to show updated status
      router.refresh();
      // Don't do full reload - keep the view URL visible
      // window.location.reload();
    } catch (error) {
      console.error('Failed to send invoice:', error);
      toast({
        title: 'Failed to send invoice',
        description: 'A network error occurred. Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyUrl = async () => {
    if (invoiceViewUrl) {
      await navigator.clipboard.writeText(invoiceViewUrl);
      setUrlCopied(true);
      toast({
        title: 'Link copied',
        description: 'Invoice link copied to clipboard.',
      });
      setTimeout(() => setUrlCopied(false), 2000);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsChangingStatus(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }
      // Refresh to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Failed to change status:', error);
      alert(error instanceof Error ? error.message : 'Failed to change status');
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Get valid status transitions for current invoice status
  const getValidTransitions = (): string[] => {
    if (!invoice) return [];
    const currentStatus = invoice.status as InvoiceStatus;
    return [...(INVOICE_STATUS_TRANSITIONS[currentStatus] || [])];
  };

  const formatStatusLabel = (status: string): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  const balance = invoice.total_amount - invoice.amount_paid;

  // Check if client has billing contact configured
  const hasBillingContact = invoice.client?.billing_contact_id && invoice.client?.billing_contact?.email;
  const hasBillingEmailConfirmed = invoice.client?.billing_email_confirmed && invoice.client?.email;
  const isBillingConfigured = hasBillingContact || hasBillingEmailConfirmed;

  // Determine the billing email that will be used
  const billingEmail = hasBillingContact
    ? invoice.client?.billing_contact?.email
    : (hasBillingEmailConfirmed ? invoice.client?.email : null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Invoice View URL Card - shown after sending */}
      {invoiceViewUrl && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900 dark:text-green-100">Invoice Link</CardTitle>
            </div>
            <CardDescription className="text-green-700 dark:text-green-300">
              Share this link with your client to view and pay the invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={invoiceViewUrl}
                readOnly
                className="bg-white dark:bg-green-900 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {urlCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                className="shrink-0"
              >
                <a href={invoiceViewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Contact Warning Banner */}
      {invoice.status === 'draft' && !isBillingConfigured && (
        <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 [&>svg]:text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Billing Contact Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              This client has no billing contact configured. You must set up a billing contact before sending this invoice.
            </span>
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href={`/clients/${invoice.client?.id}`}>
                Configure Billing Contact
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/finance/invoicing">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Invoice {invoice.invoice_number}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-muted-foreground ml-10">
            Created on {new Date(invoice.invoice_date).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Edit Button - only for editable statuses */}
          {['draft', 'sent', 'viewed', 'overdue'].includes(invoice.status) && (
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}

          {/* Send Invoice Button - only for draft invoices */}
          {invoice.status === 'draft' && (
            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Invoice</DialogTitle>
                  <DialogDescription>
                    {isBillingConfigured
                      ? `Send this invoice to ${billingEmail}. The invoice status will change from Draft to Sent.`
                      : 'Configure a billing contact before sending this invoice.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  {!isBillingConfigured ? (
                    <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 [&>svg]:text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Billing Contact</AlertTitle>
                      <AlertDescription>
                        This client has no billing contact configured. Please{' '}
                        <Link href={`/clients/${invoice.client?.id}`} className="font-medium underline">
                          configure a billing contact
                        </Link>{' '}
                        before sending this invoice.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Invoice <span className="font-medium text-foreground">{invoice.invoice_number}</span> for{' '}
                        <span className="font-medium text-foreground">{formatCurrency(invoice.total_amount)}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Recipient: </span>
                        <span className="font-medium">{billingEmail}</span>
                        {hasBillingContact && invoice.client?.billing_contact && (
                          <span className="text-muted-foreground">
                            {' '}({invoice.client.billing_contact.first_name} {invoice.client.billing_contact.last_name})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendInvoice}
                    disabled={isSending || !isBillingConfigured}
                  >
                    {isSending ? 'Sending...' : 'Send Invoice'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Status Change Dropdown */}
          {getValidTransitions().length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isChangingStatus}>
                  {isChangingStatus ? 'Updating...' : 'Change Status'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {getValidTransitions().map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                  >
                    {formatStatusLabel(status)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'void' && (
            <>
              {invoice.payment_method === 'stripe' && (
                <Button onClick={handleGenerateStripeLink} disabled={generateStripeLink.isPending}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Generate Payment Link
                </Button>
              )}

              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Record a payment received for this invoice
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(handleRecordPayment)} className="space-y-4">
                      <FormField
                        control={paymentForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={balance}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="payment_method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="credit_card">Credit Card</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={recordPayment.isPending}>
                          {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={handleMarkAsPaid} disabled={markAsPaid.isPending}>
                Mark as Paid
              </Button>

              <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Ban className="mr-2 h-4 w-4" />
                    Cancel Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Invoice</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. Please provide a reason for cancellation.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...cancelForm}>
                    <form onSubmit={cancelForm.handleSubmit(handleCancelInvoice)} className="space-y-4">
                      <FormField
                        control={cancelForm.control}
                        name="cancellation_reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cancellation Reason</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                          Keep Invoice
                        </Button>
                        <Button type="submit" variant="destructive" disabled={cancelInvoice.isPending}>
                          {cancelInvoice.isPending ? 'Cancelling...' : 'Cancel Invoice'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Stripe Payment Link */}
      {stripeLink && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Payment Link Generated</CardTitle>
            <CardDescription className="text-blue-700">
              Share this link with your client to accept payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input value={stripeLink} readOnly className="bg-white" />
              <Button asChild>
                <a href={stripeLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Reference (if linked to an order) */}
      {invoice.order_id && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Related Order</p>
                  <p className="font-semibold">
                    {invoice.order?.order_number || `Order ${invoice.order_id.slice(0, 8)}...`}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/orders/${invoice.order_id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Order
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{invoice.client?.company_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{invoice.client?.email || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-medium">{formatCurrency(invoice.amount_paid)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Balance Due:</span>
              <span className="font-semibold text-lg">{formatCurrency(balance)}</span>
            </div>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{invoice.payment_method}</p>
            </div>
            {invoice.due_date && (
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.line_items?.map((item: {
                description: string;
                quantity: number;
                unit_price: number;
                tax_rate: number;
              }, index: number) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{item.tax_rate}%</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.quantity * item.unit_price * (1 + item.tax_rate / 100))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment: {
                  id: string;
                  payment_date: string;
                  amount: number;
                  payment_method: string;
                  notes?: string | null;
                }) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method}</TableCell>
                    <TableCell>{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid gap-6 md:grid-cols-2">
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {invoice.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.terms}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Invoice Dialog */}
      {invoice && (
        <EditInvoiceDialog
          invoice={{
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            status: invoice.status,
            payment_method: invoice.payment_method,
            notes: invoice.notes,
            terms_and_conditions: invoice.terms,
            line_items: invoice.line_items,
          }}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            router.refresh();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
