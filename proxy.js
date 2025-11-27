import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/local-auth/password.js'

// 需要认证的路由
const protectedRoutes = ['/prompts', '/teams']

function isProtectedRoute(pathname) {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

export default async function middleware(req) {
  const { pathname } = req.nextUrl
  
  // 检查是否是受保护的路由
  if (isProtectedRoute(pathname)) {
    const sessionToken = req.cookies.get(AUTH_COOKIE_NAME)?.value
    
    if (!sessionToken) {
      // 未登录，重定向到登录页
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }
  
  const response = NextResponse.next()
  
  // Add image optimization headers for static assets
  if (pathname.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/)) {
    // Set cache headers for images
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    // Add security headers for images
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // Add CORS headers for images if needed
    if (pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    }
  }
  
  // Add performance headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  }
  
  return response
}



export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}