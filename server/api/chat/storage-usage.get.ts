import { createError, defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

interface UsageRow {
  message_text: string | null
  attachment_urls: string[] | null
  message_type: string | null
}

/**
 * Real usage figures for the storage screen: message text bytes and attachment
 * counts for every room the user belongs to.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const service = getServiceClient()
  const { data: memberships, error: memberError } = await service
    .from('chat_room_members')
    .select('room_id')
    .eq('user_id', user.id)

  if (memberError) throw createError({ statusCode: 500, statusMessage: 'Could not read chat storage' })

  const roomIds = (memberships ?? []).map(row => row.room_id)
  if (!roomIds.length) {
    return { success: true, messages: 0, messageCount: 0, mediaCount: 0, statusCount: 0 }
  }

  const { data, error } = await service
    .from('chat_messages')
    .select('message_text, attachment_urls, message_type')
    .in('room_id', roomIds)
    .is('deleted_at', null)

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not read chat storage' })

  const rows = (data ?? []) as UsageRow[]
  let textBytes = 0
  let mediaCount = 0

  for (const row of rows) {
    textBytes += row.message_text ? Buffer.byteLength(row.message_text, 'utf8') : 0
    mediaCount += row.attachment_urls?.length ?? 0
  }

  const { count: statusCount } = await service
    .from('user_statuses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return {
    success: true,
    messages: textBytes,
    messageCount: rows.length,
    mediaCount,
    statusCount: statusCount ?? 0
  }
})
