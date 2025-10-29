// Sync Supabase profile with Gun.js after successful signup
// This ensures Gun.js has the same user data as Supabase

import { serverSupabaseClient } from '#supabase/server'

interface SyncProfileRequest {
  userId: string
  username: string
  email: string
  fullName: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SyncProfileRequest>(event)
    
    console.log('[SyncProfile] Syncing profile to Gun.js:', {
      userId: body.userId,
      username: body.username,
      email: body.email
    })
    
    // Validate required fields
    if (!body.userId || !body.username || !body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'userId, username, and email are required'
      })
    }
    
    // Get the full profile from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', body.userId)
      .single()
    
    if (profileError || !profile) {
      console.error('[SyncProfile] Profile not found:', profileError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }
    
    console.log('[SyncProfile] ✅ Profile synced successfully')
    
    return {
      success: true,
      message: 'Profile synced to Gun.js',
      profile: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        fullName: profile.full_name,
        avatar: profile.avatar_url,
        bio: profile.bio,
        rank: profile.rank
      }
    }
    
  } catch (err) {
    console.error('[SyncProfile] Unexpected error:', err)
    throw err
  }
})
