"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useUpdateInvoice } from '@/lib/hooks/use-invoices';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const LineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Price must be 0 or greater'),
  tax_rate: z.number().min(0).max(100).optional(),
});

const EditInvoiceSchema = z.object({
  due_date: z.string().optional(),
  payment_method: z.enum(['cod', 'stripe_link', 'net_terms']).optional(),
  notes: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  line_items: z.array(LineItemSchema).min(1, 'At least one line item is required'),
});

type EditInvoiceInput = z.infer<typeof EditInvoiceSchema>;

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  payment_method?: string;
  notes?: string;
  terms_and_conditions?: string;
  line_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    tax_rate?: number;
  }>;
}

interface EditInvoiceDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  orderId?: string;
}

export function EditInvoiceDialog({
  invoice,
  open,
  onOpenChange,
  onSuccess,
  orderId,
}: EditInvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<EditInvoiceInput>({
    resolver: zodResolver(EditInvoiceSchema),
    defaultValues: {
      due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
      payment_method: (invoice.payment_method as 'cod' | 'stripe_link' | 'net_terms') || 'net_terms',
      notes: invoice.notes || '',
      terms_and_conditions: invoice.terms_and_conditions || '',
      line_items: invoice.line_items?.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
      })) || [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'line_items',
  });

  // Reset form when invoice changes
  useEffect(() => {
    if (open && invoice) {
      form.reset({
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
        payment_method: (invoice.payment_method as 'cod' | 'stripe_link' | 'net_terms') || 'net_terms',
        notes: invoice.notes || '',
        terms_and_conditions: invoice.terms_and_conditions || '',
        line_items: invoice.line_items?.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || 0,
        })) || [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }],
      });
    }
  }, [open, invoice, form]);

  // Calculate total
  const watchLineItems = form.watch('line_items');
  const total = watchLineItems.reduce((sum, item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const tax = subtotal * ((item.tax_rate || 0) / 100);
    return sum + subtotal + tax;
  }, 0);

  const handleSubmit = async (data: EditInvoiceInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          due_date: data.due_date,
          payment_method: data.payment_method,
          notes: data.notes,
          terms_and_conditions: data.terms_and_conditions,
          line_items: data.line_items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: (item.tax_rate || 0) / 100, // Convert to decimal
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update invoice');
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ['order-invoices', orderId] });
      }

      toast.success('Invoice updated successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = ['draft', 'sent', 'viewed', 'overdue'].includes(invoice.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice {invoice.invoice_number}</DialogTitle>
          <DialogDescription>
            {canEdit
              ? 'Update the invoice details and line items below.'
              : 'This invoice cannot be edited because it has been partially paid, paid, or cancelled.'}
          </DialogDescription>
        </DialogHeader>

        {!canEdit ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              Invoices can only be edited when in Draft or Sent status.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Current status: <span className="font-medium capitalize">{invoice.status}</span>
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cod">Cash on Delivery</SelectItem>
                          <SelectItem value="stripe_link">Credit Card (Stripe)</SelectItem>
                          <SelectItem value="net_terms">Net Terms</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Line Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({ description: '', quantity: 1, unit_price: 0, tax_rate: 0 })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Description</th>
                        <th className="text-right p-3 font-medium w-20">Qty</th>
                        <th className="text-right p-3 font-medium w-28">Unit Price</th>
                        <th className="text-right p-3 font-medium w-20">Tax %</th>
                        <th className="text-right p-3 font-medium w-28">Amount</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => {
                        const quantity = form.watch(`line_items.${index}.quantity`) || 0;
                        const unitPrice = form.watch(`line_items.${index}.unit_price`) || 0;
                        const taxRate = form.watch(`line_items.${index}.tax_rate`) || 0;
                        const subtotal = quantity * unitPrice;
                        const tax = subtotal * (taxRate / 100);
                        const amount = subtotal + tax;

                        return (
                          <tr key={field.id} className="border-t">
                            <td className="p-2">
                              <FormField
                                control={form.control}
                                name={`line_items.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="Description"
                                        className="border-0 shadow-none focus-visible:ring-0 px-1"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-2">
                              <FormField
                                control={form.control}
                                name={`line_items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        className="border-0 shadow-none focus-visible:ring-0 text-right px-1"
                                        onChange={(e) =>
                                          field.onChange(parseFloat(e.target.value) || 0)
                                        }
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-2">
                              <FormField
                                control={form.control}
                                name={`line_items.${index}.unit_price`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="border-0 shadow-none focus-visible:ring-0 text-right px-1"
                                        onChange={(e) =>
                                          field.onChange(parseFloat(e.target.value) || 0)
                                        }
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-2">
                              <FormField
                                control={form.control}
                                name={`line_items.${index}.tax_rate`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="border-0 shadow-none focus-visible:ring-0 text-right px-1"
                                        onChange={(e) =>
                                          field.onChange(parseFloat(e.target.value) || 0)
                                        }
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-2 text-right font-medium">
                              {formatCurrency(amount)}
                            </td>
                            <td className="p-2">
                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/50">
                      <tr className="border-t-2">
                        <td colSpan={4} className="p-3 text-right font-semibold">
                          Total:
                        </td>
                        <td className="p-3 text-right font-bold text-lg">
                          {formatCurrency(total)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional notes for this invoice..."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms */}
              <FormField
                control={form.control}
                name="terms_and_conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms & Conditions</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Payment terms and conditions..."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EditInvoiceDialog;
