// server/api/posts/[id]/gifts.get.ts
// ============================================================================
// GET GIFTS RECEIVED ON A POST
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const postId = getRouterParam(event, 'id')
    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 20, 50)
    const offset = parseInt(query.offset as string) || 0

    const supabase = await serverSupabaseClient(event)

    // Get gifts summary
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_post_gifts_summary', {
        post_id_param: postId
      })

    if (summaryError) throw summaryError

    // Get individual gifts
    const { data: gifts, error: giftsError } = await supabase
      .from('post_gifts')
      .select(`
        *,
        pewgift_types (name, emoji, image_url),
        profiles (username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (giftsError) throw giftsError

    return {
      success: true,
      data: {
        summary: summary || [],
        gifts: gifts || [],
        total: gifts?.length || 0
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch gifts'
    })
  }
})
