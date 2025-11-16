import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum([
    "pending",
    "assigned",
    "scheduled",
    "in_progress",
    "inspection_complete",
    "writing",
    "review",
    "completed",
    "delivered",
    "cancelled",
    "on_hold"
  ]),
  notes: z.string().optional(),
});

/**
 * PATCH /api/orders/[id]/status
 *
 * Update the status of an order.
 * Only accessible by users who own the order (via tenant_id).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = statusSchema.parse(body);

    // Get user's tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", session.user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 400 });
    }

    // Verify order belongs to this tenant and update it
    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("tenant_id", profile.tenant_id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Order not found or access denied" },
          { status: 404 }
        );
      }
      throw updateError;
    }

    // Log status change
    await supabase.from("order_status_history").insert({
      order_id: params.id,
      old_status: order.status,
      new_status: status,
      changed_by: session.user.id,
      notes: notes || null,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("Order status update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid status", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/[id]/status
 *
 * Get the status history of an order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", session.user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 400 });
    }

    // Verify access to order
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", params.id)
      .or(`tenant_id.eq.${profile.tenant_id},id.in.(select order_id from borrower_order_access where borrower_id = '${session.user.id}')`)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    // Get status history
    const { data: history, error: historyError } = await supabase
      .from("order_status_history")
      .select(`
        id,
        old_status,
        new_status,
        notes,
        created_at,
        changed_by,
        profiles:changed_by (
          id,
          email
        )
      `)
      .eq("order_id", params.id)
      .order("created_at", { ascending: false });

    if (historyError) {
      throw historyError;
    }

    return NextResponse.json({
      current_status: order.status,
      history: history || [],
    });
  } catch (error: any) {
    console.error("Order status retrieval error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to retrieve order status" },
      { status: 500 }
    );
  }
}
