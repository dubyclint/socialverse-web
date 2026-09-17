import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null
function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

export type P2PVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED'

export interface P2PProfile {
  id: string
  user_id: string
  trading_score: number
  total_trades: number
  successful_trades: number
  disputed_trades: number
  average_rating: number
  total_reviews: number
  verification_status: P2PVerificationStatus
  payment_methods: string[]
  preferred_currencies: string[]
  trading_limits: {
    daily: number
    monthly: number
  }
  created_at: string
  updated_at: string

  // compatibility aliases
  userId?: string
  tradingScore?: number
  totalTrades?: number
  successfulTrades?: number
  disputedTrades?: number
  averageRating?: number
  totalReviews?: number
  verificationStatus?: P2PVerificationStatus
  paymentMethods?: string[]
  preferredCurrencies?: string[]
  tradingLimits?: { daily: number; monthly: number }
  createdAt?: string
  updatedAt?: string
}

const withAliases = (row: any): P2PProfile => ({
  ...row,
  userId: row.user_id,
  tradingScore: row.trading_score,
  totalTrades: row.total_trades,
  successfulTrades: row.successful_trades,
  disputedTrades: row.disputed_trades,
  averageRating: row.average_rating,
  totalReviews: row.total_reviews,
  verificationStatus: row.verification_status,
  paymentMethods: row.payment_methods,
  preferredCurrencies: row.preferred_currencies,
  tradingLimits: row.trading_limits,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const stripUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as Partial<T>
}

export class P2PProfileModel {
  static async getProfile(userId: string): Promise<P2PProfile | null> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('p2p_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[P2PProfileModel.getProfile] error:', error.message)
      throw new Error('Failed to fetch p2p profile')
    }

    return data ? withAliases(data) : null
  }

  static async createProfile(userId: string): Promise<P2PProfile> {
    const supabase = getSupabase()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('p2p_profiles')
      .insert({
        user_id: userId,
        trading_score: 0,
        total_trades: 0,
        successful_trades: 0,
        disputed_trades: 0,
        average_rating: 0,
        total_reviews: 0,
        verification_status: 'UNVERIFIED',
        payment_methods: [],
        preferred_currencies: [],
        trading_limits: { daily: 10000, monthly: 100000 },
        created_at: now,
        updated_at: now
      })
      .select('*')
      .single()

    if (error || !data) {
      console.error('[P2PProfileModel.createProfile] error:', error?.message)
      throw new Error(error?.message || 'Failed to create p2p profile')
    }

    return withAliases(data)
  }

  static async updateProfile(userId: string, updates: Partial<P2PProfile>): Promise<P2PProfile> {
    const supabase = getSupabase()

    const payload = stripUndefined({
      trading_score: updates.trading_score ?? updates.tradingScore,
      total_trades: updates.total_trades ?? updates.totalTrades,
      successful_trades: updates.successful_trades ?? updates.successfulTrades,
      disputed_trades: updates.disputed_trades ?? updates.disputedTrades,
      average_rating: updates.average_rating ?? updates.averageRating,
      total_reviews: updates.total_reviews ?? updates.totalReviews,
      verification_status: updates.verification_status ?? updates.verificationStatus,
      payment_methods: updates.payment_methods ?? updates.paymentMethods,
      preferred_currencies: updates.preferred_currencies ?? updates.preferredCurrencies,
      trading_limits: updates.trading_limits ?? updates.tradingLimits,
      updated_at: new Date().toISOString()
    })

    const { data, error } = await supabase
      .from('p2p_profiles')
      .update(payload)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[P2PProfileModel.updateProfile] error:', error?.message)
      throw new Error(error?.message || 'Failed to update p2p profile')
    }

    return withAliases(data)
  }

  static async getTopTraders(limit = 10): Promise<P2PProfile[]> {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('p2p_profiles')
      .select('*')
      .eq('verification_status', 'VERIFIED')
      .order('trading_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[P2PProfileModel.getTopTraders] error:', error.message)
      throw new Error('Failed to fetch top traders')
    }

    return (data || []).map(withAliases)
  }

  static async recordTrade(userId: string, successful: boolean): Promise<void> {
    const supabase = getSupabase()

    const { error } = await supabase.rpc('record_p2p_trade', {
      user_id: userId,
      is_successful: successful
    })

    if (error) {
      console.error('[P2PProfileModel.recordTrade] error:', error.message)
      throw new Error('Failed to record p2p trade')
    }
  }
}

// Wrappers for existing controller imports
export async function create(data: {
  user_id: string
  display_name?: string
  bio?: string
  payment_methods?: string[]
  verification_level?: string
  trading_preferences?: Record<string, any>
  time_zone?: string
  languages?: string[]
}): Promise<P2PProfile> {
  // current behavior: initialize baseline row
  return P2PProfileModel.createProfile(data.user_id)
}

export async function findById(id: string): Promise<P2PProfile | null> {
  return P2PProfileModel.getProfile(id)
}

export async function findByUserId(userId: string): Promise<P2PProfile | null> {
  return P2PProfileModel.getProfile(userId)
}

export async function updateByUserId(
  userId: string,
  updates: Partial<P2PProfile>
): Promise<P2PProfile> {
  return P2PProfileModel.updateProfile(userId, updates)
}

export async function update(
  id: string,
  updates: Partial<P2PProfile>
): Promise<P2PProfile> {
  return P2PProfileModel.updateProfile(id, updates)
}

export async function getTopTraders(limit = 10): Promise<P2PProfile[]> {
  return P2PProfileModel.getTopTraders(limit)
}

export async function recordTrade(userId: string, successful: boolean): Promise<void> {
  return P2PProfileModel.recordTrade(userId, successful)
}
