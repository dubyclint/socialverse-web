 /server/api/auth/logout.post.ts - VERIFY
// User logout endpoint
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)

    console.log('[Logout] Processing logout request')

    // Sign out user from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Logout] Signout error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Logout failed: ${error.message}`
      })
    }

    console.log('[Logout] User logged out successfully')

    return {
      success: true,
      message: 'Logged out successfully'
    }

  } catch (error) {
    console.error('[Logout] Error:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Logout failed: ${(error as any).message || 'Unknown error'}`
    })
  }
})
