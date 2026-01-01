// MISSING ENDPOINT: /server/api/auth/me.get.ts
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface MeResponse {
  success: boolean
  data?: {
    id: string
    email: string
    username?: string
    full_name?: string
    avatar_url?: string
  }
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<MeResponse> => {
  try {
    console.log('[Auth Me API] Fetching current user...')

    // Get Supabase client
    const supabase = await serverSupabaseClient(event)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Auth Me API] ❌ Unauthorized - No session')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = session.user.id
    console.log('[Auth Me API] User ID:', userId)

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.warn('[Auth Me API] ⚠️ Profile fetch error:', profileError.message)
      // Return basic auth user info if profile not found
      return {
        success: true,
        data: {
          id: userId,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || 'user',
          full_name: session.user.user_metadata?.full_name || 'User'
        },
        message: 'Current user fetched'
      }
    }

    console.log('[Auth Me API] ✅ Current user fetched')

    return {
      success: true,
      data: {
        id: profile?.id || userId,
        email: profile?.email || session.user.email || '',
        username: profile?.username || 'user',
        full_name: profile?.full_name || 'User',
        avatar_url: profile?.avatar_url || undefined
      },
      message: 'Current user fetched successfully'
    }

  } catch (err: any) {
    console.error('[Auth Me API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching current user',
      data: { details: err.message }
    })
  }
})
