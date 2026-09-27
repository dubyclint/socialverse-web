import { createError, defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

/** Status of one of the caller's deposits, used when returning from a checkout. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Deposit id is required' })

  const client = await serverSupabaseClient<Database>(event)
  const { data, error } = await client
    .from('deposits')
    .select('id, status, source_amount, source_currency, gross_pewgift, fee_pewgift, credited_pewgift, settled_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Deposit not found' })

  return { success: true, data }
})
