import { serverSupabaseClient } from '#supabase/server'

interface SignupRequest {
  email: string
  password: string
  username: string
  fullName: string
  phone: string
  bio?: string
  location?: string
  interests?: string[]
}

export default defineEventHandler(async (event) => {
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`[Signup-${requestId}] === SIGNUP DEBUG START ===`)
    console.log(`${'='.repeat(60)}\n`)
    
    const supabase = await serverSupabaseClient(event)
    const body = await readBody<SignupRequest>(event)
    
    console.log(`[Signup-${requestId}] 1. Request body:`, {
      email: body.email,
      username: body.username,
      fullName: body.fullName,
      phone: body.phone
    })
    
    // Normalize
    const trimmedUsername = body.username.trim().toLowerCase()
    const normalizedEmail = body.email.toLowerCase().trim()
    
    console.log(`[Signup-${requestId}] 2. Normalized values:`, {
      username: trimmedUsername,
      email: normalizedEmail
    })
    
    // Step 1: Try to create auth user
    console.log(`[Signup-${requestId}] 3. Attempting to create auth user...`)
    console.log(`[Signup-${requestId}]    Email: ${normalizedEmail}`)
    console.log(`[Signup-${requestId}]    Password length: ${body.password.length}`)
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: body.password,
      options: {
        data: {
          username: trimmedUsername,
          full_name: body.fullName
        }
      }
    })
    
    console.log(`[Signup-${requestId}] 4. Auth signup response:`)
    console.log(`[Signup-${requestId}]    User ID: ${authData?.user?.id}`)
    console.log(`[Signup-${requestId}]    User email: ${authData?.user?.email}`)
    console.log(`[Signup-${requestId}]    Session: ${authData?.session ? 'YES' : 'NO'}`)
    console.log(`[Signup-${requestId}]    Error: ${authError?.message}`)
    console.log(`[Signup-${requestId}]    Error code: ${authError?.code}`)
    console.log(`[Signup-${requestId}]    Error status: ${authError?.status}`)
    
    if (authError) {
      console.error(`[Signup-${requestId}] ❌ Auth signup failed!`)
      console.error(`[Signup-${requestId}]    Full error:`, authError)
      
      throw createError({
        statusCode: 400,
        statusMessage: `Auth error: ${authError.message}`
      })
    }
    
    if (!authData.user) {
      console.error(`[Signup-${requestId}] ❌ No user returned from auth signup`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user account'
      })
    }
    
    console.log(`[Signup-${requestId}] ✅ Auth user created successfully`)
    
    // Step 2: Create profile
    console.log(`[Signup-${requestId}] 5. Creating profile in database...`)
    
    const { error: profileError, data: profileData } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: trimmedUsername,
        email: normalizedEmail,
        full_name: body.fullName,
        phone_number: body.phone,
        bio: body.bio || '',
        avatar_url: null,
        role: 'user',
        status: 'active',
        is_verified: false,
        rank: 'bronze',
        rank_points: 0,
        email_verified: false,
        location: body.location || '',
        interests: body.interests || [],
        preferences: {
          emailNotifications: true,
          profilePrivate: false
        },
        metadata: {}
      })
      .select()
    
    console.log(`[Signup-${requestId}] 6. Profile creation response:`)
    console.log(`[Signup-${requestId}]    Error: ${profileError?.message}`)
    console.log(`[Signup-${requestId}]    Error code: ${profileError?.code}`)
    console.log(`[Signup-${requestId}]    Data: ${profileData ? 'YES' : 'NO'}`)
    
    if (profileError) {
      console.error(`[Signup-${requestId}] ❌ Profile creation failed!`)
      console.error(`[Signup-${requestId}]    Full error:`, profileError)
      
      // Try to delete auth user
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log(`[Signup-${requestId}] ✅ Deleted orphaned auth user`)
      } catch (deleteErr) {
        console.error(`[Signup-${requestId}] ⚠️ Failed to delete orphaned auth user:`, deleteErr)
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: `Profile error: ${profileError.message}`
      })
    }
    
    console.log(`[Signup-${requestId}] ✅ Profile created successfully`)
    
    console.log(`\n[Signup-${requestId}] === SIGNUP DEBUG SUCCESS ===\n`)
    
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: trimmedUsername
      },
      message: 'Account created successfully. Please verify your email.'
    }
    
  } catch (err: any) {
    console.error(`\n[Signup-${requestId}] === SIGNUP DEBUG FAILED ===`)
    console.error(`[Signup-${requestId}] Error:`, err.message)
    console.error(`[Signup-${requestId}] Full error:`, err)
    console.error(`${'='.repeat(60)}\n`)
    
    throw err
  }
})
