export type P2PAssetKind = 'FIAT' | 'CRYPTO'
export type SellerMethodKind = 'BANK' | 'CRYPTO' | 'CUSTOM'
export type SellerMethodState = 'PENDING' | 'APPROVED' | 'REJECTED'
export type P2PTradeStatus = 'created' | 'funded' | 'disputed' | 'released' | 'cancelled'

export interface SupportedAsset {
  code: string
  kind: P2PAssetKind
  display_name: string
  network: string | null
  decimals: number
  min_deposit: number
  max_deposit: number | null
  reference_rate: number
}

export interface SellerMatch {
  listing_id: string
  seller_id: string
  username: string | null
  is_verified: boolean | null
  role: string | null
  margin_pct: number
  effective_rate: number
  reference_rate: number
  price_per_pewgift: number
  quote_amount: number
  available_pewgift: number
  has_alt_method: boolean
}

export interface SellerPayoutMethod {
  kind: SellerMethodKind
  asset_code: string | null
  account_name: string | null
  account_ref: string | null
  bank_name: string | null
  network: string | null
  instructions: string | null
}

export interface P2PTrade {
  id: string
  seller_id: string
  buyer_id: string
  amount: number
  status: P2PTradeStatus
  listing_id: string | null
  asset_code: string | null
  source_amount: number | null
  rate_used: number | null
  margin_pct: number
  fee_pewgift: number
  chat_room_id: string | null
  paid_declared_at: string | null
  released_at: string | null
  expires_at: string | null
  dispute_reason: string | null
  created_at: string
  updated_at: string
  seller_payment_methods?: SellerPayoutMethod | null
}
