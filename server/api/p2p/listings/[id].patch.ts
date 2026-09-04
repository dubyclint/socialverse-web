import { serverSupabaseClient } from '#supabase/server'
import { requireSeller } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

interface UpdateListingBody {
  marginPct?: number
  minAmount?: number
  maxAmount?: number
  availablePewgift?: number
  paymentMethodId?: string
  altPaymentMethodId?: string | null
  terms?: string
  isActive?: boolean
}

const SENSITIVE: (keyof UpdateListingBody)[] = [
  'marginPct', 'minAmount', 'maxAmount', 'paymentMethodId', 'altPaymentMethodId'
]

export default defineEventHandler(async (event) => {
  const seller = await requireSeller(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateListingBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  if (!id) throw createError({ statusCode: 400, statusMessage: 'Listing id is required' })

  // The database trigger neutralises frozen edits and raises a security alert;
  // checking here lets the seller see why instead of a silent no-op.
  if (SENSITIVE.some((field) => body[field] !== undefined)) {
    const { data: frozen } = await supabase.rpc('seller_is_frozen', { p_seller_id: seller.id })
    if (frozen) {
      throw createError({
        statusCode: 423,
        statusMessage: 'Pricing and payout details are frozen during an active trade'
      })
    }
    if (body.marginPct !== undefined && (body.marginPct < 0 || body.marginPct > seller.maxMarginPct)) {
      throw createError({ statusCode: 400, statusMessage: `Margin must be between 0 and ${seller.maxMarginPct}%` })
    }
  }

  const patch: Database['public']['Tables']['p2p_listings']['Update'] = { updated_at: new Date().toISOString() }
  if (body.marginPct !== undefined) patch.margin_pct = body.marginPct
  if (body.minAmount !== undefined) patch.min_amount = body.minAmount
  if (body.maxAmount !== undefined) patch.max_amount = body.maxAmount
  if (body.availablePewgift !== undefined) patch.available_pewgift = body.availablePewgift
  if (body.paymentMethodId !== undefined) patch.payment_method_id = body.paymentMethodId
  if (body.altPaymentMethodId !== undefined) patch.alt_payment_method_id = body.altPaymentMethodId
  if (body.terms !== undefined) patch.terms = body.terms
  if (body.isActive !== undefined) patch.is_active = body.isActive

  const { data, error } = await supabase
    .from('p2p_listings')
    .update(patch)
    .eq('id', id)
    .eq('seller_id', seller.id)
    .select()
    .maybeSingle()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Listing not found' })
  return { listing: data }
})
