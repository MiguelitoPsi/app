import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip middleware for API routes and static files
  if (path.startsWith('/api/') || path.startsWith('/_next/') || path.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionToken = request.cookies.get('better-auth.session_token')
  const isAuthenticated = !!sessionToken

  // Public paths that don't require authentication
  const isPublicPath = path === '/' || path.startsWith('/auth/')

  // Redirect logic - user must be authenticated unless on public path
  const shouldRedirectToSignIn = !(isAuthenticated || isPublicPath)
  if (shouldRedirectToSignIn) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Redirect authenticated users away from auth pages
  const shouldRedirectToHome = isAuthenticated && path.startsWith('/auth/')
  if (shouldRedirectToHome) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
