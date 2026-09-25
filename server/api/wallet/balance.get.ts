import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { createError } from 'h3'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('wallets')
    .select('balance, locked_balance, currency, is_locked')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data ?? { balance: 0, locked_balance: 0, currency: 'PEW', is_locked: false }
})
