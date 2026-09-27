import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

/** Browse active listings, or the caller's own when `mine=1`. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { asset, mine } = getQuery(event) as { asset?: string; mine?: string }
  const supabase = await serverSupabaseClient<Database>(event)

  let query = supabase
    .from('p2p_listings')
    .select('id, seller_id, asset_code, margin_pct, min_amount, max_amount, available_pewgift, terms, is_active, payment_method_id, alt_payment_method_id, updated_at')
    .order('margin_pct')

  if (mine === '1') query = query.eq('seller_id', user.id)
  else query = query.eq('is_active', true)

  if (asset) query = query.eq('asset_code', asset)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { listings: data ?? [] }
})
