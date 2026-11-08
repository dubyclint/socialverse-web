import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'
import { resolveActor } from '~/server/utils/actor'
import { pageRoomsById } from '~/server/utils/page-chat'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const actor = await resolveActor(event)
  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client.rpc('chat_unread_counts')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const pageRooms = await pageRoomsById((data ?? []).map(r => r.room_id))
  const inScope = (id: string) => {
    const room = pageRooms.get(id)
    return actor.type === 'PAGE' ? room?.page.id === actor.id : !room || room.visitorId === user.id
  }
  const rooms: Record<string, number> = {}
  let total = 0
  for (const row of data ?? []) {
    if (!inScope(row.room_id)) continue
    const count = Number(row.unread)
    rooms[row.room_id] = count
    total += count
  }
  return { total, chats: Object.keys(rooms).length, rooms }
})
