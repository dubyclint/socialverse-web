import { createError, readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'

interface WithdrawBody {
  amount: number
  method: 'bank' | 'crypto'
  details: Record<string, string>
}

const REQUIRED: Record<WithdrawBody['method'], string[]> = {
  bank: ['bank_name', 'account_number', 'account_name'],
  crypto: ['network', 'address']
}

/** Moves earned PEW out of the wallet into a pending request for admin review. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<WithdrawBody>(event)
  const amount = Number(body?.amount)
  const method = body?.method
  if (method !== 'bank' && method !== 'crypto') {
    throw createError({ statusCode: 400, statusMessage: 'Choose bank or crypto' })
  }
  const details: Record<string, string> = {}
  for (const key of [...REQUIRED[method], 'country', 'note']) {
    const value = String(body.details?.[key] ?? '').trim().slice(0, 200)
    if (value) details[key] = value
  }
  const missing = REQUIRED[method].filter(key => !details[key])
  if (missing.length) {
    throw createError({ statusCode: 400, statusMessage: `Fill in ${missing.join(', ').replace(/_/g, ' ')}` })
  }

  const { data, error } = await getServiceClient().rpc('request_withdrawal', {
    p_amount: amount,
    p_method: method,
    p_details: details,
    p_user: user.id
  })
  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { id: data, status: 'pending' }
})
