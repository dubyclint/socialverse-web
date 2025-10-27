// server/api/posts/drafts/save.post.ts
// ============================================================================
// SAVE DRAFT ENDPOINT
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface SaveDraftRequest {
  id?: string
  content: string
  privacy: string
  tags: string[]
  mentions: string[]
  mediaUrls: string[]
  scheduledAt?: string
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody<SaveDraftRequest>(event)

    const supabase = await serverSupabaseClient(event)

    if (body.id) {
      // Update existing draft
      const { error } = await supabase
        .from('post_drafts')
        .update({
          content: body.content,
          privacy: body.privacy,
          tags: body.tags,
          mentions: body.mentions,
          media_urls: body.mediaUrls,
          scheduled_at: body.scheduledAt,
          last_saved_at: new Date().toISOString()
        })
        .eq('id', body.id)
        .eq('user_id', user.id)

      if (error) throw error

      return {
        success: true,
        data: { id: body.id, message: 'Draft updated' }
      }
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from('post_drafts')
        .insert({
          user_id: user.id,
          content: body.content,
          privacy: body.privacy,
          tags: body.tags,
          mentions: body.mentions,
          media_urls: body.mediaUrls,
          scheduled_at: body.scheduledAt
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: { id: data.id, message: 'Draft created' }
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to save draft'
    })
  }
})
  
