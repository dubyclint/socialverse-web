// FILE: /server/models/p2p-profile.ts
// REFACTORED: Lazy-loaded Supabase

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
