import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Valid area codes for validation
const VALID_AREA_CODES = ['sales', 'marketing', 'production', 'operations', 'logistics', 'finance', 'ai_automation', 'admin'] as const
type ValidAreaCode = typeof VALID_AREA_CODES[number]

// Route to area mapping for middleware protection
const ROUTE_AREA_MAP: Record<string, ValidAreaCode> = {
  '/sales': 'sales',
  '/marketing': 'marketing',
  '/production': 'production',
  '/operations': 'operations',
  '/logistics': 'logistics',
  '/finance': 'finance',
  '/agent': 'ai_automation',
  '/ai-analytics': 'ai_automation',
}

// Get area code from pathname (returns only valid area codes)
function getAreaFromPath(pathname: string): ValidAreaCode | null {
  for (const [route, area] of Object.entries(ROUTE_AREA_MAP)) {
    if (pathname.startsWith(route)) {
      // Extra validation to ensure area is valid
      if (VALID_AREA_CODES.includes(area as ValidAreaCode)) {
        return area as ValidAreaCode
      }
    }
  }
  return null
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Protect routes that require authentication
  const protectedRoutes = [
    '/dashboard', '/orders', '/clients', '/deals', '/tasks', '/settings',
    '/migrations', '/admin', '/client-portal', '/borrower',
    '/sales', '/marketing', '/production', '/operations', '/logistics', '/finance',
    '/agent', '/ai-analytics', '/properties', '/contacts', '/cases', '/field-services'
  ];
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If user is not authenticated and trying to access protected route, redirect
  if (!user && isProtectedRoute) {
    // Return redirect response
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Get user's profile if authenticated
  let userProfile: { role: string } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userProfile = profile
  }

  // Protect admin routes - require admin or super_admin role
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    // Redirect to dashboard if user is not an admin or super_admin
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Protect role management routes - require super_admin role
  if (user && request.nextUrl.pathname.startsWith('/admin/roles')) {
    if (!userProfile || userProfile.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Area-based access protection for department routes
  // Super admins have access to all areas
  const pathname = request.nextUrl.pathname
  const requiredArea = getAreaFromPath(pathname)

  if (user && requiredArea && userProfile && userProfile.role !== 'super_admin') {
    // Check if user has access to the required area
    // Using database function for area access check
    const { data: hasAccess } = await supabase
      .rpc('user_has_area_access', {
        p_user_id: user.id,
        p_area_code: requiredArea
      })

    if (hasAccess === false) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Redirect to dashboard if logged in and trying to access login
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}



