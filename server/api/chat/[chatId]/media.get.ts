import { createError, defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

/** Media, links and documents shared in a room, newest first. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const chatId = getRouterParam(event, 'chatId')
  if (!chatId) throw createError({ statusCode: 400, statusMessage: 'Missing chat id' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: membership } = await client
    .from('chat_room_members')
    .select('id')
    .eq('room_id', chatId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Not a member of this chat' })

  const { data, error } = await client
    .from('chat_messages')
    .select('id, sender_id, attachment_urls, message_type, created_at')
    .eq('room_id', chatId)
    .is('deleted_at', null)
    .not('attachment_urls', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const items = (data || [])
    .flatMap(row =>
      (row.attachment_urls ?? []).map(url => ({
        messageId: row.id,
        senderId: row.sender_id,
        url,
        messageType: row.message_type || 'file',
        createdAt: row.created_at
      }))
    )

  return { success: true, data: items }
})
