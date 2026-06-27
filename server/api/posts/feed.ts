// server/api/posts/feed.ts
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10

    console.log('[API] Fetching feed posts - page:', page, 'limit:', limit)

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

    const offset = (page - 1) * limit

    // Fetch posts from public.posts table
    const { data: posts, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('privacy', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[API] Error fetching posts:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch posts'
      })
    }

    console.log('[API] ✅ Posts fetched:', posts?.length)

    return {
      success: true,
      data: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }

  } catch (error: any) {
    console.error('[API] Feed error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch feed'
    })
  }
})
