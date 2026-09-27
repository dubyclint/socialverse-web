import type { DepositSettings, FeeBreakdown, PaymentProviderRow } from './types'

const round = (value: number, dp = 4) => Number(value.toFixed(dp))

/**
 * Admin-set fees are charged on top of the top-up: the provider collects
 * amount + fee, and the wallet is credited for the amount only.
 */
export function calculateFees(
  amount: number,
  provider: Pick<PaymentProviderRow, 'fee_percent' | 'fee_flat'>,
  settings: DepositSettings
): FeeBreakdown {
  const percentFee = round((amount * Number(provider.fee_percent || 0)) / 100, 2)
  const flatFee = round(Number(provider.fee_flat || 0), 2)
  const totalFee = round(percentFee + flatFee, 2)

  return {
    amount: round(amount, 2),
    percentFee,
    flatFee,
    totalFee,
    chargeAmount: round(amount + totalFee, 2),
    creditedPewgift: round(amount * Number(settings.pewgift_per_unit || 1))
  }
}

export function resolveLimits(provider: PaymentProviderRow, settings: DepositSettings) {
  return {
    min: provider.min_amount ?? settings.min_amount,
    max: provider.max_amount ?? settings.max_amount
  }
}
