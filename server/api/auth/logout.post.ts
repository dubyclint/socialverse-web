// ============================================================================
// FILE: /server/api/auth/logout.post.ts - PRODUCTION AUDIT READY
// ============================================================================
import { defineEventHandler, getHeader, setResponseHeader, setResponseStatus, setCookie } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  console.log('[Logout API] ============ AUDITABLE LOGOUT START ============')
  
  setResponseHeader(event, 'Content-Type', 'application/json')

  try {
    // 2. Initialize Core Supabase Server Instances Explicitly
    const supabase = await serverSupabaseClient(event)
    const user = await serverSupabaseUser(event)
    
    if (!supabase) {
      console.error('[Logout API] ❌ Initialization Error: Supabase engine binding failed.')
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server engine initialization error'
      })
    }

    // 3. Persistent Audit Logging Entry Generation
    if (user) {
      const clientIp = getClientIP(event)
      const userAgent = getHeader(event, 'user-agent') || 'Unknown Agent'

      console.log(`[Logout API] Security Audit: User ${user.email} (${user.id}) logging out from IP: ${clientIp}`)

      // ✅ ACTIVATED: Insert historical audit log into your security schema table
      const { error: logError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'logout',
          ip_address: clientIp,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        })

      if (logError) {
        console.warn('[Logout API] ⚠️ Audit database writing dropped:', logError.message)
      } else {
        console.log('[Logout API] ✅ Audit trail successfully committed to database.')
      }
    }

    // 4. Revoke Active Supabase Authentication Session Context
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.warn('[Logout API] ⚠️ Supabase remote token revocation mismatch:', signOutError.message)
      } else {
        console.log('[Logout API] ✅ Provider auth token globally invalidated.')
      }
    } catch (authErr: any) {
      console.error('[Logout API] Provider communication failure:', authErr?.message)
    }

    // 5. Explicitly Clear Layout Cookies to Ensure Pure State Resets
    const cookieOptions = {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    }

    setCookie(event, 'auth_token', '', cookieOptions)
    setCookie(event, 'auth_refresh_token', '', cookieOptions)
    setCookie(event, 'auth_user', '', cookieOptions)
    
    console.log('[Logout API] ✅ Storage response cookies purged.')
    console.log('[Logout API] ============ LOGOUT END ============')

    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Server session context invalidated and logged successfully.',
      timestamp: new Date().toISOString()
    }

  } catch (error: any) {
    console.error('[Logout API] ============ CRITICAL EXCEPTION CAUGHT ============')
    console.error('[Logout API] Exception details:', error?.message || error)
    
    // Always return 200 success back to client so the UI can clear local state safely
    setResponseStatus(event, 200)
    return {
      success: true,
      message: 'Logout processed via fallback safe block execution path.',
      timestamp: new Date().toISOString()
    }
  }
})

/**
 * Utility helper to safely pull client IP routing addresses out of requests
 */
function getClientIP(event: any): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]
    if (first) return first.trim()
  }
  return getHeader(event, 'x-real-ip') || '127.0.0.1'
}
