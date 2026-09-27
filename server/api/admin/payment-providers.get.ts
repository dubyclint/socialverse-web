import { createError, defineEventHandler } from 'h3'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { DEFAULT_DEPOSIT_SETTINGS } from '~/server/utils/payments/settings'
import type { DepositSettings } from '~/server/utils/payments/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const service = getServiceClient()

  const [{ data: providers, error }, { data: config }] = await Promise.all([
    service
      .from('payment_providers')
      .select('code, display_name, route, is_enabled, supported_currencies, fee_percent, fee_flat, min_amount, max_amount, sort_order, web_only, config')
      .order('sort_order'),
    service
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

  return { success: true, data: { providers: providers ?? [], settings } }
})
