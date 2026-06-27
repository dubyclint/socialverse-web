// server/api/posts/drafts/[id].delete.ts
// ============================================================================
// DELETE DRAFT
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const draftId = getRouterParam(event, 'id')

    const supabase = await serverSupabaseClient(event)

    const { error } = await supabase
      .from('post_drafts')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id)

    if (error) throw error

    return {
      success: true,
      message: 'Draft deleted'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete draft'
    })
  }
})
