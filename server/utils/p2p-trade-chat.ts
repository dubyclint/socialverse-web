import { getServiceClient } from '~/server/utils/supabase-admin'
import { getStaffAccess } from '~/server/utils/staff-access'

export type TradeChatRole = 'buyer' | 'seller' | 'staff'
export interface TradeChatTrade { id: string, buyer_id: string, seller_id: string, status: string }

/** Buyer and seller always; support only on a dispute; admins/dispute deciders/P2P admins any time. */
export const loadTradeChatAccess = async (userId: string, tradeId: string): Promise<{ trade: TradeChatTrade, role: TradeChatRole }> => {
  const db = getServiceClient()
  const { data } = await db.from('p2p_trades').select('id, buyer_id, seller_id, status').eq('id', tradeId).maybeSingle()
  const trade = data as TradeChatTrade | null
  if (!trade) throw createError({ statusCode: 404, statusMessage: 'Trade not found' })
  if (trade.buyer_id === userId) return { trade, role: 'buyer' }
  if (trade.seller_id === userId) return { trade, role: 'seller' }
  const a = await getStaffAccess(userId)
  if (a.isAdmin || a.canDecideDisputes || a.canManageP2p || ((a.isSupport || a.isSupportManager) && trade.status === 'disputed')) return { trade, role: 'staff' }
  throw createError({ statusCode: 403, statusMessage: 'Not a party to this trade' })
}

/** Names shown in trade chat: seller = seller display name (username only if admin allows), staff = display name or "Support @username". */
export const tradeChatNames = async (trade: TradeChatTrade, senderIds: string[], viewerRole: TradeChatRole) => {
  const db = getServiceClient()
  const ids = [...new Set([...senderIds, trade.buyer_id, trade.seller_id])]
  const [{ data: users }, { data: seller }] = await Promise.all([
    db.from('user').select('user_id, username, display_name, avatar_url').in('user_id', ids),
    db.from('seller_profiles').select('display_name, show_username').eq('user_id', trade.seller_id).maybeSingle()
  ])
  const s = seller as { display_name?: string | null, show_username?: boolean } | null
  const out = new Map<string, { name: string, avatar_url: string | null, username: string | null }>()
  for (const u of (users ?? []) as { user_id: string, username: string | null, display_name: string | null, avatar_url: string | null }[]) {
    if (u.user_id === trade.seller_id) {
      const showUser = Boolean(s?.show_username) || viewerRole === 'staff'
      out.set(u.user_id, { name: s?.display_name || u.display_name || 'Seller', avatar_url: null, username: showUser ? u.username : null })
    } else if (u.user_id === trade.buyer_id) {
      out.set(u.user_id, { name: u.display_name || u.username || 'Buyer', avatar_url: u.avatar_url, username: u.username })
    } else {
      out.set(u.user_id, { name: u.display_name || `Support @${u.username ?? 'agent'}`, avatar_url: null, username: null })
    }
  }
  return out
}
