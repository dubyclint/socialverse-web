import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import type { Database } from '~/types/database.types'

type DepositRoute = Database['public']['Enums']['deposit_route']

interface DepositIntentBody {
  providerCode: string
  amount: number
  currency?: string
  idempotencyKey?: string
}

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

/**
 * Opens a deposit against a configured provider. The row stays unsettled until
 * the provider confirms payment — nothing credits the wallet from here.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<DepositIntentBody>(event)
  const amount = Number(body?.amount)

  if (!body?.providerCode) throw createError({ statusCode: 400, statusMessage: 'Payment option is required' })
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid amount' })
  }

  const service = getServiceClient()

  const [{ data: provider }, { data: config }] = await Promise.all([
    service
      .from('payment_providers')
      .select('code, display_name, route, supported_currencies, config')
      .eq('code', body.providerCode)
      .eq('is_enabled', true)
      .maybeSingle(),
    service
      .from('platform_configurations')
      .select('config_values')
      .eq('config_key', 'deposit_settings')
      .maybeSingle()
  ])

  if (!provider) throw createError({ statusCode: 404, statusMessage: 'That payment option is not available' })

  const settings = { ...DEFAULT_SETTINGS, ...(config?.config_values as Partial<DepositSettings> | null) }
  const currency = (body.currency || settings.currency).toUpperCase()

  if (provider.supported_currencies?.length && !provider.supported_currencies.includes(currency)) {
    throw createError({ statusCode: 400, statusMessage: `${provider.display_name} does not support ${currency}` })
  }
  if (amount < settings.min_amount || amount > settings.max_amount) {
    throw createError({
      statusCode: 400,
      statusMessage: `Amount must be between ${settings.min_amount} and ${settings.max_amount} ${currency}`
    })
  }

  const gross = amount * settings.pewgift_per_unit
  const fee = (gross * settings.platform_rate_pct) / 100

  const { data: deposit, error } = await service
    .from('deposits')
    .insert({
      user_id: user.id,
      provider_code: provider.code,
      route: provider.route as DepositRoute,
      source_amount: amount,
      source_currency: currency,
      rate_used: settings.pewgift_per_unit,
      platform_rate_pct: settings.platform_rate_pct,
      gross_pewgift: gross,
      fee_pewgift: fee,
      credited_pewgift: 0,
      status: 'AWAITING_PAYMENT',
      idempotency_key: body.idempotencyKey || crypto.randomUUID(),
      metadata: { initiated_from: 'wallet' }
    })
    .select('id, status, route, source_amount, source_currency, gross_pewgift, fee_pewgift')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const providerConfig = (provider.config ?? {}) as { checkout_url?: string, instructions?: string }

  return {
    success: true,
    data: {
      deposit,
      provider: { code: provider.code, displayName: provider.display_name, route: provider.route },
      checkoutUrl: providerConfig.checkout_url ?? null,
      instructions: providerConfig.instructions ?? null
    }
  }
})
