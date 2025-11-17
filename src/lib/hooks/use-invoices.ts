/**
 * React hooks for invoice data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Invoice } from '@/types/invoicing';
import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/lib/validations/invoicing';

// Fetch invoices list
export function useInvoices(params?: {
  status?: string[];
  client_id?: string;
  search?: string;
  overdue_only?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.status) {
        params.status.forEach(s => searchParams.append('status', s));
      }
      if (params?.client_id) searchParams.append('client_id', params.client_id);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.overdue_only) searchParams.append('overdue_only', 'true');
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(`/api/invoices?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const result = await response.json();

      // Return the data object which contains invoices and stats
      return result.data || { invoices: [], stats: {} };
    },
  });
}

// Fetch single invoice
export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
}

// Fetch invoices for a specific order
export function useOrderInvoices(orderId: string | null) {
  return useQuery({
    queryKey: ['order-invoices', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const response = await fetch(`/api/orders/${orderId}/invoices`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch order invoices');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!orderId,
  });
}

// Create invoice
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceInput) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create invoice');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Update invoice
export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateInvoiceInput) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Delete invoice
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Cancel invoice
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await fetch(`/api/invoices/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to cancel invoice');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Mark invoice as paid
export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payment_method,
      payment_date,
      reference_number
    }: {
      id: string;
      payment_method: string;
      payment_date?: string;
      reference_number?: string;
    }) => {
      const response = await fetch(`/api/invoices/${id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method, payment_date, reference_number }),
      });
      if (!response.ok) throw new Error('Failed to mark invoice as paid');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Generate Stripe payment link
export function useGenerateStripeLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      customer_email,
      description
    }: {
      id: string;
      customer_email: string;
      description?: string;
    }) => {
      const response = await fetch(`/api/invoices/${id}/stripe-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_email, description }),
      });
      if (!response.ok) throw new Error('Failed to generate payment link');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });
}

// Record payment
export function useRecordPayment(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: number;
      payment_method: string;
      payment_date?: string;
      reference_number?: string;
      notes?: string;
    }) => {
      const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to record payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments', invoiceId] });
    },
  });
}

// Fetch invoice payments
export function useInvoicePayments(invoiceId: string | null) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const response = await fetch(`/api/invoices/${invoiceId}/payments`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    enabled: !!invoiceId,
  });
}

// Fetch reports
export function useOutstandingReport() {
  return useQuery({
    queryKey: ['reports', 'outstanding'],
    queryFn: async () => {
      const response = await fetch('/api/reports/outstanding');
      if (!response.ok) throw new Error('Failed to fetch outstanding report');
      return response.json();
    },
  });
}

export function useAgingReport() {
  return useQuery({
    queryKey: ['reports', 'aging'],
    queryFn: async () => {
      const response = await fetch('/api/reports/aging');
      if (!response.ok) throw new Error('Failed to fetch aging report');
      return response.json();
    },
  });
}

export function useRevenueReport(params?: {
  start_date?: string;
  end_date?: string;
  group_by?: string;
}) {
  return useQuery({
    queryKey: ['reports', 'revenue', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.start_date) searchParams.append('start_date', params.start_date);
      if (params?.end_date) searchParams.append('end_date', params.end_date);
      if (params?.group_by) searchParams.append('group_by', params.group_by);

      const response = await fetch(`/api/reports/revenue?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch revenue report');
      return response.json();
    },
  });
}
