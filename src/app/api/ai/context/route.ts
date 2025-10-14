import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/ai/context/:clientId
 * 
 * Aggregates all relevant client data for AI context generation.
 * Returns: client details, recent activities, active deals, pending tasks, order history
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Extract clientId from URL
    const url = new URL(request.url)
    const clientId = url.searchParams.get('clientId')
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Fetch client details with contacts
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        contacts:contacts(*)
      `)
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Fetch recent activities (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('client_id', clientId)
      .gte('activity_date', thirtyDaysAgo.toISOString())
      .order('activity_date', { ascending: false })
      .limit(20)

    // Fetch active deals
    const { data: activeDeals } = await supabase
      .from('deals')
      .select('*')
      .eq('client_id', clientId)
      .neq('stage', 'won')
      .neq('stage', 'lost')
      .order('created_at', { ascending: false })

    // Fetch pending tasks
    const { data: pendingTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_completed', false)
      .order('due_date', { ascending: true })

    // Fetch recent orders (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        property_address,
        property_type,
        created_at,
        due_date
      `)
      .eq('client_id', clientId)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch client tags
    const { data: clientTags } = await supabase
      .from('client_tags')
      .select(`
        tag:tags(*)
      `)
      .eq('client_id', clientId)

    // Calculate engagement metrics
    const lastActivity = activities && activities.length > 0 
      ? activities[0].activity_date 
      : null
    
    const daysSinceLastContact = lastActivity 
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Identify stalled deals (no activity in 14+ days)
    const stalledDeals = activeDeals?.filter(deal => {
      const dealAge = Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      return dealAge > 14
    }) || []

    // Identify overdue tasks
    const overdueTasks = pendingTasks?.filter(task => {
      if (!task.due_date) return false
      return new Date(task.due_date) < new Date()
    }) || []

    // Build context object optimized for AI consumption
    const context = {
      client: {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        tags: clientTags?.map((ct: any) => ct.tag?.name).filter(Boolean) || [],
        primaryContact: client.contacts?.[0] || null,
        totalContacts: client.contacts?.length || 0
      },
      engagement: {
        lastContactDate: lastActivity,
        daysSinceLastContact,
        totalActivitiesLast30Days: activities?.length || 0,
        activityTrend: (activities?.length || 0) > 0 ? 'active' : 'inactive'
      },
      recentActivities: activities?.slice(0, 10).map((activity: any) => ({
        type: activity.activity_type,
        subject: activity.subject,
        date: activity.activity_date,
        notes: activity.notes?.substring(0, 200) // Limit for token efficiency
      })) || [],
      deals: {
        total: activeDeals?.length || 0,
        totalValue: activeDeals?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0,
        byStage: activeDeals?.reduce((acc: any, deal: any) => {
          acc[deal.stage] = (acc[deal.stage] || 0) + 1
          return acc
        }, {}) || {},
        stalled: stalledDeals.map((deal: any) => ({
          id: deal.id,
          title: deal.title,
          stage: deal.stage,
          value: deal.value,
          daysSinceUpdate: Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        }))
      },
      tasks: {
        total: pendingTasks?.length || 0,
        overdue: overdueTasks.length,
        upcoming: pendingTasks?.filter((task: any) => {
          if (!task.due_date) return false
          const dueDate = new Date(task.due_date)
          const now = new Date()
          const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))
          return dueDate >= now && dueDate <= threeDaysFromNow
        }).length || 0
      },
      orders: {
        total: orders?.length || 0,
        recentStatuses: orders?.slice(0, 5).map((order: any) => ({
          orderNumber: order.order_number,
          status: order.status,
          propertyType: order.property_type,
          createdAt: order.created_at
        })) || []
      },
      insights: {
        needsFollowUp: daysSinceLastContact !== null && daysSinceLastContact > 7,
        hasStalledDeals: stalledDeals.length > 0,
        hasOverdueTasks: overdueTasks.length > 0,
        isHighValue: activeDeals?.some((deal: any) => deal.value > 10000) || false
      }
    }

    // Return context with cache headers
    return NextResponse.json(context, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      }
    })

  } catch (error) {
    console.error('Error fetching AI context:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client context' },
      { status: 500 }
    )
  }
}

