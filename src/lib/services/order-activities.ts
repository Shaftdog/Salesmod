/**
 * Order Activities Service
 * Utility functions for logging order activities from application code
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type OrderActivityType =
  | "order_created"
  | "status_changed"
  | "assigned"
  | "unassigned"
  | "document_uploaded"
  | "document_deleted"
  | "note_added"
  | "note_updated"
  | "due_date_changed"
  | "priority_changed"
  | "invoice_created"
  | "invoice_sent"
  | "payment_received"
  | "contact_added"
  | "contact_removed"
  | "revision_requested"
  | "correction_requested"
  | "custom";

interface LogActivityParams {
  supabase: SupabaseClient;
  orderId: string;
  tenantId: string;
  activityType: OrderActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  performedById?: string;
  performedByName?: string;
  isSystem?: boolean;
}

/**
 * Log an order activity
 */
export async function logOrderActivity({
  supabase,
  orderId,
  tenantId,
  activityType,
  description,
  metadata = {},
  performedById,
  performedByName,
  isSystem = false,
}: LogActivityParams): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase
      .from("order_activities")
      .insert({
        tenant_id: tenantId,
        order_id: orderId,
        activity_type: activityType,
        description,
        metadata,
        performed_by: performedById,
        performed_by_name: performedByName || (isSystem ? "System" : "Unknown"),
        is_system: isSystem,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error logging order activity:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error logging order activity:", err);
    return null;
  }
}

/**
 * Log a note added activity
 */
export async function logNoteAdded(
  supabase: SupabaseClient,
  orderId: string,
  tenantId: string,
  noteType: string,
  performedById: string,
  performedByName: string
): Promise<void> {
  await logOrderActivity({
    supabase,
    orderId,
    tenantId,
    activityType: "note_added",
    description: `${noteType.charAt(0).toUpperCase() + noteType.slice(1)} note added`,
    metadata: { note_type: noteType },
    performedById,
    performedByName,
  });
}

/**
 * Log an invoice created activity
 */
export async function logInvoiceCreated(
  supabase: SupabaseClient,
  orderId: string,
  tenantId: string,
  invoiceNumber: string,
  amount: number,
  performedById: string,
  performedByName: string
): Promise<void> {
  await logOrderActivity({
    supabase,
    orderId,
    tenantId,
    activityType: "invoice_created",
    description: `Invoice ${invoiceNumber} created for $${amount.toFixed(2)}`,
    metadata: { invoice_number: invoiceNumber, amount },
    performedById,
    performedByName,
  });
}

/**
 * Log a revision requested activity
 */
export async function logRevisionRequested(
  supabase: SupabaseClient,
  orderId: string,
  tenantId: string,
  reason: string,
  performedById: string,
  performedByName: string
): Promise<void> {
  await logOrderActivity({
    supabase,
    orderId,
    tenantId,
    activityType: "revision_requested",
    description: "Revision requested",
    metadata: { reason },
    performedById,
    performedByName,
  });
}

/**
 * Log a correction requested activity
 */
export async function logCorrectionRequested(
  supabase: SupabaseClient,
  orderId: string,
  tenantId: string,
  reason: string,
  performedById: string,
  performedByName: string
): Promise<void> {
  await logOrderActivity({
    supabase,
    orderId,
    tenantId,
    activityType: "correction_requested",
    description: "Correction requested",
    metadata: { reason },
    performedById,
    performedByName,
  });
}

/**
 * Log a contact added to order activity
 */
export async function logContactAdded(
  supabase: SupabaseClient,
  orderId: string,
  tenantId: string,
  contactName: string,
  contactRole: string,
  performedById: string,
  performedByName: string
): Promise<void> {
  await logOrderActivity({
    supabase,
    orderId,
    tenantId,
    activityType: "contact_added",
    description: `${contactName} added as ${contactRole}`,
    metadata: { contact_name: contactName, role: contactRole },
    performedById,
    performedByName,
  });
}

/**
 * Log a contact removed from order activity
 */
export async function logContactRemoved(
  supabase: SupabaseClient,
  orderId: string,
  tenantId: string,
  contactName: string,
  performedById: string,
  performedByName: string
): Promise<void> {
  await logOrderActivity({
    supabase,
    orderId,
    tenantId,
    activityType: "contact_removed",
    description: `${contactName} removed`,
    metadata: { contact_name: contactName },
    performedById,
    performedByName,
  });
}
