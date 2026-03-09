import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Public routes - no auth required
  const publicRoutes = ['/', '/login']
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Customer routes - store_id and table required
  if (pathname.startsWith('/BS001/') || pathname.match(/^\/[^\/]+\/(menu|kds)$/)) {
    // For customer menu, check table parameter
    if (pathname.includes('/menu')) {
      const url = new URL(request.url)
      const table = url.searchParams.get('table')
      if (!table) {
        return NextResponse.redirect(new URL('/?error=table_required', request.url))
      }
    }
    return NextResponse.next()
  }

  // Protected routes - auth required (only KDS needs auth now)
  if (pathname.startsWith('/admin/') || (pathname.includes('/kds') && !pathname.includes('/menu') && !pathname.includes('/orders'))) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      // Additional check for store ownership
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', session.user.id)
        .limit(1)
      
      if (!stores || stores.length === 0) {
        return NextResponse.redirect(new URL('/login?error=no_store', request.url))
      }
      
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
