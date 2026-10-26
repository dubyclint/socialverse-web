import { requireSeller } from '~/server/utils/rbac'
import { getServiceClient } from '~/server/utils/supabase-admin'

const MAX = 30

interface ConfigBody {
  id?: string
  side?: 'sell' | 'buy'
  assetCode?: string
  marginPct?: number
  minAmount?: number
  maxAmount?: number
  availablePew?: number
  terms?: string
  isActive?: boolean
  method?: { kind?: 'BANK' | 'CRYPTO' | 'CUSTOM', accountName?: string, accountRef?: string, bankName?: string, network?: string, instructions?: string }
  remove?: boolean
}

/**
 * Create, update or remove one seller configuration: a currency + payment method + margin + limits.
 * Sellers are admin-vetted, so their methods are approved on save; admins can still reject them.
 */
export default defineEventHandler(async (event) => {
  const seller = await requireSeller(event)
  const body = await readBody<ConfigBody>(event)
  const db = getServiceClient()

  if (body.id && body.remove) {
    const { data: open } = await db.from('p2p_trades').select('id').eq('listing_id', body.id).in('status', ['funded', 'disputed']).limit(1)
    if (open?.length) throw createError({ statusCode: 400, statusMessage: 'This offer has an open trade; pause it instead' })
    await db.from('p2p_listings').update({ is_active: false, available_pewgift: 0 }).eq('id', body.id).eq('seller_id', seller.id)
    await db.from('p2p_listings').delete().eq('id', body.id).eq('seller_id', seller.id)
    return { removed: true }
  }

  const side = body.side === 'buy' ? 'buy' : 'sell'
  const asset = String(body.assetCode ?? '').toUpperCase()
  const margin = Number(body.marginPct ?? 0)
  const min = Math.max(side === 'sell' ? 5 : 1, Number(body.minAmount ?? 5))
  const max = Number(body.maxAmount ?? 0)
  const available = Number(body.availablePew ?? max)
  if (!asset) throw createError({ statusCode: 400, statusMessage: 'Choose a currency' })
  if (!(margin >= 0 && margin <= seller.maxMarginPct)) throw createError({ statusCode: 400, statusMessage: `Margin must be between 0 and ${seller.maxMarginPct}%` })
  if (!(max >= min)) throw createError({ statusCode: 400, statusMessage: 'Maximum must be at least the minimum' })
  if (!(available >= 0)) throw createError({ statusCode: 400, statusMessage: 'Available amount must be 0 or more' })
  const { data: a } = await db.from('supported_assets').select('code').eq('code', asset).eq('is_enabled', true).maybeSingle()
  if (!a) throw createError({ statusCode: 400, statusMessage: 'Currency is not available' })

  const m = body.method ?? {}
  const kind = m.kind ?? 'BANK'
  if (kind === 'CUSTOM' ? !m.instructions : !(m.accountName && m.accountRef)) {
    throw createError({ statusCode: 400, statusMessage: side === 'sell' ? 'Enter the account name and number buyers pay into' : 'Enter how you pay sellers out (bank or method name)' })
  }
  const methodRow = {
    seller_id: seller.id, kind, asset_code: asset,
    account_name: m.accountName?.trim().slice(0, 120) || null, account_ref: m.accountRef?.trim().slice(0, 120) || null,
    bank_name: m.bankName?.trim().slice(0, 120) || null, network: m.network?.trim().slice(0, 60) || null,
    instructions: m.instructions?.trim().slice(0, 400) || null,
    status: 'APPROVED' as const, reviewed_at: new Date().toISOString()
  }
  const listingRow = {
    side, asset_code: asset, margin_pct: margin, min_amount: min, max_amount: max, available_pewgift: available,
    terms: body.terms?.trim().slice(0, 1000) || null, is_active: body.isActive ?? true, updated_at: new Date().toISOString()
  }

  if (body.id) {
    const { data: existing } = await db.from('p2p_listings').select('id, payment_method_id').eq('id', body.id).eq('seller_id', seller.id).maybeSingle()
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Configuration not found' })
    if (existing.payment_method_id) await db.from('seller_payment_methods').update(methodRow).eq('id', existing.payment_method_id)
    const { data, error } = await db.from('p2p_listings').update(listingRow as never).eq('id', body.id).select().single()
    if (error) throw createError({ statusCode: 400, statusMessage: error.message })
    return { config: data }
  }

  const { count } = await db.from('p2p_listings').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id)
  if ((count ?? 0) >= MAX) throw createError({ statusCode: 400, statusMessage: `You can have at most ${MAX} currency/payment configurations` })
  const { data: method, error: mErr } = await db.from('seller_payment_methods').insert(methodRow).select('id').single()
  if (mErr) throw createError({ statusCode: 400, statusMessage: mErr.message })
  const { data, error } = await db.from('p2p_listings').insert({ ...listingRow, seller_id: seller.id, payment_method_id: method.id } as never).select().single()
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { config: data }
})
