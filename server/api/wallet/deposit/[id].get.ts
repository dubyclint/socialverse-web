import { createError, defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'
import { reconcileBachsCheckout, reconcileFlutterwave } from '~/server/utils/payments/reconcile'

/** Status of one of the caller's deposits, used when returning from a checkout. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Deposit id is required' })

  const client = await serverSupabaseClient<Database>(event)
  const read = () => client
    .from('deposits')
    .select('id, status, provider_code, external_ref, source_amount, source_currency, gross_pewgift, fee_pewgift, credited_pewgift, settled_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  let { data, error } = await read()

  // Returning from a hosted checkout: confirm with the provider directly so the
  // wallet is credited even if the webhook is late or not yet configured.
  if (data && data.status !== 'SETTLED' && data.status !== 'FAILED') {
    try {
      const result = data.provider_code === 'bachs' && data.external_ref
        ? await reconcileBachsCheckout(data.external_ref)
        : data.provider_code === 'flutterwave'
          ? await reconcileFlutterwave(data.id)
          : null
      if (result?.settled) ({ data, error } = await read())
    } catch (err) {
      console.error('[deposit] provider reconcile failed:', err)
    }
  }

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Deposit not found' })

  return { success: true, data }
})
