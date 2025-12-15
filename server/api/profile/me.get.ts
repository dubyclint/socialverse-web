// FILE: /server/api/profile/me.get.ts - COMPLETE FIXED VERSION
// ============================================================================
// Get current user profile with all related data
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface MeResponse {
  success: boolean
  profile?: any
  error?: string
}

export default defineEventHandler(async (event): Promise<MeResponse> => {
  try {
    console.log('[Profile Me API] Fetching current user profile...')

    // ============================================================================
    // STEP 1: Get Supabase client
    // ============================================================================
    const supabase = await serverSupabaseClient(event)

    if (!supabase) {
      console.error('[Profile Me API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    // ============================================================================
    // STEP 2: Get current user from auth context
    // ============================================================================
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Profile Me API] ❌ Not authenticated')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = user.id
    console.log('[Profile Me API] ✅ User ID:', userId)

    // ============================================================================
    // STEP 3: Fetch profile
    // ============================================================================
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('[Profile Me API] ❌ Profile not found')
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    // ============================================================================
    // STEP 4: Fetch ranks
    // ============================================================================
    const { data: ranks } = await supabase
      .from('ranks')
      .select('*')
      .eq('user_id', userId)

    // ============================================================================
    // STEP 5: Fetch wallets
    // ============================================================================
    const { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)

    console.log('[Profile Me API] ✅ Profile fetched successfully')

    return {
      success: true,
      profile: {
        ...profile,
        ranks: ranks || [],
        wallets: wallets || [],
      },
    }
  } catch (error: any) {
    console.error('[Profile Me API] ❌ Error:', error.message || error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
