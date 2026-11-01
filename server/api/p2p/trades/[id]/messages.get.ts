import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadTradeChatAccess, tradeChatNames } from '~/server/utils/p2p-trade-chat'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = String(getRouterParam(event, 'id') ?? '')
  const { trade, role } = await loadTradeChatAccess(user.id, id)
  const after = Number(getQuery(event).after ?? 0)
  const db = getServiceClient()
  const { data, error } = await db.from('p2p_trade_messages' as never).select('id, sender_id, sender_role, body, attachments, created_at')
    .eq('trade_id', id).gt('id', Number.isFinite(after) ? after : 0).order('id', { ascending: true }).limit(300)
  if (error) throw createError({ statusCode: 500, statusMessage: (error as { message: string }).message })
  const rows = (data ?? []) as { id: number, sender_id: string, sender_role: string, body: string, attachments: unknown, created_at: string }[]
  const names = await tradeChatNames(trade, rows.map(r => r.sender_id), role)
  return {
    role,
    me: user.id,
    messages: rows.map(r => ({ ...r, mine: r.sender_id === user.id, sender: names.get(r.sender_id) ?? { name: r.sender_role, avatar_url: null, username: null } }))
  }
})
