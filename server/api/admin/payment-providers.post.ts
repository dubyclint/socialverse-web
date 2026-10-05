import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import { getServiceClient } from '~/server/utils/supabase-admin'
import type { Database, Json } from '~/types/database.types'

type ProviderUpdate = Database['public']['Tables']['payment_providers']['Update']

interface BankSlot {
  currency: string
  bank_name: string
  account_name: string
  account_number: string
}

interface ProviderPayload {
  code: string
  isEnabled?: boolean
  feePercent?: number
  feeFlat?: number
  minAmount?: number | null
  maxAmount?: number | null
  webOnly?: boolean
  supportedCurrencies?: string[]
  /** Flutterwave: up to 6 currency/bank slots and 2 custom payment links. */
  bankSlots?: BankSlot[]
  paymentLinks?: string[]
  instructions?: string
  /** Paystack: settlement currency and wallet-currency → charge-currency rate. */
  chargeCurrency?: string | null
  fxRate?: number | null
}

const MAX_BANK_SLOTS = 6
const MAX_PAYMENT_LINKS = 2

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<ProviderPayload>(event)

  if (!body?.code) throw createError({ statusCode: 400, statusMessage: 'code is required' })
  if (body.feePercent != null && (body.feePercent < 0 || body.feePercent > 100)) {
    throw createError({ statusCode: 400, statusMessage: 'feePercent must be between 0 and 100' })
  }
  if (body.feeFlat != null && body.feeFlat < 0) {
    throw createError({ statusCode: 400, statusMessage: 'feeFlat cannot be negative' })
  }
  if (body.bankSlots && body.bankSlots.length > MAX_BANK_SLOTS) {
    throw createError({ statusCode: 400, statusMessage: `At most ${MAX_BANK_SLOTS} bank slots` })
  }
  if (body.paymentLinks && body.paymentLinks.length > MAX_PAYMENT_LINKS) {
    throw createError({ statusCode: 400, statusMessage: `At most ${MAX_PAYMENT_LINKS} payment links` })
  }

  const service = getServiceClient()

  const { data: existing } = await service
    .from('payment_providers')
    .select('config')
    .eq('code', body.code)
    .maybeSingle()

  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Unknown payment provider' })

  const config = { ...((existing.config ?? {}) as Record<string, unknown>) }
  if (body.bankSlots) config.bank_slots = body.bankSlots.filter(slot => slot.currency && slot.account_number)
  if (body.paymentLinks) config.payment_links = body.paymentLinks.filter(Boolean)
  if (body.instructions !== undefined) config.instructions = body.instructions
  if (body.fxRate != null && !(Number(body.fxRate) > 0)) {
    throw createError({ statusCode: 400, statusMessage: 'Exchange rate must be greater than 0' })
  }
  if (body.chargeCurrency !== undefined) {
    const currency = body.chargeCurrency?.trim().toUpperCase()
    if (currency) config.charge_currency = currency
    else delete config.charge_currency
  }
  if (body.fxRate !== undefined) {
    if (body.fxRate) config.fx_rate = Number(body.fxRate)
    else delete config.fx_rate
  }

  const update: ProviderUpdate = { config: config as Json, updated_at: new Date().toISOString() }
  if (body.isEnabled !== undefined) update.is_enabled = body.isEnabled
  if (body.feePercent !== undefined) update.fee_percent = body.feePercent
  if (body.feeFlat !== undefined) update.fee_flat = body.feeFlat
  if (body.minAmount !== undefined) update.min_amount = body.minAmount
  if (body.maxAmount !== undefined) update.max_amount = body.maxAmount
  if (body.webOnly !== undefined) update.web_only = body.webOnly
  if (body.supportedCurrencies) update.supported_currencies = body.supportedCurrencies

  const { data, error } = await service
    .from('payment_providers')
    .update(update)
    .eq('code', body.code)
    .select('code, display_name, route, is_enabled, supported_currencies, fee_percent, fee_flat, min_amount, max_amount, web_only, config')
    .single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })

  return { success: true, data }
})
