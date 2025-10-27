// server/api/posts/drafts/index.get.ts
// ============================================================================
// GET USER DRAFTS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const supabase = await serverSupabaseClient(event)

    const { data, error } = await supabase
      .from('post_drafts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch drafts'
    })
  }
})
