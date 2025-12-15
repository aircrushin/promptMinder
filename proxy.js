import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/prompts(.*)', '/playground(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()

  const { userId } = auth()
  if (userId && req.nextUrl.pathname === '/') {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/prompts'
    return NextResponse.redirect(redirectUrl)
  }
  
  const response = NextResponse.next()
  
  // Add image optimization headers for static assets
  if (req.nextUrl.pathname.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/)) {
    // Set cache headers for images
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    // Add security headers for images
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // Add CORS headers for images if needed
    if (req.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    }
  }
  
  // Add performance headers for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  }
  
  return response
})



export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}