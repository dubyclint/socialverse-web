import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { getServiceClient } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const streamId = event.context.params?.id
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0

  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream ID is required' })

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: messages, error } = await supabase
    .from('stream_chats')
    .select('id, stream_id, user_id, message_text, is_pinned, created_at')
    .eq('stream_id', streamId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const ids = [...new Set((messages ?? []).map(m => m.user_id))]
  const { data: people } = ids.length
    ? await getServiceClient().from('user').select('user_id, username, display_name, avatar_url, is_verified, verified_type').in('user_id', ids)
    : { data: [] }
  const byId = new Map((people ?? []).map(p => [p.user_id, p]))

  return {
    success: true,
    data: (messages || []).map(m => {
      const person = byId.get(m.user_id)
      return {
        ...m,
        user: person
          ? { name: person.display_name || person.username, username: person.username, avatar_url: person.avatar_url, is_verified: person.is_verified, verified_type: person.verified_type }
          : null
      }
    }),
    count: messages?.length || 0
  }
})
