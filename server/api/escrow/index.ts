import { serverSupabaseClient } from '#supabase/server'
import { getActor, requireRole } from '~/server/utils/rbac'
import { optionalText, requireEnum, requireUuid } from '~/server/utils/input'
import type { Database } from '~/types/database.types'

type TradeRow = Database['public']['Tables']['p2p_trades']['Row']

/**
 * Escrow is the P2P trade lifecycle; this route is the admin/console view over
 * it. Creation happens through /api/p2p/trades, which prices and locks the
 * credits server-side, so this handler only reads and settles.
 */
interface EscrowView {
  id: string
  trade_id: string
  buyer_id: string
  seller_id: string
  amount: number
  token: string
  is_released: boolean
  is_refunded: boolean
  timestamp: string
  updated_at: string
}

function toView(trade: TradeRow): EscrowView {
  return {
    id: trade.id,
    trade_id: trade.id,
    buyer_id: trade.buyer_id,
    seller_id: trade.seller_id,
    amount: Number(trade.amount),
    token: trade.asset_code ?? 'PEW',
    is_released: trade.status === 'released',
    is_refunded: trade.status === 'cancelled',
    timestamp: trade.created_at,
    updated_at: trade.updated_at
  }
}

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') return await listTrades(event)
  if (method === 'PUT') return await settleTrade(event)

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
})

async function listTrades(event: Parameters<typeof getActor>[0]) {
  const actor = await getActor(event)
  const supabase = await serverSupabaseClient<Database>(event)
  const query = getQuery(event)

  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = Math.max(0, Number(query.offset) || 0)

  let builder = supabase
    .from('p2p_trades')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Only staff see the whole book; everyone else sees their own trades.
  if (actor.role !== 'admin' && actor.role !== 'manager') {
    builder = builder.or(`buyer_id.eq.${actor.id},seller_id.eq.${actor.id}`)
  }

  if (typeof query.status === 'string' && query.status) {
    const status = requireEnum(query.status, 'status', [
      'created', 'funded', 'released', 'cancelled', 'disputed'
    ] as const)
    builder = builder.eq('status', status)
  }

  const { data, error, count } = await builder
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { data: { trades: (data ?? []).map(toView), total: count ?? 0 } }
}

async function settleTrade(event: Parameters<typeof getActor>[0]) {
  const actor = await requireRole(event, 'manager')
  const supabase = await serverSupabaseClient<Database>(event)
  const body = await readBody<{ tradeId?: string; action?: string; reason?: string }>(event)

  const tradeId = requireUuid(body.tradeId, 'tradeId')
  const action = requireEnum(body.action, 'action', ['release', 'refund'] as const)
  const reason = optionalText(body.reason, 'reason', 500)

  const { data, error } = action === 'release'
    ? await supabase.rpc('release_p2p_trade', { p_trade_id: tradeId, p_actor_id: actor.id })
    : await supabase.rpc('cancel_p2p_trade', {
        p_trade_id: tradeId,
        p_actor_id: actor.id,
        p_reason: reason ?? 'Settled by staff'
      })

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  return { success: true, data: { tradeId, action, amount: data } }
}
