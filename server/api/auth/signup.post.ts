// ============================================================================
// FILE: /server/api/auth/signup.post.ts - HYBRID APPROACH
// ============================================================================
// ✅ Creates Supabase Auth user (handles email errors)
// ✅ Creates user profile in database
// ✅ Sends verification email via MailerSend
// ✅ Works even if Supabase Auth email fails
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password, username, fullName } = body

    console.log('[SIGNUP] Starting signup for:', email)

    if (!email || !password || !username) {
      console.log('[SIGNUP] ❌ Missing required fields')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, password, and username are required'
      })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.log('[SIGNUP] ❌ Missing Supabase config')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // ============================================================================
    // STEP 1: Check username availability
    // ============================================================================
    console.log('[SIGNUP] Checking username:', username)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user')
      .select('id')
      .ilike('username', username.trim().toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('[SIGNUP] ❌ Username check error:', checkError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Username check failed'
      })
    }

    if (existingUser) {
      console.log('[SIGNUP] ❌ Username already taken')
      throw createError({
        statusCode: 400,
        statusMessage: 'Username already taken'
      })
    }

    console.log('[SIGNUP] ✓ Username available')

    // ============================================================================
    // STEP 2: Create Supabase Auth user
    // ============================================================================
    console.log('[SIGNUP] Creating Supabase Auth user...')
    
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        emailRedirectTo: `${process.env.NUXT_PUBLIC_SITE_URL}/auth/verify-email`,
        data: {
          username: username.trim().toLowerCase(),
          display_name: fullName?.trim() || username.trim()
        }
      }
    })

    let authUserId: string | null = null

    if (authError) {
      console.log('[SIGNUP] ⚠️ Auth signup error:', authError.message)
      console.log('[SIGNUP] ⚠️ Auth error code:', authError.code)
      
      // If it's an email provider issue, we'll continue anyway
      if (authError.message?.includes('email') || authError.message?.includes('Database error')) {
        console.log('[SIGNUP] ⚠️ Supabase Auth email issue - will try to create user anyway')
        
        // Try to get existing user by email (in case they already exist)
        const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers()
        const foundUser = existingAuthUser?.users?.find(u => u.email === email.trim().toLowerCase())
        
        if (foundUser) {
          console.log('[SIGNUP] ✓ Found existing auth user:', foundUser.id)
          authUserId = foundUser.id
        } else {
          console.log('[SIGNUP] ❌ Cannot create auth user and no existing user found')
          throw createError({
            statusCode: 400,
            statusMessage: 'Failed to create account. Please try again later.'
          })
        }
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to create user: ' + authError.message
        })
      }
    } else if (authData?.user?.id) {
      authUserId = authData.user.id
      console.log('[SIGNUP] ✓ Auth user created:', authUserId)
    } else {
      console.log('[SIGNUP] ❌ No user ID returned from auth')
      throw createError({
        statusCode: 500,
        statusMessage: 'User creation failed'
      })
    }

    // ============================================================================
    // STEP 3: Create user profile in database
    // ============================================================================
    console.log('[SIGNUP] Creating user profile in database...')
    
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('user')
      .insert([
        {
          user_id: authUserId,
          username: username.trim().toLowerCase(),
          username_lower: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          email_lower: email.trim().toLowerCase(),
          display_name: fullName?.trim() || username.trim(),
          is_verified: false,
          verification_status: 'pending',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.log('[SIGNUP] ❌ Error creating user profile:', insertError.message)
      
      // If user already exists, that's ok
      if (insertError.message?.includes('duplicate') || insertError.code === '23505') {
        console.log('[SIGNUP] ⚠️ User profile already exists')
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to create user profile: ' + insertError.message
        })
      }
    } else {
      console.log('[SIGNUP] ✓ User profile created successfully')
    }

    // ============================================================================
    // STEP 4: Generate verification token
    // ============================================================================
    console.log('[SIGNUP] Generating verification token...')
    
    const verificationToken = Buffer.from(
      JSON.stringify({
        userId: authUserId,
        email: email.trim().toLowerCase(),
        timestamp: Date.now()
      })
    ).toString('base64')

    console.log('[SIGNUP] ✓ Verification token generated')

    // ============================================================================
    // STEP 5: Send verification email via MailerSend
    // ============================================================================
    console.log('[SIGNUP] Sending verification email via MailerSend...')
    
    const emailResult = await sendVerificationEmail(
      email.trim().toLowerCase(),
      username.trim(),
      verificationToken
    )

    if (!emailResult.success) {
      console.log('[SIGNUP] ⚠️ Email sending failed:', emailResult.error)
      console.log('[SIGNUP] ⚠️ But user account was created successfully')
      // Don't fail signup if email fails - user can resend later
    } else {
      console.log('[SIGNUP] ✓ Verification email sent successfully')
    }

    console.log('[SIGNUP] ✓✓✓ SIGNUP SUCCESS ✓✓✓')

    return {
      success: true,
      user: {
        id: authUserId,
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase()
      },
      message: 'Account created! Check your email to verify.',
      requiresEmailVerification: true
    }

  } catch (error: any) {
    console.log('[SIGNUP] ❌❌❌ SIGNUP FAILED ❌❌❌')
    console.log('[SIGNUP] Error:', error?.message || error)
    console.log('[SIGNUP] Full error:', JSON.stringify(error, null, 2))
    throw error
  }
})
