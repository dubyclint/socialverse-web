import { serverSupabaseClient } from '#supabase/server'
import { requireSeller } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

interface MethodBody {
  kind?: Database['public']['Enums']['seller_method_kind']
  assetCode?: string
  accountName?: string
  accountRef?: string
  bankName?: string
  network?: string
  instructions?: string
}

/**
 * Payout methods always land in PENDING: bank/crypto details must be verified
 * against the seller's KYC identity and custom instructions reviewed by an admin.
 */
export default defineEventHandler(async (event) => {
  const seller = await requireSeller(event)
  const body = await readBody<MethodBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  if (!body.kind) throw createError({ statusCode: 400, statusMessage: 'kind is required' })

  if (body.kind === 'CUSTOM') {
    if (!body.instructions) {
      throw createError({ statusCode: 400, statusMessage: 'instructions are required for custom methods' })
    }
    if (body.instructions.length > 400) {
      throw createError({ statusCode: 400, statusMessage: 'instructions must be 400 characters or fewer' })
    }
  } else if (!body.accountName || !body.accountRef) {
    throw createError({ statusCode: 400, statusMessage: 'accountName and accountRef are required' })
  }

  const { data, error } = await supabase
    .from('seller_payment_methods')
    .insert({
      seller_id: seller.id,
      kind: body.kind,
      asset_code: body.assetCode ?? null,
      account_name: body.accountName ?? null,
      account_ref: body.accountRef ?? null,
      bank_name: body.bankName ?? null,
      network: body.network ?? null,
      instructions: body.instructions ?? null
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { method: data }
})
