import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { loadTradeChatAccess } from '~/server/utils/p2p-trade-chat'
import { sendNotification } from '~/server/utils/send-notification'

const KINDS = /^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm|quicktime)|application\/pdf)$/

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'p2p:trade-chat', { limit: 30, windowMs: 60_000 }, user.id)
  const id = String(getRouterParam(event, 'id') ?? '')
  const { trade, role } = await loadTradeChatAccess(user.id, id)
  if (['released', 'cancelled', 'refunded', 'expired'].includes(trade.status) && role !== 'staff') {
    throw createError({ statusCode: 409, statusMessage: 'This trade is closed; the chat is read-only.' })
  }
  const body = await readBody<{ body?: string, attachments?: { url?: string, type?: string, name?: string }[] }>(event)
  const text = String(body?.body ?? '').trim().slice(0, 2000)
  const supa = (process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  const attachments = (Array.isArray(body?.attachments) ? body!.attachments : []).slice(0, 6).flatMap((a) => {
    const url = String(a?.url ?? ''); const type = String(a?.type ?? '').toLowerCase()
    if (!KINDS.test(type) || !supa || !url.startsWith(`${supa}/storage/v1/object/public/`)) return []
    return [{ url, type, name: String(a?.name ?? '').slice(0, 120) }]
  })
  if (!text && !attachments.length) throw createError({ statusCode: 400, statusMessage: 'Write a message or attach a file' })
  const db = getServiceClient()
  const { data, error } = await db.from('p2p_trade_messages' as never)
    .insert({ trade_id: id, sender_id: user.id, sender_role: role, body: text, attachments } as never).select('id').single()
  if (error) throw createError({ statusCode: 500, statusMessage: (error as { message: string }).message })
  for (const to of [trade.buyer_id, trade.seller_id].filter(x => x !== user.id)) {
    await sendNotification(event, to, 'system', 'New message in your P2P trade chat', user.id, id).catch(() => null)
  }
  return { id: (data as { id: number }).id }
})
