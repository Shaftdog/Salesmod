import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface TaskDetail {
  id: string;
  name: string;
  status: string;
  due_date: string | null;
  estimated_minutes: number | null;
  order_number: string | null;
  property_address: string | null;
  stage_name: string | null;
  card_id: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tenantId = profile.tenant_id;

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: userId, startDate, endDate" },
        { status: 400 }
      );
    }

    // Fetch tasks for this user in the date range (only parent tasks)
    const { data: tasks, error: tasksError } = await supabase
      .from("production_tasks")
      .select(`
        id,
        name,
        status,
        due_date,
        estimated_minutes,
        production_card_id
      `)
      .eq("tenant_id", tenantId)
      .eq("assigned_to", userId)
      .is("parent_task_id", null) // Only parent tasks
      .gte("due_date", startDate)
      .lte("due_date", endDate)
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true })
      .limit(100);

    if (tasksError) {
      console.error("Tasks fetch error:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    // Get card IDs for enrichment
    const cardIds = [...new Set(tasks?.map((t) => t.production_card_id).filter(Boolean))];

    // Fetch production cards for order info
    let cardsMap = new Map<string, { order_id: string | null; stage_name: string | null }>();
    if (cardIds.length > 0) {
      const { data: cards } = await supabase
        .from("production_cards")
        .select("id, order_id, current_stage")
        .in("id", cardIds);

      if (cards) {
        cards.forEach((c) => {
          cardsMap.set(c.id, {
            order_id: c.order_id,
            stage_name: c.current_stage,
          });
        });
      }
    }

    // Get order IDs
    const orderIds = [...new Set([...cardsMap.values()].map((c) => c.order_id).filter(Boolean))];

    // Fetch orders for order numbers and property info
    let ordersMap = new Map<string, { order_number: string; property_id: string | null }>();
    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number, property_id")
        .in("id", orderIds as string[]);

      if (orders) {
        orders.forEach((o) => {
          ordersMap.set(o.id, {
            order_number: o.order_number,
            property_id: o.property_id,
          });
        });
      }
    }

    // Get property IDs
    const propertyIds = [...new Set([...ordersMap.values()].map((o) => o.property_id).filter(Boolean))];

    // Fetch properties for addresses
    let propertiesMap = new Map<string, string>();
    if (propertyIds.length > 0) {
      const { data: properties } = await supabase
        .from("properties")
        .select("id, street_address, city, state")
        .in("id", propertyIds as string[]);

      if (properties) {
        properties.forEach((p) => {
          const address = [p.street_address, p.city, p.state].filter(Boolean).join(", ");
          propertiesMap.set(p.id, address);
        });
      }
    }

    // Enrich tasks with order and property info
    const enrichedTasks: TaskDetail[] = (tasks || []).map((task) => {
      const cardInfo = task.production_card_id ? cardsMap.get(task.production_card_id) : null;
      const orderInfo = cardInfo?.order_id ? ordersMap.get(cardInfo.order_id) : null;
      const propertyAddress = orderInfo?.property_id ? propertiesMap.get(orderInfo.property_id) : null;

      return {
        id: task.id,
        name: task.name,
        status: task.status,
        due_date: task.due_date,
        estimated_minutes: task.estimated_minutes,
        order_number: orderInfo?.order_number || null,
        property_address: propertyAddress || null,
        stage_name: cardInfo?.stage_name || null,
        card_id: task.production_card_id,
      };
    });

    // Calculate summary stats
    const totalTasks = enrichedTasks.length;
    const totalMinutes = enrichedTasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const totalHours = totalMinutes / 60;

    // Group by status
    const byStatus = enrichedTasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by stage
    const byStage = enrichedTasks.reduce((acc, t) => {
      const stage = t.stage_name || "Unknown";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      tasks: enrichedTasks,
      summary: {
        totalTasks,
        totalHours: Math.round(totalHours * 10) / 10,
        byStatus,
        byStage,
      },
    });
  } catch (error) {
    console.error("Workload drill-down error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
