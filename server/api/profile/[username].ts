// server/api/profile/[username].ts
export default defineEventHandler(async (event) => {
  try {
    const username = getRouterParam(event, 'username')

    console.log('[API] Fetching profile for username:', username)

    if (!username) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is required'
      })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch user profile by username
    const { data: profile, error } = await supabase
      .from('user')
      .select('*')
      .eq('username', username.toLowerCase())
      .single()

    if (error) {
      console.error('[API] Error fetching profile:', error)
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    if (!profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    console.log('[API] ✅ Profile fetched:', profile.username)

    return {
      success: true,
      data: profile
    }

  } catch (error: any) {
    console.error('[API] Profile error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch profile'
    })
  }
})
