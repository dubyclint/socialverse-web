// ============================================================================
// FILE: /middleware/auth.ts - STABLE PROTECTED-ROUTE GUARD
// ============================================================================
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useSupabaseUser, useSupabaseClient } from '#imports'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to?.path) return

  const user = useSupabaseUser()
  const normalizedPath = to.path.replace(/\/$/, '') || '/'

  const publicRoutes = [
    '/', '/signin', '/signup', '/auth/forgot-password', 
    '/auth/reset-password', '/auth/verify-email', 
    '/terms-and-policy', '/privacy-policy'
  ]
  const protectedPrefixes = [
    '/feed', '/profile', '/settings', '/notifications', 
    '/messages', '/inbox', '/chat', '/explore', '/match', '/wallet', '/admin'
  ]

  const startsWithSegment = (path: string, prefix: string) => 
    path === prefix || path.startsWith(`${prefix}/`)
  
  const isPublicRoute = publicRoutes.some((route) => startsWithSegment(normalizedPath, route))
  const isProtectedRoute = protectedPrefixes.some((route) => startsWithSegment(normalizedPath, route))

  if (!isProtectedRoute || isPublicRoute) return

  // Native session validation via @nuxtjs/supabase
  if (!user.value) {
    return navigateTo(`/signin?redirect=${encodeURIComponent(to.fullPath)}`, { replace: true })
  }
})
