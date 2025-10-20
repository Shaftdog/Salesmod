import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateAddressWithGoogle, AddressValidationResult } from '@/lib/address-validation';
import { normalizeAddressKey } from '@/lib/addresses';
import { getCachedValidation, setCachedValidation } from '@/lib/validation-cache';

// Rate limiting: 30 requests per minute per org/IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * POST /api/validate-address
 * Validate and standardize an address using Google Address Validation Pro API
 * 
 * Body: { street, city, state, zip }
 * Returns: AddressValidationResult with standardized address and metadata
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { street, city, state, zip } = body;

    // Validate input
    if (!street || !city || !state || !zip) {
      return NextResponse.json(
        { error: 'Missing required fields: street, city, state, zip' },
        { status: 400 }
      );
    }

    // Rate limiting - per org
    const orgRateKey = `org:${user.id}`;
    const orgRateLimit = checkRateLimit(orgRateKey);
    
    if (!orgRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: orgRateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': orgRateLimit.retryAfter?.toString() || '60'
          }
        }
      );
    }

    // Rate limiting - per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ipRateKey = `ip:${ip}`;
    const ipRateLimit = checkRateLimit(ipRateKey);
    
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: ipRateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': ipRateLimit.retryAfter?.toString() || '60'
          }
        }
      );
    }

    // Check cache
    const cacheKey = normalizeAddressKey(street, city, state, zip);
    const cached = getCachedValidation(cacheKey);
    
    if (cached) {
      return NextResponse.json({
        ...cached,
        fromCache: true,
      });
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return NextResponse.json(
        { 
          error: 'Address validation service not configured',
          isValid: false,
          confidence: 0
        },
        { status: 503 }
      );
    }

    // Call Google Address Validation API
    const result = await validateAddressWithGoogle(street, city, state, zip, apiKey);

    // Cache the result (20 minute TTL)
    setCachedValidation(cacheKey, result, 20);

    // Log validation for telemetry
    try {
      await supabase
        .from('validation_logs')
        .insert({
          org_id: user.id,
          address_input: `${street}, ${city}, ${state} ${zip}`,
          cache_key: cacheKey,
          is_valid: result.isValid,
          confidence: result.confidence,
          was_standardized: !!result.suggestions?.length,
          metadata: result.metadata,
        });
    } catch (logError) {
      // Don't fail validation if logging fails
      console.warn('Failed to log validation:', logError);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Validation endpoint error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Validation failed',
        isValid: false,
        confidence: 0
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/validate-address/stats
 * Get validation usage statistics for current org
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: logs } = await supabase
      .from('validation_logs')
      .select('*')
      .eq('org_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const stats = {
      month: new Date().toISOString().slice(0, 7),
      totalCalls: logs?.length || 0,
      verified: logs?.filter(l => l.is_valid && l.confidence >= 0.8).length || 0,
      partial: logs?.filter(l => l.is_valid && l.confidence < 0.8).length || 0,
      failed: logs?.filter(l => !l.is_valid).length || 0,
      standardized: logs?.filter(l => l.was_standardized).length || 0,
      freeTierLimit: 11764,
      percentUsed: ((logs?.length || 0) / 11764 * 100).toFixed(1),
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('Validation stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get stats' },
      { status: 500 }
    );
  }
}
