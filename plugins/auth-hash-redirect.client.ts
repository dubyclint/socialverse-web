// ============================================================================
// FILE: /plugins/auth-hash-redirect.client.ts - HANDLE SUPABASE AUTH HASH
// ============================================================================
// This plugin runs on client initialization and handles Supabase auth redirects
// ✅ FIX: Intercept hash-based auth redirects from Supabase
// ============================================================================

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (!process.client) return

  console.log('[Auth Hash Redirect Plugin] Initializing...')
  console.log('[Auth Hash Redirect Plugin] Current URL:', window.location.href)
  console.log('[Auth Hash Redirect Plugin] Current hash:', window.location.hash)
  console.log('[Auth Hash Redirect Plugin] Current path:', window.location.pathname)

  // ✅ Check if we're on root path with access_token in hash
  const hash = window.location.hash
  const path = window.location.pathname

  if (path === '/' && hash && hash.includes('access_token')) {
    console.log('[Auth Hash Redirect Plugin] ✅ Detected Supabase auth hash on root path')
    console.log('[Auth Hash Redirect Plugin] Hash:', hash)
    console.log('[Auth Hash Redirect Plugin] Redirecting to /auth/verify-email with hash preserved')
    
    // Perform redirect with hash preserved
    window.location.href = `/auth/verify-email${hash}`
  } else {
    console.log('[Auth Hash Redirect Plugin] ℹ️ No auth hash redirect needed')
  }
})
