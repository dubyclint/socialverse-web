import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.rpc('chat_unread_counts')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const rooms: Record<string, number> = {}
  let total = 0
  for (const row of data ?? []) {
    const count = Number(row.unread)
    rooms[row.room_id] = count
    total += count
  }
  return { total, chats: Object.keys(rooms).length, rooms }
})
