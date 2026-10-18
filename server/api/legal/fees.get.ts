import { defineEventHandler } from 'h3'
import { getFeeSettings } from '~/server/utils/wallet'

export default defineEventHandler(async () => {
  const fees = await getFeeSettings()
  return {
    deposit_fee_pct: fees.deposit_fee_pct,
    gift_fee_pct: fees.gift_fee_pct,
    withdrawal_fee_pct: fees.withdrawal_fee_pct,
    withdrawal_tax_pct: fees.withdrawal_tax_pct
  }
})
