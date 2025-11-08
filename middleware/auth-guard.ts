// FILE: /middleware/auth-guard.ts - CONSOLIDATED & FIXED
// ============================================================================
// REDIRECT AUTHENTICATED USERS AWAY FROM AUTH PAGES
// This is a NON-GLOBAL middleware - only applied to auth routes
// Purpose: Redirect logged-in users from auth pages to feed
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  console.log(`[Auth Guard Middleware] Checking route: ${to.path}`)

  // Only apply this middleware to auth routes
  const authRoutes = [
    '/auth',
    '/auth/signin',
    '/auth/signup',
    '/auth/login',
    '/auth/forgot-password',
    '/auth/verify-email',
    '/auth/reset-password',
    '/auth/confirm',
  ]

  const isAuthRoute = authRoutes.some(route => 
    to.path === route || to.path.startsWith(route + '/')
  )

  // If not an auth route, skip this middleware
  if (!isAuthRoute) {
    return
  }

  // Check if user is already authenticated
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') 
    : null

  // If authenticated user tries to access auth pages, redirect to feed
  if (token) {
    console.log(`[Auth Guard Middleware] ✓ Authenticated user redirected from ${to.path} to /feed`)
    return navigateTo('/feed')
  }

  console.log(`[Auth Guard Middleware] ✓ Unauthenticated user allowed on: ${to.path}`)
})
