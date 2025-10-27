import { withAdminAuth } from '@/lib/admin/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/audit-logs
 * Query audit logs with filtering and pagination
 */
export const GET = withAdminAuth(async (request: NextRequest, { supabase }) => {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Filters
    const userId = searchParams.get('user_id') || ''
    const action = searchParams.get('action') || ''
    const resourceType = searchParams.get('resource_type') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''
    const search = searchParams.get('search') || ''

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build query
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email
        )
      `, { count: 'exact' })

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    if (search) {
      query = query.or(`action.ilike.%${search}%,resource_type.ilike.%${search}%`)
    }

    // Apply sorting and pagination
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    query = query.range(from, to)

    const { data: logs, error, count } = await query

    if (error) {
      throw error
    }

    // Get unique actions and resource types for filters
    const { data: actionsData } = await supabase
      .from('audit_logs')
      .select('action')
      .order('action')

    const { data: resourceTypesData } = await supabase
      .from('audit_logs')
      .select('resource_type')
      .order('resource_type')

    const uniqueActions = [...new Set(actionsData?.map(a => a.action).filter(Boolean))]
    const uniqueResourceTypes = [...new Set(resourceTypesData?.map(r => r.resource_type).filter(Boolean))]

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: {
        actions: uniqueActions,
        resourceTypes: uniqueResourceTypes,
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
})
