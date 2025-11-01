
 /server/api/auth/login.post.ts - UPDATE
// User login with authentication
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcrypt'
import { generateJWT } from '~/server/utils/token'

interface LoginRequest {
  email: string
  password: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<LoginRequest>(event)

    // STEP 1: VALIDATE INPUT
    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // STEP 2: QUERY PROFILE BY EMAIL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', body.email)
      .single()

    if (profileError || !profile) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // STEP 3: VERIFY PASSWORD HASH
    const passwordMatch = await bcrypt.compare(body.password, profile.password_hash)
    if (!passwordMatch) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // STEP 4: CHECK EMAIL VERIFICATION
    if (!profile.email_verified) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Please verify your email first'
      })
    }

    // STEP 5: CHECK ACCOUNT STATUS
    if (profile.status !== 'active') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Account is disabled'
      })
    }

    // STEP 6: GENERATE JWT TOKEN
    const token = generateJWT({
      userId: profile.id,
      email: profile.email,
      username: profile.username,
      role: profile.role
    })

    // STEP 7: UPDATE LAST LOGIN
    await supabase
      .from('profiles')
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    // STEP 8: FETCH COMPLETE USER DATA
    const { data: ranks } = await supabase
      .from('ranks')
      .select('*')
      .eq('user_id', profile.id)

    const { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', profile.id)

    const { data: privacySettings } = await supabase
      .from('profile_privacy_settings')
      .select('*')
      .eq('user_id', profile.id)
      .single()

    const { data: userSettings } = await supabase
      .from('user_settings_categories')
      .select('*')
      .eq('user_id', profile.id)
      .single()

    const { data: walletLock } = await supabase
      .from('wallet_lock_settings')
      .select('*')
      .eq('user_id', profile.id)
      .single()

    const { data: userInterests } = await supabase
      .from('user_interests')
      .select('*, interests(*)')
      .eq('user_id', profile.id)

    // STEP 9: RETURN SUCCESS
    return {
      success: true,
      token,
      user: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        role: profile.role,
        profile: {
          full_name: profile.full_name,
          phone: profile.phone,
          bio: profile.bio,
          location: profile.location,
          avatar_url: profile.avatar_url,
          website: profile.website,
          email_verified: profile.email_verified,
          profile_completed: profile.profile_completed,
          status: profile.status,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          last_login: profile.last_login
        },
        ranks: ranks || [],
        wallets: wallets || [],
        privacySettings: privacySettings || {},
        userSettings: userSettings || {},
        walletLock: walletLock || {},
        interests: userInterests?.map(ui => ui.interests) || []
      }
    }

  } catch (error) {
    console.error('[Login] Error:', error)
    throw error
  }
})
