'use client';

/**
 * Create Invoice Page
 * Form for creating new invoices with dynamic line items
 */

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateInvoice } from '@/lib/hooks/use-invoices';
import { CreateInvoiceSchema, type CreateInvoiceInput } from '@/lib/validations/invoicing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/currency';
import { InvoiceLineItemForm } from '@/components/invoicing/invoice-line-item-form';

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createInvoice = useCreateInvoice();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get pre-filled values from URL params
  const orderIdParam = searchParams.get('order_id');
  const clientIdParam = searchParams.get('client_id');

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(CreateInvoiceSchema),
    defaultValues: {
      client_id: clientIdParam || '',
      payment_method: 'stripe_link',
      line_items: [
        {
          order_id: orderIdParam || undefined,
          product_id: undefined,
          square_footage: undefined,
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_rate: 0,
        },
      ],
      notes: '',
      terms_and_conditions: '',
    },
  });

  // Update form when URL params change
  useEffect(() => {
    if (clientIdParam) {
      form.setValue('client_id', clientIdParam);
    }
  }, [clientIdParam, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items',
  });

  // Calculate total from line items
  const watchLineItems = form.watch('line_items');
  const total = watchLineItems.reduce((sum, item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const tax = subtotal * ((item.tax_rate || 0) / 100);
    return sum + subtotal + tax;
  }, 0);

  const onSubmit = async (data: CreateInvoiceInput) => {
    setIsSubmitting(true);
    try {
      const result = await createInvoice.mutateAsync(data);
      router.push(`/finance/invoicing/${result.id}`);
    } catch (error) {
      console.error('Failed to create invoice:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/finance/invoicing">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Create Invoice</h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Create a new invoice for a client
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Basic information about the invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* TODO: Fetch and display actual clients */}
                        <SelectItem value="placeholder">Select a client from your contacts</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The client this invoice is for
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cod">Cash on Delivery (COD)</SelectItem>
                        <SelectItem value="stripe_link">Stripe (Credit Card)</SelectItem>
                        <SelectItem value="net_terms">Net Terms (Invoice)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How the client will pay for this invoice
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* COD-specific fields */}
              {form.watch('payment_method') === 'cod' && (
                <>
                  <FormField
                    control={form.control}
                    name="cod_collection_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COD Collection Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select collection method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="money_order">Money Order</SelectItem>
                            <SelectItem value="cashiers_check">Cashier's Check</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cod_collected_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collected By</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                          Name of the person who will collect the payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cod_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COD Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes for COD collection..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional instructions for COD collection
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Add items or services to the invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <InvoiceLineItemForm
                  key={field.id}
                  form={form}
                  index={index}
                  onRemove={() => remove(index)}
                  showRemove={fields.length > 1}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => append({
                  product_id: undefined,
                  square_footage: undefined,
                  description: '',
                  quantity: 1,
                  unit_price: 0,
                  tax_rate: 0
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>

              <div className="flex justify-end pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Optional notes and terms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes for this invoice..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Internal notes (not visible to client)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms_and_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Payment due within 30 days..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Terms and conditions (visible to client)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/finance/invoicing">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
