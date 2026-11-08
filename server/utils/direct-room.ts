import { randomUUID } from 'node:crypto'
import { getServiceClient } from '~/server/utils/supabase-admin'

type Db = ReturnType<typeof getServiceClient>

/** Rooms among `ids` that belong to P2P trades (never the personal chat). */
export async function p2pTradeRoomIds(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set()
  const { data } = await getServiceClient().from('p2p_trades' as never).select('chat_room_id').in('chat_room_id', ids)
  return new Set(((data ?? []) as { chat_room_id: string | null }[]).map(t => t.chat_room_id).filter((id): id is string => !!id))
}

/** Finds the personal 1:1 chat room for two users, creating it if needed. */
export async function ensureDirectRoom(db: Db, a: string, b: string): Promise<string> {
  const [{ data: mine }, { data: theirs }] = await Promise.all([
    db.from('chat_room_members').select('room_id').eq('user_id', a),
    db.from('chat_room_members').select('room_id').eq('user_id', b)
  ])
  const theirRooms = new Set((theirs ?? []).map(r => r.room_id))
  const shared = (mine ?? []).map(r => r.room_id).filter(id => theirRooms.has(id))
  if (shared.length) {
    // P2P trade chats are also 1:1 rooms; they must never be reused as the personal chat.
    const [{ data: rooms }, tradeRooms] = await Promise.all([
      db.from('chat_rooms').select('id').in('id', shared)
        .eq('is_group_chat', false).is('page_id', null).is('page_visitor_id', null)
        .order('created_at', { ascending: true }),
      p2pTradeRoomIds(shared)
    ])
    const personal = (rooms ?? []).find(r => !tradeRooms.has(r.id))
    if (personal) return personal.id
  }
  const { data: other } = await db.from('user').select('display_name, username').eq('user_id', b).maybeSingle()
  const id = randomUUID()
  const { error } = await db.from('chat_rooms').insert({ id, is_group_chat: false, room_name: other?.display_name || other?.username || null, created_by: a })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not open chat' })
  const { error: memberError } = await db.from('chat_room_members').insert([{ room_id: id, user_id: a }, { room_id: id, user_id: b }])
  if (memberError) {
    await db.from('chat_rooms').delete().eq('id', id)
    throw createError({ statusCode: 500, statusMessage: 'Could not open chat' })
  }
  return id
}
