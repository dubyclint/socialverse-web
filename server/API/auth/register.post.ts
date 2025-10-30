// /server/api/auth/register.post.ts
// ✅ SIMPLIFIED SIGNUP ENDPOINT - Direct approach without complex middleware

export default defineEventHandler(async (event) => {
  try {
    console.log('[Register API] Request received')
    
    const supabase = await serverSupabaseClient(event)
    const body = await readBody(event)
    
    console.log('[Register API] Body:', {
      email: body.email,
      username: body.username,
      fullName: body.fullName,
      phone: body.phone
    })
    
    // Validate
    if (!body.email || !body.password || !body.username || !body.fullName || !body.phone) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: email, password, username, fullName, phone'
      })
    }
    
    // Normalize
    const email = body.email.toLowerCase().trim()
    const username = body.username.toLowerCase().trim()
    
    // Create auth user
    console.log('[Register API] Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: body.password,
      options: {
        data: {
          username,
          full_name: body.fullName
        }
      }
    })
    
    if (authError) {
      console.error('[Register API] Auth error:', authError)
      throw createError({
        statusCode: 400,
        statusMessage: authError.message
      })
    }
    
    if (!authData.user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user'
      })
    }
    
    console.log('[Register API] Auth user created:', authData.user.id)
    
    // Create profile
    console.log('[Register API] Creating profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        username,
        full_name: body.fullName,
        phone_number: body.phone,
        bio: body.bio || '',
        location: body.location || '',
        role: 'user',
        status: 'active',
        email_verified: false,
        preferences: {},
        metadata: {}
      })
    
    if (profileError) {
      console.error('[Register API] Profile error:', profileError)
      throw createError({
        statusCode: 500,
        statusMessage: profileError.message
      })
    }
    
    console.log('[Register API] Profile created successfully')
    
    return {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username
      },
      message: 'Account created successfully'
    }
    
  } catch (err: any) {
    console.error('[Register API] Error:', err)
    
    if (err.statusCode) {
      throw err
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Registration failed'
    })
  }
})
