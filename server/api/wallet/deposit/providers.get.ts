import { createError, defineEventHandler, getQuery } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { DEFAULT_DEPOSIT_SETTINGS } from '~/server/utils/payments/settings'
import { resolveLimits } from '~/server/utils/payments/fees'
import type { DepositSettings, PaymentProviderRow } from '~/server/utils/payments/types'
import type { Database } from '~/types/database.types'

/** Deposit options actually configured for this platform, plus the conversion terms. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const client = await serverSupabaseClient<Database>(event)
  const isNative = String(getQuery(event).platform ?? 'web') !== 'web'

  const [{ data: providers, error }, { data: config }] = await Promise.all([
    client
      .from('payment_providers')
      .select('code, display_name, route, supported_currencies, fee_percent, fee_flat, min_amount, max_amount, sort_order, web_only, config')
      .eq('is_enabled', true)
      .order('sort_order'),
    client
      .from('platform_configurations')
      .select('config_values')
      .eq('config_key', 'deposit_settings')
      .maybeSingle()
  ])

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const settings: DepositSettings = {
    ...DEFAULT_DEPOSIT_SETTINGS,
    ...(config?.config_values as Partial<DepositSettings> | null)
  }

  const rows = (providers ?? []) as unknown as PaymentProviderRow[]
  const available = isNative ? rows.filter(row => !row.web_only) : rows

  return {
    success: true,
    data: {
      settings,
      webOnlyBlocked: isNative && rows.some(row => row.web_only),
      providers: available.map((row) => {
        const limits = resolveLimits(row, settings)
        return {
          code: row.code,
          display_name: row.display_name,
          route: row.route,
          supported_currencies: row.supported_currencies,
          fee_percent: Number(row.fee_percent),
          fee_flat: Number(row.fee_flat),
          min_amount: limits.min,
          max_amount: limits.max,
          currencies: (row.config as { bank_slots?: { currency: string }[] })?.bank_slots?.map(slot => slot.currency) ?? []
        }
      })
    }
  }
})
