// /server/api/auth/login.post.ts - NEW IMPLEMENTATION
import { serverSupabaseClient } from '#supabase/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

interface LoginRequest {
  email: string
  password: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<LoginRequest>(event)

    // Validate required fields
    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Get user by email (case-insensitive)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', body.email)
      .single()

    if (userError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Please verify your email before logging in'
      })
    }

    // Check if account is active
    if (!user.is_active) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Your account has been deactivated'
      })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(body.password, user.password_hash)
    if (!passwordMatch) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid email or password'
      })
    }

    // Get user role and permissions
    const { data: role } = await supabase
      .from('roles')
      .select('*')
      .eq('id', user.role_id)
      .single()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get user interests
    const { data: userInterests } = await supabase
      .from('user_interests')
      .select('interest_id, interests(name, category)')
      .eq('user_id', user.id)

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role_id,
        permissions: role?.permissions || []
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date() })
      .eq('id', user.id)

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role_id,
        permissions: role?.permissions || []
      },
      profile: {
        username: profile?.username,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        avatar: profile?.avatar_url,
        bio: profile?.bio,
        rank: profile?.rank,
        rankPoints: profile?.rank_points,
        profileCompleted: profile?.profile_completed
      },
      interests: userInterests?.map(ui => ui.interests?.name) || []
    }
  } catch (error) {
    console.error('[Login] Error:', error)
    throw error
  }
})
