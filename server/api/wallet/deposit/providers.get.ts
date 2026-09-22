import { createError, defineEventHandler } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

interface DepositSettings {
  currency: string
  pewgift_per_unit: number
  platform_rate_pct: number
  min_amount: number
  max_amount: number
}

const DEFAULT_SETTINGS: DepositSettings = {
  currency: 'USD',
  pewgift_per_unit: 1,
  platform_rate_pct: 0,
  min_amount: 1,
  max_amount: 10000
}

/** Deposit options actually configured for this platform, plus the conversion terms. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const client = await serverSupabaseClient<Database>(event)

  const [{ data: providers, error }, { data: config }] = await Promise.all([
    client
      .from('payment_providers')
      .select('code, display_name, route, supported_currencies')
      .eq('is_enabled', true)
      .order('display_name'),
    client
      .from('platform_configurations')
      .select('config_values')
      .eq('config_key', 'deposit_settings')
      .maybeSingle()
  ])

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const settings = { ...DEFAULT_SETTINGS, ...(config?.config_values as Partial<DepositSettings> | null) }

  return {
    success: true,
    data: {
      providers: providers ?? [],
      settings
    }
  }
})
