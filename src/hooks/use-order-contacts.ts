/**
 * React Query hooks for order contacts
 *
 * Provides hooks for:
 * - Fetching contacts linked to an order
 * - Creating contacts from order data
 * - Managing contact relationships
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { OrderContactRole } from "@/lib/services/order-contacts";

// Types for order contacts
export interface OrderContactInfo {
  contactId: string;
  roleCode: string;
  roleLabel: string;
  roleCategory?: string;
  isPrimary: boolean;
  contact: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    mobile?: string;
    title?: string;
  } | null;
}

export interface OrderContactsResponse {
  orderId: string;
  contacts: OrderContactInfo[];
}

export interface CreateOrderContactsInput {
  contacts?: Array<{
    fullName: string;
    email?: string | null;
    phone?: string | null;
    role: OrderContactRole;
    companyName?: string | null;
  }>;
  // Alternative: Order field format
  borrowerName?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  loanOfficer?: string;
  loanOfficerEmail?: string;
  loanOfficerPhone?: string;
  processorName?: string;
  processorEmail?: string;
  processorPhone?: string;
  propertyContactName?: string;
  propertyContactEmail?: string;
  propertyContactPhone?: string;
  lenderName?: string;
}

export interface CreateOrderContactsResult {
  success: boolean;
  results: Array<{
    success: boolean;
    contactId?: string;
    isNew?: boolean;
    wasEnriched?: boolean;
    enrichmentFailed?: boolean;
    error?: string;
    role: string;
    fullName: string;
  }>;
  totalCreated: number;
  totalExisting: number;
  totalEnriched: number;
  totalFailed: number;
}

/**
 * Fetch contacts linked to an order
 */
async function fetchOrderContacts(orderId: string): Promise<OrderContactsResponse> {
  const response = await fetch(`/api/orders/${orderId}/contacts`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch order contacts");
  }

  return response.json();
}

/**
 * Create contacts from order data
 */
async function createOrderContacts(
  orderId: string,
  input: CreateOrderContactsInput
): Promise<CreateOrderContactsResult> {
  const response = await fetch(`/api/orders/${orderId}/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create order contacts");
  }

  return response.json();
}

/**
 * Delete a contact from an order
 */
async function deleteOrderContact(
  orderId: string,
  options: { contactId?: string; roleCode?: string }
): Promise<{ success: boolean }> {
  const params = new URLSearchParams();
  if (options.contactId) params.set("contactId", options.contactId);
  if (options.roleCode) params.set("roleCode", options.roleCode);

  const response = await fetch(
    `/api/orders/${orderId}/contacts?${params.toString()}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete order contact");
  }

  return response.json();
}

/**
 * Hook to fetch order contacts
 */
export function useOrderContacts(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order-contacts", orderId],
    queryFn: () => fetchOrderContacts(orderId!),
    enabled: !!orderId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create order contacts
 */
export function useCreateOrderContacts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      orderId,
      input,
    }: {
      orderId: string;
      input: CreateOrderContactsInput;
    }) => createOrderContacts(orderId, input),

    onSuccess: (data, variables) => {
      // Invalidate order contacts query
      queryClient.invalidateQueries({
        queryKey: ["order-contacts", variables.orderId],
      });

      // Invalidate contacts list (since new contacts may have been created)
      queryClient.invalidateQueries({
        queryKey: ["contacts"],
      });

      // Show success message
      if (data.totalCreated > 0 || data.totalExisting > 0) {
        const messages: string[] = [];
        if (data.totalCreated > 0) {
          messages.push(`${data.totalCreated} new contact(s) created`);
        }
        if (data.totalExisting > 0) {
          messages.push(`${data.totalExisting} existing contact(s) linked`);
        }
        if (data.totalEnriched > 0) {
          messages.push(`${data.totalEnriched} enriched via Apollo`);
        }

        toast({
          title: "Contacts Processed",
          description: messages.join(", "),
        });
      }

      // Show warning if some failed
      if (data.totalFailed > 0) {
        toast({
          variant: "destructive",
          title: "Some Contacts Failed",
          description: `${data.totalFailed} contact(s) could not be created. Check that they have a name and either email or phone.`,
        });
      }
    },

    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error Creating Contacts",
        description: error.message,
      });
    },
  });
}

/**
 * Hook to delete an order contact
 */
export function useDeleteOrderContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      orderId,
      contactId,
      roleCode,
    }: {
      orderId: string;
      contactId?: string;
      roleCode?: string;
    }) => deleteOrderContact(orderId, { contactId, roleCode }),

    onSuccess: (_, variables) => {
      // Invalidate order contacts query
      queryClient.invalidateQueries({
        queryKey: ["order-contacts", variables.orderId],
      });

      toast({
        title: "Contact Removed",
        description: "Contact has been unlinked from this order.",
      });
    },

    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error Removing Contact",
        description: error.message,
      });
    },
  });
}

/**
 * Hook to get a specific contact by role from an order
 */
export function useOrderContactByRole(
  orderId: string | undefined,
  roleCode: string
) {
  const { data, ...rest } = useOrderContacts(orderId);

  const contact = data?.contacts.find((c) => c.roleCode === roleCode);

  return {
    ...rest,
    data: contact,
  };
}
