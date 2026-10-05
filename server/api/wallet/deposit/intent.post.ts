import { createError, defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { calculateFees, resolveLimits } from '~/server/utils/payments/fees'
import { resolveGateway } from '~/server/utils/payments/gateways'
import { DEFAULT_DEPOSIT_SETTINGS } from '~/server/utils/payments/settings'
import type { DepositSettings, PaymentProviderRow } from '~/server/utils/payments/types'
import type { Database, Json } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'

type DepositRoute = Database['public']['Enums']['deposit_route']

interface DepositIntentBody {
  providerCode: string
  amount: number
  currency?: string
  platform?: string
  idempotencyKey?: string
}

/**
 * Opens a deposit against a configured provider. The row stays unsettled until
 * the provider confirms payment — nothing credits the wallet from here.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<DepositIntentBody>(event)
  const amount = Number(body?.amount)

  if (!body?.providerCode) throw createError({ statusCode: 400, statusMessage: 'Payment option is required' })
  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid amount' })
  }

  const service = getServiceClient()

  const [{ data: providerRow }, { data: config }] = await Promise.all([
    service
      .from('payment_providers')
      .select('code, display_name, route, supported_currencies, config, fee_percent, fee_flat, min_amount, max_amount, sort_order, web_only')
      .eq('code', body.providerCode)
      .eq('is_enabled', true)
      .maybeSingle(),
    service
      .from('platform_configurations')
      .select('config_values')
      .eq('config_key', 'deposit_settings')
      .maybeSingle()
  ])

  if (!providerRow) throw createError({ statusCode: 404, statusMessage: 'That payment option is not available' })

  const provider = providerRow as unknown as PaymentProviderRow
  const isNative = (body.platform ?? 'web') !== 'web'

  if (isNative && provider.web_only) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Top-ups are only available on viorp.com in your browser'
    })
  }

  const settings: DepositSettings = {
    ...DEFAULT_DEPOSIT_SETTINGS,
    ...(config?.config_values as Partial<DepositSettings> | null)
  }
  const currency = (body.currency || settings.currency).toUpperCase()

  if (provider.supported_currencies?.length && !provider.supported_currencies.includes(currency)) {
    throw createError({ statusCode: 400, statusMessage: `${provider.display_name} does not support ${currency}` })
  }

  const limits = resolveLimits(provider, settings)
  if (amount < limits.min || amount > limits.max) {
    throw createError({
      statusCode: 400,
      statusMessage: `Amount must be between ${limits.min} and ${limits.max} ${currency}`
    })
  }

  const fees = calculateFees(amount, provider, settings)

  const { data: deposit, error } = await service
    .from('deposits')
    .insert({
      user_id: user.id,
      provider_code: provider.code,
      route: provider.route as DepositRoute,
      source_amount: fees.chargeAmount,
      source_currency: currency,
      rate_used: settings.pewgift_per_unit,
      platform_rate_pct: provider.fee_percent,
      gross_pewgift: fees.creditedPewgift,
      fee_pewgift: fees.totalFee,
      credited_pewgift: 0,
      status: 'AWAITING_PAYMENT',
      idempotency_key: body.idempotencyKey || crypto.randomUUID(),
      metadata: {
        initiated_from: isNative ? 'native' : 'wallet',
        fee_percent: provider.fee_percent,
        fee_flat: provider.fee_flat,
        net_amount: fees.amount
      }
    })
    .select('id, status, route, source_amount, source_currency, gross_pewgift, fee_pewgift')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const siteUrl = useRuntimeConfig().public.siteUrl || 'https://viorp.com'
  const gateway = resolveGateway(provider.code)

  let checkout
  try {
    checkout = await gateway.createCheckout(provider, {
      depositId: deposit.id,
      amount: fees.chargeAmount,
      currency,
      email: user.email ?? '',
      userId: user.id,
      callbackUrl: `${siteUrl}/wallet?deposit=${deposit.id}`,
      ipnUrl: `${siteUrl}/api/nowpayments/ipn`
    })
  } catch (gatewayError) {
    await service.from('deposits').update({ status: 'FAILED' }).eq('id', deposit.id)
    throw gatewayError
  }

  if (checkout.externalRef || checkout.metadata) {
    await service
      .from('deposits')
      .update({
        external_ref: checkout.externalRef ?? undefined,
        metadata: {
          initiated_from: isNative ? 'native' : 'wallet',
          fee_percent: provider.fee_percent,
          fee_flat: provider.fee_flat,
          net_amount: fees.amount,
          ...checkout.metadata
        } as Json
      })
      .eq('id', deposit.id)
  }

  return {
    success: true,
    data: {
      deposit,
      fees,
      provider: { code: provider.code, displayName: provider.display_name, route: provider.route },
      checkoutUrl: checkout.checkoutUrl,
      instructions: checkout.instructions
    }
  }
})
