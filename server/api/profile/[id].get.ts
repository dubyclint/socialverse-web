// server/api/profile/[id].get.ts - Get Profile by User ID
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = getRouterParam(event, 'id')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    // Fetch privacy settings
    const { data: privacySettings } = await supabase
      .from('profile_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch social links
    const { data: socialLinks } = await supabase
      .from('social_links')
      .select('*')
      .eq('user_id', userId)

    // Fetch verification badges
    const { data: verificationBadges } = await supabase
      .from('verified_badge')
      .select('*')
      .eq('user_id', userId)

    return {
      success: true,
      profile,
      privacy_settings: privacySettings || {},
      social_links: socialLinks || [],
      verification_badges: verificationBadges || []
    }
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch profile'
    })
  }
})
