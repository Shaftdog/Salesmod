import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/validate-address/stats
 * Get address validation usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get validation logs for the current user's org
    const { data: logs, error: logsError } = await supabase
      .from('validation_logs')
      .select('*')
      .eq('org_id', user.id)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching validation logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch validation logs' }, { status: 500 });
    }

    // Get property validation statistics
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('validation_status, verification_source, created_at')
      .eq('org_id', user.id);

    if (propertiesError) {
      console.error('Error fetching property stats:', propertiesError);
      return NextResponse.json({ error: 'Failed to fetch property statistics' }, { status: 500 });
    }

    // Calculate statistics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Filter logs by time periods
    const thisMonthLogs = logs?.filter(log => 
      new Date(log.created_at) >= thisMonth
    ) || [];

    const lastMonthLogs = logs?.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= lastMonth && logDate < thisMonth;
    }) || [];

    // Calculate usage statistics
    const totalValidations = logs?.length || 0;
    const thisMonthValidations = thisMonthLogs.length;
    const lastMonthValidations = lastMonthLogs.length;

    // Calculate success rates
    const successfulValidations = logs?.filter(log => log.success).length || 0;
    const successRate = totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;

    // Calculate property validation status distribution
    const propertyStats = {
      verified: properties?.filter(p => p.validation_status === 'verified').length || 0,
      partial: properties?.filter(p => p.validation_status === 'partial').length || 0,
      unverified: properties?.filter(p => p.validation_status === 'unverified' || !p.validation_status).length || 0,
      total: properties?.length || 0
    };

    // Calculate API usage by source
    const apiUsage = {
      google: logs?.filter(log => log.source === 'google').length || 0,
      geocoding: logs?.filter(log => log.source === 'geocoding').length || 0,
      mock: logs?.filter(log => log.source === 'mock').length || 0,
      total: totalValidations
    };

    // Calculate cost estimates (Google Address Validation Pro pricing)
    const googleValidations = apiUsage.google;
    const estimatedCost = googleValidations * 0.005; // $0.005 per validation

    // Get recent activity (last 10 validations)
    const recentActivity = logs?.slice(0, 10).map(log => ({
      id: log.id,
      address: log.address,
      success: log.success,
      source: log.source,
      confidence: log.confidence,
      createdAt: log.created_at
    })) || [];

    return NextResponse.json({
      usage: {
        total: totalValidations,
        thisMonth: thisMonthValidations,
        lastMonth: lastMonthValidations,
        successRate: Math.round(successRate * 100) / 100
      },
      properties: propertyStats,
      apiUsage,
      cost: {
        estimated: estimatedCost,
        googleValidations
      },
      recentActivity
    });

  } catch (error) {
    console.error('Validation stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
