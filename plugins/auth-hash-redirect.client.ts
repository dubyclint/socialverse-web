// ============================================================================
// CORRECTED FILE 1: /plugins/auth-hash-redirect.client.ts
// ============================================================================
// FIX: Handle both hash format (#access_token=...) and query format (?code=...)
// ============================================================================

export default defineNuxtPlugin(() => {
  // Only run on client side
  if (!process.client) return

  console.log('[Auth Hash Redirect Plugin] Initializing...')
  console.log('[Auth Hash Redirect Plugin] Current URL:', window.location.href)
  console.log('[Auth Hash Redirect Plugin] Current hash:', window.location.hash)
  console.log('[Auth Hash Redirect Plugin] Current search:', window.location.search)
  console.log('[Auth Hash Redirect Plugin] Current path:', window.location.pathname)

  const hash = window.location.hash
  const search = window.location.search
  const path = window.location.pathname

  // ✅ FORMAT 1: Hash-based redirect (#access_token=...)
  if (path === '/' && hash && hash.includes('access_token')) {
    console.log('[Auth Hash Redirect Plugin] ✅ Detected Supabase auth hash on root path')
    console.log('[Auth Hash Redirect Plugin] Hash:', hash)
    console.log('[Auth Hash Redirect Plugin] Redirecting to /auth/verify-email with hash preserved')
    
    window.location.href = `/auth/verify-email${hash}`
    return
  }

  // ✅ FORMAT 2: Query parameter redirect (?code=...)
  if (path === '/' && search && search.includes('code=')) {
    console.log('[Auth Hash Redirect Plugin] ✅ Detected Supabase auth code in query params')
    console.log('[Auth Hash Redirect Plugin] Search:', search)
    console.log('[Auth Hash Redirect Plugin] Redirecting to /auth/verify-email with query preserved')
    
    window.location.href = `/auth/verify-email${search}`
    return
  }

  // ✅ FORMAT 3: Already on verify-email page with hash
  if (path === '/auth/verify-email' && hash && hash.includes('access_token')) {
    console.log('[Auth Hash Redirect Plugin] ✅ Already on verify-email page with hash')
    return
  }

  // ✅ FORMAT 4: Already on verify-email page with query
  if (path === '/auth/verify-email' && search && search.includes('code=')) {
    console.log('[Auth Hash Redirect Plugin] ✅ Already on verify-email page with query')
    return
  }

  console.log('[Auth Hash Redirect Plugin] ℹ️ No auth redirect needed')
})
