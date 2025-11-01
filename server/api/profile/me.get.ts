// FILE: /server/api/profile/me.get.ts - UPDATE
// Get current user profile with all related data
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    // STEP 1: VERIFY AUTHENTICATION
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // STEP 2: FETCH PROFILE
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    // STEP 3: FETCH RANKS
    const { data: ranks } = await supabase
      .from('ranks')
      .select('*')
      .eq('user_id', userId)

    // STEP 4: FETCH WALLETS
    const { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)

    // STEP 5: FETCH PRIVACY SETTINGS
    const { data: privacySettings } = await supabase
      .from('profile_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // STEP 6: FETCH USER SETTINGS
    const { data: userSettings } = await supabase
      .from('user_settings_categories')
      .select('*')
      .eq('user_id', userId)
      .single()

    // STEP 7: FETCH WALLET LOCK SETTINGS
    const { data: walletLock } = await supabase
      .from('wallet_lock_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // STEP 8: FETCH INTERESTS
    const { data: userInterests } = await supabase
      .from('user_interests')
      .select('*, interests(*)')
      .eq('user_id', userId)

    // STEP 9: RETURN COMPLETE PROFILE
    return {
      success: true,
      data: {
        profile,
        ranks: ranks || [],
        wallets: wallets || [],
        privacySettings: privacySettings || {},
        userSettings: userSettings || {},
        walletLock: walletLock || {},
        interests: userInterests?.map(ui => ui.interests) || []
      }
    }

  } catch (error) {
    console.error('[GetProfile] Error:', error)
    throw error
  }
})
