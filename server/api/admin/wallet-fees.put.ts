import { createError, readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { DEFAULT_FEES, getFeeSettings, requireWalletAdmin, type FeeSettings } from '~/server/utils/wallet'

const LIMITS: Record<keyof FeeSettings, [number, number]> = {
  deposit_fee_pct: [0, 50],
  gift_fee_pct: [0, 50],
  withdrawal_fee_pct: [0, 90],
  withdrawal_tax_pct: [0, 50],
  pew_usd_rate: [0.0001, 1000000],
  min_withdrawal_pew: [0, 1000000]
}

export default defineEventHandler(async (event) => {
  await requireWalletAdmin(event)
  const body = await readBody<Partial<Record<keyof FeeSettings, unknown>>>(event)
  const next = await getFeeSettings()

  for (const key of Object.keys(DEFAULT_FEES) as (keyof FeeSettings)[]) {
    if (body?.[key] === undefined) continue
    const value = Number(body[key])
    const [min, max] = LIMITS[key]
    if (!Number.isFinite(value) || value < min || value > max) {
      throw createError({ statusCode: 400, statusMessage: `${key} must be between ${min} and ${max}` })
    }
    next[key] = value
  }
  if (next.withdrawal_fee_pct + next.withdrawal_tax_pct >= 100) {
    throw createError({ statusCode: 400, statusMessage: 'Withdrawal fee plus tax must be under 100%' })
  }

  const { error } = await getServiceClient()
    .from('platform_configurations')
    .upsert({ config_key: 'fee_settings', config_values: { ...next } }, { onConflict: 'config_key' })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return next
})
