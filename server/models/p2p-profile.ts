// FILE: /server/models/p2p-profile.ts
// REFACTORED: Lazy-loaded Supabase with Exported Wrapper Functions

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface P2PProfile {
  id: string
  userId: string
  tradingScore: number
  totalTrades: number
  successfulTrades: number
  disputedTrades: number
  averageRating: number
  totalReviews: number
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
  paymentMethods: string[]
  preferredCurrencies: string[]
  tradingLimits: {
    daily: number
    monthly: number
  }
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class P2PProfileModel {
  static async getProfile(userId: string): Promise<P2PProfile | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('p2p_profiles')
        .select('*')
        .eq('userId', userId)
        .single()

      if (error) {
        console.warn('[P2PProfileModel] Profile not found')
        return null
      }

      return data as P2PProfile
    } catch (error) {
      console.error('[P2PProfileModel] Error fetching profile:', error)
      throw error
    }
  }

  static async createProfile(userId: string): Promise<P2PProfile> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('p2p_profiles')
        .insert({
          userId,
          tradingScore: 0,
          totalTrades: 0,
          successfulTrades: 0,
          disputedTrades: 0,
          averageRating: 0,
          totalReviews: 0,
          verificationStatus: 'UNVERIFIED',
          paymentMethods: [],
          preferredCurrencies: [],
          tradingLimits: {
            daily: 10000,
            monthly: 100000
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as P2PProfile
    } catch (error) {
      console.error('[P2PProfileModel] Error creating profile:', error)
      throw error
    }
  }

  static async updateProfile(userId: string, updates: Partial<P2PProfile>): Promise<P2PProfile> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('p2p_profiles')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .select()
        .single()

      if (error) throw error
      return data as P2PProfile
    } catch (error) {
      console.error('[P2PProfileModel] Error updating profile:', error)
      throw error
    }
  }

  static async getTopTraders(limit = 10): Promise<P2PProfile[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('p2p_profiles')
        .select('*')
        .eq('verificationStatus', 'VERIFIED')
        .order('tradingScore', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as P2PProfile[]
    } catch (error) {
      console.error('[P2PProfileModel] Error fetching top traders:', error)
      throw error
    }
  }

  static async recordTrade(userId: string, successful: boolean): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase.rpc('record_p2p_trade', {
        user_id: userId,
        is_successful: successful
      })

      if (error) throw error
    } catch (error) {
      console.error('[P2PProfileModel] Error recording trade:', error)
      throw error
    }
  }
}

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new P2P profile
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
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
  return P2PProfileModel.createProfile(data.user_id)
}

/**
 * Find P2P profile by ID
 */
export async function findById(id: string): Promise<P2PProfile | null> {
  return P2PProfileModel.getProfile(id)
}

/**
 * Find P2P profile by user ID
 */
export async function findByUserId(userId: string): Promise<P2PProfile | null> {
  return P2PProfileModel.getProfile(userId)
}

/**
 * Update P2P profile by user ID
 */
export async function updateByUserId(
  userId: string,
  updates: Partial<P2PProfile>
): Promise<P2PProfile> {
  return P2PProfileModel.updateProfile(userId, updates)
}

/**
 * Update P2P profile
 */
export async function update(
  id: string,
  updates: Partial<P2PProfile>
): Promise<P2PProfile> {
  return P2PProfileModel.updateProfile(id, updates)
}

/**
 * Get top traders
 */
export async function getTopTraders(limit = 10): Promise<P2PProfile[]> {
  return P2PProfileModel.getTopTraders(limit)
}

/**
 * Record a trade
 */
export async function recordTrade(userId: string, successful: boolean): Promise<void> {
  return P2PProfileModel.recordTrade(userId, successful)
}
