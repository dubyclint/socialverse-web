import type { DepositSettings } from './types'

export const DEFAULT_DEPOSIT_SETTINGS: DepositSettings = {
  currency: 'USD',
  pewgift_per_unit: 1,
  platform_rate_pct: 0,
  min_amount: 1,
  max_amount: 10000
}
