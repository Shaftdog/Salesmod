import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

export type ContactAttemptType = 'phone_call' | 'sms' | 'email' | 'voicemail';

export type ContactAttemptOutcome =
  | 'connected'
  | 'no_answer'
  | 'voicemail'
  | 'wrong_number'
  | 'busy'
  | 'email_sent'
  | 'email_bounced'
  | 'sms_sent'
  | 'sms_failed'
  | 'scheduled'
  | 'declined'
  | 'callback_requested';

export interface ContactAttempt {
  id: string;
  orgId: string;
  orderId?: string;
  bookingId?: string;
  propertyId?: string;
  attemptType: ContactAttemptType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  attemptedAt: string;
  attemptedBy?: string;
  outcome: ContactAttemptOutcome;
  callbackRequestedAt?: string;
  notes?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;

  // Joined data
  order?: any;
  booking?: any;
  property?: any;
  attemptedByProfile?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface ContactAttemptFilters {
  orderId?: string;
  bookingId?: string;
  propertyId?: string;
  attemptType?: ContactAttemptType;
  outcome?: ContactAttemptOutcome;
  startDate?: string;
  endDate?: string;
  attemptedBy?: string;
  page?: number;
  limit?: number;
}

interface CreateContactAttemptParams {
  orderId?: string;
  bookingId?: string;
  propertyId?: string;
  attemptType: ContactAttemptType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  outcome: ContactAttemptOutcome;
  callbackRequestedAt?: string;
  notes?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

interface UpdateContactAttemptParams {
  id: string;
  outcome?: ContactAttemptOutcome;
  callbackRequestedAt?: string;
  notes?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

/**
 * Get list of contact attempts with optional filters
 */
export function useContactAttempts(filters?: ContactAttemptFilters) {
  return useQuery({
    queryKey: ['contactAttempts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.orderId) params.append('orderId', filters.orderId);
      if (filters?.bookingId) params.append('bookingId', filters.bookingId);
      if (filters?.propertyId) params.append('propertyId', filters.propertyId);
      if (filters?.attemptType) params.append('attemptType', filters.attemptType);
      if (filters?.outcome) params.append('outcome', filters.outcome);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.attemptedBy) params.append('attemptedBy', filters.attemptedBy);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/field-services/contact-attempts?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch contact attempts');
      }
      const data = await response.json();
      return data as { data: ContactAttempt[]; pagination: any };
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Get a single contact attempt by ID
 */
export function useContactAttempt(id: string | null) {
  return useQuery({
    queryKey: ['contactAttempts', id],
    queryFn: async () => {
      const response = await fetch(`/api/field-services/contact-attempts/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch contact attempt');
      }
      const data = await response.json();
      return data.contactAttempt as ContactAttempt;
    },
    enabled: !!id,
  });
}

/**
 * Get contact attempts for a specific order
 */
export function useOrderContactAttempts(orderId: string | null) {
  return useContactAttempts({
    orderId: orderId || undefined,
  });
}

/**
 * Get contact attempts for a specific booking
 */
export function useBookingContactAttempts(bookingId: string | null) {
  return useContactAttempts({
    bookingId: bookingId || undefined,
  });
}

/**
 * Create a new contact attempt
 */
export function useCreateContactAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: CreateContactAttemptParams) => {
      const response = await fetch('/api/field-services/contact-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contact attempt');
      }

      const data = await response.json();
      return data.contactAttempt as ContactAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactAttempts'] });
      toast({
        title: 'Contact Attempt Logged',
        description: 'Contact attempt has been recorded successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Create contact attempt error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to log contact attempt.',
      });
    },
  });
}

/**
 * Update a contact attempt
 */
export function useUpdateContactAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: UpdateContactAttemptParams) => {
      const { id, ...updates } = params;
      const response = await fetch(`/api/field-services/contact-attempts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update contact attempt');
      }

      const data = await response.json();
      return data.contactAttempt as ContactAttempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contactAttempts'] });
      queryClient.invalidateQueries({ queryKey: ['contactAttempts', data.id] });
      toast({
        title: 'Contact Attempt Updated',
        description: 'Contact attempt has been updated successfully.',
      });
    },
    onError: (error: any) => {
      console.error('Update contact attempt error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to update contact attempt.',
      });
    },
  });
}

/**
 * Delete a contact attempt (admin only)
 */
export function useDeleteContactAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/field-services/contact-attempts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete contact attempt');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactAttempts'] });
      toast({
        title: 'Contact Attempt Deleted',
        description: 'Contact attempt has been removed.',
      });
    },
    onError: (error: any) => {
      console.error('Delete contact attempt error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'Failed to delete contact attempt.',
      });
    },
  });
}

/**
 * Log a phone call
 */
export function useLogPhoneCall() {
  const { mutateAsync: createAttempt } = useCreateContactAttempt();

  return useMutation({
    mutationFn: async (params: {
      orderId?: string;
      bookingId?: string;
      outcome: ContactAttemptOutcome;
      durationSeconds?: number;
      notes?: string;
      callbackRequestedAt?: string;
    }) => {
      return createAttempt({
        ...params,
        attemptType: 'phone_call',
      });
    },
  });
}

/**
 * Log an email send
 */
export function useLogEmail() {
  const { mutateAsync: createAttempt } = useCreateContactAttempt();

  return useMutation({
    mutationFn: async (params: {
      orderId?: string;
      bookingId?: string;
      outcome: 'email_sent' | 'email_bounced';
      contactEmail?: string;
      notes?: string;
      metadata?: Record<string, any>; // Can include email message ID, etc.
    }) => {
      return createAttempt({
        ...params,
        attemptType: 'email',
      });
    },
  });
}

/**
 * Log an SMS send
 */
export function useLogSMS() {
  const { mutateAsync: createAttempt } = useCreateContactAttempt();

  return useMutation({
    mutationFn: async (params: {
      orderId?: string;
      bookingId?: string;
      outcome: 'sms_sent' | 'sms_failed';
      contactPhone?: string;
      notes?: string;
      metadata?: Record<string, any>; // Can include SMS provider ID, etc.
    }) => {
      return createAttempt({
        ...params,
        attemptType: 'sms',
      });
    },
  });
}
