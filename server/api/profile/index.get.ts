// server/api/profile/index.get.ts - NEW ENDPOINT
export default defineEventHandler(async (event) => {
  try {
    // Get user from Supabase auth
    const user = await requireAuth(event)
    
    if (!user?.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Profile API] Fetching profile for user:', user.id)

    // Get Supabase client
    const supabase = useSupabaseClient(event)

    // Fetch profile from database
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Handle "no rows" error - return default profile
    if (error?.code === 'PGRST116') {
      console.log('[Profile API] No profile found, returning default')
      return {
        id: user.id,
        display_name: user.email?.split('@')[0] || 'User',
        avatar_url: null,
        bio: '',
        role: 'user',
        created_at: new Date().toISOString()
      }
    }

    if (error) {
      console.error('[Profile API] Error fetching profile:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch profile'
      })
    }

    return data
  } catch (err: any) {
    console.error('[Profile API] Error:', err)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Internal server error'
    })
  }
})
