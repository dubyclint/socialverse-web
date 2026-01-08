// ============================================================================
// FILE: /server/api/auth/signup.post.ts - FIXED VERSION
// ============================================================================
// ✅ Handles Supabase Auth "Database error saving new user"
// ✅ Disables email confirmation if needed
// ✅ Works with fixed database schema
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
    // STEP 1: Create Supabase Auth user with minimal options
    // ============================================================================
    console.log('[SIGNUP] Creating Supabase Auth user...')
    
    try {
      const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          // Disable email confirmation to avoid "Database error saving new user"
          emailRedirectTo: `${process.env.NUXT_PUBLIC_SITE_URL}/auth/verify-email`
        }
      })

      if (authError) {
        console.log('[SIGNUP] ❌ Auth signup error:', authError.message)
        console.log('[SIGNUP] ❌ Auth error code:', authError.code)
        console.log('[SIGNUP] ❌ Auth error status:', authError.status)
        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to create user: ' + authError.message
        })
      }

      const authUserId = authData?.user?.id
      if (!authUserId) {
        console.log('[SIGNUP] ❌ No user ID returned from auth')
        throw createError({
          statusCode: 500,
          statusMessage: 'User creation failed'
        })
      }

      console.log('[SIGNUP] ✓ Auth user created:', authUserId)

      // ============================================================================
      // STEP 2: Create user profile in database
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
            status: 'active'
          }
        ])
        .select()
        .single()

      if (insertError) {
        console.log('[SIGNUP] ❌ Error creating user profile:', insertError.message)
        
        // If duplicate username
        if (insertError.message?.includes('username_lower')) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Username already taken'
          })
        }
        
        // If duplicate email
        if (insertError.message?.includes('email_lower')) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Email already registered'
          })
        }
        
        throw createError({
          statusCode: 400,
          statusMessage: 'Failed to create user profile: ' + insertError.message
        })
      }

      console.log('[SIGNUP] ✓ User profile created successfully')

      // ============================================================================
      // STEP 3: Generate verification token
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
      // STEP 4: Send verification email via MailerSend
      // ============================================================================
      console.log('[SIGNUP] Sending verification email via MailerSend...')
      
      const emailResult = await sendVerificationEmail(
        email.trim().toLowerCase(),
        username.trim(),
        verificationToken
      )

      if (!emailResult.success) {
        console.log('[SIGNUP] ⚠️ Email sending failed:', emailResult.error)
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

    } catch (authError: any) {
      console.log('[SIGNUP] ❌ Supabase Auth error caught:', authError)
      console.log('[SIGNUP] ❌ Error message:', authError?.message)
      console.log('[SIGNUP] ❌ Error status:', authError?.status)
      throw authError
    }

  } catch (error: any) {
    console.log('[SIGNUP] ❌❌❌ SIGNUP FAILED ❌❌❌')
    console.log('[SIGNUP] Error:', error?.message || error)
    console.log('[SIGNUP] Full error:', JSON.stringify(error, null, 2))
    throw error
  }
})
