// ============================================================================
// FILE: /server/api/auth/signup.post.ts - SIMPLIFIED (NO SUPABASE AUTH EMAIL)
// ============================================================================
// ✅ Creates user directly in database
// ✅ Bypasses Supabase Auth email verification completely
// ✅ Uses MailerSend for verification emails
// ✅ Generates custom verification tokens
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '~/server/utils/email'
import crypto from 'crypto'

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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('[SIGNUP] ❌ Missing Supabase config')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

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
    // STEP 2: Check email availability
    // ============================================================================
    console.log('[SIGNUP] Checking email:', email)
    const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
      .from('user')
      .select('id')
      .ilike('email', email.trim().toLowerCase())
      .single()

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      console.log('[SIGNUP] ❌ Email check error:', emailCheckError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Email check failed'
      })
    }

    if (existingEmail) {
      console.log('[SIGNUP] ❌ Email already registered')
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already registered'
      })
    }

    console.log('[SIGNUP] ✓ Email available')

    // ============================================================================
    // STEP 3: Generate user ID and verification token
    // ============================================================================
    console.log('[SIGNUP] Generating user ID and verification token...')
    
    const userId = crypto.randomUUID()
    const verificationToken = Buffer.from(
      JSON.stringify({
        userId: userId,
        email: email.trim().toLowerCase(),
        timestamp: Date.now()
      })
    ).toString('base64')

    console.log('[SIGNUP] ✓ User ID:', userId)
    console.log('[SIGNUP] ✓ Verification token generated')

    // ============================================================================
    // STEP 4: Create user profile in database
    // ============================================================================
    console.log('[SIGNUP] Creating user profile in database...')
    
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('user')
      .insert([
        {
          user_id: userId,
          username: username.trim().toLowerCase(),
          username_lower: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          email_lower: email.trim().toLowerCase(),
          display_name: fullName?.trim() || username.trim(),
          is_verified: false,
          verification_status: 'pending',
          verification_token: verificationToken,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.log('[SIGNUP] ❌ Error creating user profile:', insertError.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create user profile: ' + insertError.message
      })
    }

    console.log('[SIGNUP] ✓ User profile created successfully')

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
        id: userId,
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
