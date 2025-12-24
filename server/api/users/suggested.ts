// server/api/users/suggested.ts
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 5

    console.log('[API] Fetching suggested users - limit:', limit)

    // Get authenticated user
    const user = await requireAuth(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch suggested users (not following, not self)
    const { data: suggestedUsers, error } = await supabase
      .from('user')
      .select('*')
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[API] Error fetching suggested users:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch suggested users'
      })
    }

    console.log('[API] ✅ Suggested users fetched:', suggestedUsers?.length)

    return {
      success: true,
      data: suggestedUsers || []
    }

  } catch (error: any) {
    console.error('[API] Suggested users error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch suggested users'
    })
  }
})
