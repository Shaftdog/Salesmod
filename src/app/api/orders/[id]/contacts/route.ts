import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  createOrderContacts,
  extractContactsFromOrderData,
  getOrderContacts,
  ORDER_CONTACT_ROLES,
  type OrderContactInput
} from "@/lib/services/order-contacts";

const contactInputSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  title: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum([
    ORDER_CONTACT_ROLES.BORROWER,
    ORDER_CONTACT_ROLES.LOAN_OFFICER,
    ORDER_CONTACT_ROLES.PROCESSOR,
    ORDER_CONTACT_ROLES.PROPERTY_CONTACT,
    ORDER_CONTACT_ROLES.REALTOR,
    ORDER_CONTACT_ROLES.LISTING_AGENT,
    ORDER_CONTACT_ROLES.BUYING_AGENT,
    "cc",
    "orderer",
  ]),
  companyName: z.string().nullable().optional(),
});

const createContactsSchema = z.object({
  contacts: z.array(contactInputSchema).min(1, "At least one contact is required"),
});

// Schema for creating contacts from order fields (alternative input format)
const createFromOrderFieldsSchema = z.object({
  borrowerName: z.string().optional(),
  borrowerEmail: z.string().email().optional().or(z.literal("")),
  borrowerPhone: z.string().optional(),
  loanOfficer: z.string().optional(),
  loanOfficerEmail: z.string().email().optional().or(z.literal("")),
  loanOfficerPhone: z.string().optional(),
  processorName: z.string().optional(),
  processorEmail: z.string().email().optional().or(z.literal("")),
  processorPhone: z.string().optional(),
  propertyContactName: z.string().optional(),
  propertyContactEmail: z.string().email().optional().or(z.literal("")),
  propertyContactPhone: z.string().optional(),
  realtorName: z.string().optional(),
  realtorEmail: z.string().email().optional().or(z.literal("")),
  realtorPhone: z.string().optional(),
  lenderName: z.string().optional(),
});

/**
 * POST /api/orders/[id]/contacts
 *
 * Create contacts from order data and link them to the order.
 * Supports two input formats:
 * 1. { contacts: [{ fullName, email, phone, role }] }
 * 2. { borrowerName, borrowerEmail, loanOfficer, ... } (order field format)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
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

    // Verify order exists and belongs to this tenant
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, client_id, tenant_id")
      .eq("id", orderId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Determine input format and parse contacts
    let contacts: OrderContactInput[];

    if (body.contacts && Array.isArray(body.contacts)) {
      // Format 1: Explicit contacts array
      const validated = createContactsSchema.parse(body);
      contacts = validated.contacts;
    } else {
      // Format 2: Order field format
      const validated = createFromOrderFieldsSchema.parse(body);
      contacts = extractContactsFromOrderData(validated);

      if (contacts.length === 0) {
        return NextResponse.json(
          { error: "No contacts found in input data" },
          { status: 400 }
        );
      }
    }

    // Create contacts
    const result = await createOrderContacts({
      orderId,
      clientId: order.client_id,
      tenantId: profile.tenant_id,
      contacts,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Order contacts creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create order contacts" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/[id]/contacts
 *
 * Get all contacts linked to an order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
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

    // Verify order access (tenant or borrower)
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!order) {
      // Check borrower access
      const { data: borrowerAccess } = await supabase
        .from("borrower_order_access")
        .select("order_id")
        .eq("borrower_id", session.user.id)
        .eq("order_id", orderId)
        .single();

      if (!borrowerAccess) {
        return NextResponse.json(
          { error: "Order not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Get order contacts
    const contacts = await getOrderContacts(orderId);

    // Role label mapping for display
    const roleLabelMap: Record<string, string> = {
      borrower: 'Borrower',
      loan_officer: 'Loan Officer',
      processor: 'Processor',
      property_contact: 'Property Contact',
      realtor: 'Realtor',
      listing_agent: 'Listing Agent',
      buying_agent: 'Buying Agent',
      cc: 'CC (Email Recipient)',
      orderer: 'Orderer',
    };

    // Transform for response
    const formattedContacts = contacts.map((oc: any) => ({
      contactId: oc.contact_id,
      roleCode: oc.role_code,
      roleLabel: roleLabelMap[oc.role_code] || oc.role_code.replace(/_/g, ' '),
      isPrimary: oc.is_primary,
      contact: oc.contacts ? {
        id: oc.contacts.id,
        fullName: `${oc.contacts.first_name} ${oc.contacts.last_name}`.trim(),
        firstName: oc.contacts.first_name,
        lastName: oc.contacts.last_name,
        email: oc.contacts.email,
        phone: oc.contacts.phone,
        mobile: oc.contacts.mobile,
        title: oc.contacts.title,
      } : null,
    }));

    return NextResponse.json({
      orderId,
      contacts: formattedContacts,
    });
  } catch (error: any) {
    console.error("Order contacts retrieval error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to retrieve order contacts" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]/contacts
 *
 * Remove a contact from an order.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
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

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const roleCode = searchParams.get("roleCode");

    if (!contactId && !roleCode) {
      return NextResponse.json(
        { error: "Either contactId or roleCode is required" },
        { status: 400 }
      );
    }

    // Verify order access
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    // Build delete query
    let query = supabase
      .from("order_contacts")
      .delete()
      .eq("order_id", orderId);

    if (contactId) {
      query = query.eq("contact_id", contactId);
    }
    if (roleCode) {
      query = query.eq("role_code", roleCode);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      throw deleteError;
    }

    // Clear the direct reference on the order if roleCode provided
    if (roleCode) {
      const columnMap: Record<string, string> = {
        borrower: "borrower_contact_id",
        loan_officer: "loan_officer_contact_id",
        processor: "processor_contact_id",
        property_contact: "property_contact_id",
        realtor: "realtor_contact_id",
        listing_agent: "realtor_contact_id",
        buying_agent: "realtor_contact_id",
      };

      const column = columnMap[roleCode];
      if (column) {
        await supabase
          .from("orders")
          .update({ [column]: null })
          .eq("id", orderId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Order contact deletion error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to delete order contact" },
      { status: 500 }
    );
  }
}
