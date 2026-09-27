export interface DepositSettings {
  currency: string
  pewgift_per_unit: number
  platform_rate_pct: number
  min_amount: number
  max_amount: number
}

export interface PaymentProviderRow {
  code: string
  display_name: string
  route: string
  supported_currencies: string[]
  config: Record<string, unknown>
  fee_percent: number
  fee_flat: number
  min_amount: number | null
  max_amount: number | null
  sort_order: number
  web_only: boolean
}

export interface FeeBreakdown {
  /** What the user is topping up with, before fees. */
  amount: number
  /** Percentage part of the admin-set fee, in source currency. */
  percentFee: number
  /** Flat part of the admin-set fee, in source currency. */
  flatFee: number
  /** Total fee charged on top of the amount at payment time. */
  totalFee: number
  /** What the provider actually charges the card/wallet. */
  chargeAmount: number
  /** Pewgift credited once the payment settles. */
  creditedPewgift: number
}

export interface CheckoutRequest {
  depositId: string
  amount: number
  currency: string
  email: string
  userId: string
  callbackUrl: string
  ipnUrl: string
}

export interface CheckoutResult {
  /** Hosted page to send the user to, when the provider has one. */
  checkoutUrl: string | null
  /** Human instructions shown in-app when there is no hosted page. */
  instructions: string | null
  /** Provider-side identifier stored on the deposit for reconciliation. */
  externalRef: string | null
  metadata?: Record<string, unknown>
}

export interface PaymentGateway {
  code: string
  createCheckout(provider: PaymentProviderRow, request: CheckoutRequest): Promise<CheckoutResult>
}
