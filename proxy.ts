import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip proxy for static assets and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Create Supabase client with proper cookie handling
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = request.cookies.get(name)
        return cookie?.value
      },
    },
  })

  try {
    // TEMPORARILY DISABLE AUTH CHECK FOR TESTING
    console.log('🔍 Auth temporarily disabled for testing')
    console.log('🔍 Proxy auth check:', { 
      pathname,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    // Allow access to all routes for now
    return NextResponse.next()

    // Original auth logic (commented out)
    /*
    // Try to get session from cookie directly
    const authCookie = request.cookies.get('sb-kkphktqaxbvhniqpfcnj-auth-token')
    let user = null
    let session = null
    
    if (authCookie?.value) {
      try {
        // Supabase cookie format is base64 encoded JSON
        const cookieValue = JSON.parse(Buffer.from(authCookie.value, 'base64').toString())
        if (cookieValue.access_token) {
          // Use the access token to get user
          const { data: userData } = await supabase.auth.getUser(cookieValue.access_token)
          user = userData.user
          session = { user, access_token: cookieValue.access_token }
        }
      } catch (cookieError) {
        console.log('Failed to parse auth cookie:', cookieError)
        // Try alternative method - use getSession with proper cookie setup
        const { data: { session: sessionData } } = await supabase.auth.getSession()
        user = sessionData?.user
        session = sessionData
      }
    }
    
    console.log('🔍 Proxy auth check:', { 
      pathname, 
      userId: user?.id, 
      userEmail: user?.email,
      hasSession: !!session,
      hasAuthCookie: !!authCookie?.value,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    // Simple logic: authenticated user on login page -> redirect to dashboard
    if (user && pathname === '/login') {
      console.log('✅ Redirecting authenticated user from login to dashboard')
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    // Simple logic: unauthenticated user on admin routes -> redirect to login
    if (pathname.includes('/admin') && !user) {
      console.log('❌ Redirecting unauthenticated user from admin to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    console.log('✅ Allowing access to:', pathname)
    */
  } catch (error) {
    console.error('💥 Proxy auth error:', error)
    // Only protect admin routes on error
    if (pathname.includes('/admin')) {
      console.log('❌ Error - redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/:store_id/admin/:path*', '/login']
}
