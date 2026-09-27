import { createError, defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

/**
 * Soft-deletes every message the user sent, for everyone, so the conversation
 * history stays consistent for the other participants.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const service = getServiceClient()
  const { data, error } = await service
    .from('chat_messages')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_for_everyone: true,
      message_text: null,
      attachment_urls: []
    })
    .eq('sender_id', user.id)
    .is('deleted_at', null)
    .select('id')

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not delete your messages' })

  return { success: true, deleted: data?.length ?? 0 }
})
