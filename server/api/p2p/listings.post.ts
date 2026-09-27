import { serverSupabaseClient } from '#supabase/server'
import { requireSeller } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

interface CreateListingBody {
  assetCode?: string
  marginPct?: number
  minAmount?: number
  maxAmount?: number
  availablePewgift?: number
  paymentMethodId?: string
  altPaymentMethodId?: string
  terms?: string
}

export default defineEventHandler(async (event) => {
  const seller = await requireSeller(event)
  const body = await readBody<CreateListingBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const margin = body.marginPct ?? 0
  if (!body.assetCode) throw createError({ statusCode: 400, statusMessage: 'assetCode is required' })
  if (margin < 0 || margin > seller.maxMarginPct) {
    throw createError({ statusCode: 400, statusMessage: `Margin must be between 0 and ${seller.maxMarginPct}%` })
  }
  if (!body.maxAmount || body.maxAmount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'maxAmount must be positive' })
  }
  if (!body.paymentMethodId) {
    throw createError({ statusCode: 400, statusMessage: 'An approved payment method is required' })
  }

  const { data: method } = await supabase
    .from('seller_payment_methods')
    .select('id, status')
    .eq('id', body.paymentMethodId)
    .eq('seller_id', seller.id)
    .maybeSingle()

  if (!method || method.status !== 'APPROVED') {
    throw createError({ statusCode: 400, statusMessage: 'Payment method is not approved' })
  }

  const { data, error } = await supabase
    .from('p2p_listings')
    .insert({
      seller_id: seller.id,
      asset_code: body.assetCode,
      margin_pct: margin,
      min_amount: body.minAmount ?? 1,
      max_amount: body.maxAmount,
      available_pewgift: body.availablePewgift ?? 0,
      payment_method_id: body.paymentMethodId,
      alt_payment_method_id: body.altPaymentMethodId ?? null,
      terms: body.terms ?? null
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { listing: data }
})
