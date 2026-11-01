import { createError, readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { assertAllowed } from '~/server/utils/staff'

interface WithdrawBody {
  amount: number
  method: 'bank' | 'crypto'
  details: Record<string, string>
  agree_terms?: boolean
}

const REQUIRED: Record<WithdrawBody['method'], string[]> = {
  bank: ['bank_name', 'account_number', 'account_name'],
  crypto: ['network', 'address']
}

/** Moves earned PEW out of the wallet into a pending request for admin review. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await assertAllowed(user.id, 'wallet')
  const body = await readBody<WithdrawBody>(event)
  const amount = Number(body?.amount)
  const method = body?.method
  if (method !== 'bank' && method !== 'crypto') {
    throw createError({ statusCode: 400, statusMessage: 'Choose bank or crypto' })
  }
  if (body.agree_terms !== true) {
    throw createError({ statusCode: 400, statusMessage: 'Accept the terms to continue' })
  }
  const details: Record<string, string> = {}
  for (const key of [...REQUIRED[method], 'country', 'note', 'currency']) {
    const value = String(body.details?.[key] ?? '').trim().slice(0, key === 'note' ? 500 : 200)
    if (value) details[key] = value
  }
  const missing = REQUIRED[method].filter(key => !details[key])
  if (missing.length) {
    throw createError({ statusCode: 400, statusMessage: `Fill in ${missing.join(', ').replace(/_/g, ' ')}` })
  }

  const db = getServiceClient()
  const currency = (details.currency || 'USD').toUpperCase()
  const { data: asset } = await db.from('supported_assets').select('code, reference_rate').eq('code', currency).eq('is_enabled', true).maybeSingle()
  if (!asset) throw createError({ statusCode: 400, statusMessage: 'Choose a supported payout currency' })
  details.currency = asset.code
  details.usd_per_unit = String(asset.reference_rate)
  details.terms_accepted_at = new Date().toISOString()

  const { data, error } = await db.rpc('request_withdrawal', {
    p_amount: amount,
    p_method: method,
    p_details: details,
    p_user: user.id
  })
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { id: data, status: 'pending' }
})
