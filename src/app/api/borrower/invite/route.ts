import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeAsAdmin, sendBorrowerMagicLink } from "@/lib/supabase/admin";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  orderId: z.string().uuid("Invalid order ID"),
  borrowerName: z.string().min(2, "Borrower name is required"),
});

/**
 * POST /api/borrower/invite
 *
 * Invites a borrower to access their appraisal order via magic link.
 * Creates a borrower profile if needed and sends passwordless login link.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, orderId, borrowerName } = inviteSchema.parse(body);

    // Get user's tenant to verify order ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", session.user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 400 });
    }

    // Verify the order belongs to this tenant
    const { data: order } = await supabase
      .from("orders")
      .select("id, property_id")
      .eq("id", orderId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if borrower user already exists
    const { data: existingUser } = await executeAsAdmin(
      "check_borrower_user",
      session.user.id,
      async (adminClient) => {
        return await adminClient.auth.admin.listUsers();
      }
    );

    let borrowerUserId: string;
    const borrowerEmail = email.toLowerCase();

    // Find if user with this email already exists
    const existingBorrower = existingUser?.users?.find(
      (u: any) => u.email === borrowerEmail
    );

    if (existingBorrower) {
      borrowerUserId = existingBorrower.id;
    } else {
      // Create borrower user via admin API
      const { data: newUser, error: createError } = await executeAsAdmin(
        "create_borrower_user",
        session.user.id,
        async (adminClient) => {
          return await adminClient.auth.admin.createUser({
            email: borrowerEmail,
            email_confirm: true,
            user_metadata: {
              name: borrowerName,
              role: "borrower",
            },
          });
        }
      );

      if (createError || !newUser?.user) {
        throw new Error("Failed to create borrower user");
      }

      borrowerUserId = newUser.user.id;

      // Create borrower profile
      await executeAsAdmin(
        "create_borrower_profile",
        session.user.id,
        async (adminClient) => {
          return await adminClient.from("profiles").insert({
            id: borrowerUserId,
            tenant_id: profile.tenant_id,
          });
        }
      );
    }

    // Grant borrower access to this order
    await executeAsAdmin(
      "grant_borrower_order_access",
      session.user.id,
      async (adminClient) => {
        return await adminClient.from("borrower_order_access").insert({
          borrower_id: borrowerUserId,
          order_id: orderId,
          granted_at: new Date().toISOString(),
        });
      }
    );

    // Send magic link
    await sendBorrowerMagicLink(borrowerEmail, orderId);

    return NextResponse.json({
      success: true,
      message: "Borrower invitation sent successfully",
    });
  } catch (error: any) {
    console.error("Borrower invite error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to send borrower invitation" },
      { status: 500 }
    );
  }
}
