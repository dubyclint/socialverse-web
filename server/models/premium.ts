// FILE: /server/models/premium.ts
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
export type PremiumTier = 'BASIC' | 'PLUS' | 'PRO' | 'ELITE'

export interface PremiumSubscription {
  id: string
  userId: string
  tier: PremiumTier
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED'
  startDate: string
  endDate: string
  autoRenew: boolean
  paymentMethod: string
  price: number
  currency: string
  features: string[]
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class PremiumModel {
  static async getSubscription(userId: string): Promise<PremiumSubscription | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'ACTIVE')
        .single()

      if (error) {
        console.warn('[PremiumModel] Subscription not found')
        return null
      }

      return data as PremiumSubscription
    } catch (error) {
      console.error('[PremiumModel] Error fetching subscription:', error)
      throw error
    }
  }

  static async createSubscription(
    userId: string,
    tier: PremiumTier,
    paymentMethod: string,
    autoRenew = true
  ): Promise<PremiumSubscription> {
    try {
      const supabase = await getSupabase()
      
      // Get tier pricing
      const tierPricing: Record<PremiumTier, number> = {
        BASIC: 9.99,
        PLUS: 19.99,
        PRO: 49.99,
        ELITE: 99.99
      }

      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

      const { data, error } = await supabase
        .from('premium_subscriptions')
        .insert({
          userId,
          tier,
          status: 'ACTIVE',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          autoRenew,
          paymentMethod,
          price: tierPricing[tier],
          currency: 'USD',
          features: this.getTierFeatures(tier),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as PremiumSubscription
    } catch (error) {
      console.error('[PremiumModel] Error creating subscription:', error)
      throw error
    }
  }

  static async upgradeTier(userId: string, newTier: PremiumTier): Promise<PremiumSubscription> {
    try {
      const supabase = await getSupabase()
      
      const tierPricing: Record<PremiumTier, number> = {
        BASIC: 9.99,
        PLUS: 19.99,
        PRO: 49.99,
        ELITE: 99.99
      }

      const { data, error } = await supabase
        .from('premium_subscriptions')
        .update({
          tier: newTier,
          price: tierPricing[newTier],
          features: this.getTierFeatures(newTier),
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .eq('status', 'ACTIVE')
        .select()
        .single()

      if (error) throw error
      return data as PremiumSubscription
    } catch (error) {
      console.error('[PremiumModel] Error upgrading tier:', error)
      throw error
    }
  }

  static async cancelSubscription(userId: string): Promise<PremiumSubscription> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .update({
          status: 'CANCELLED',
          autoRenew: false,
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .eq('status', 'ACTIVE')
        .select()
        .single()

      if (error) throw error
      return data as PremiumSubscription
    } catch (error) {
      console.error('[PremiumModel] Error cancelling subscription:', error)
      throw error
    }
  }

  static async renewSubscription(userId: string): Promise<PremiumSubscription> {
    try {
      const supabase = await getSupabase()
      
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('premium_subscriptions')
        .update({
          status: 'ACTIVE',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .select()
        .single()

      if (error) throw error
      return data as PremiumSubscription
    } catch (error) {
      console.error('[PremiumModel] Error renewing subscription:', error)
      throw error
    }
  }

  private static getTierFeatures(tier: PremiumTier): string[] {
    const features: Record<PremiumTier, string[]> = {
      BASIC: ['ad_free', 'basic_analytics'],
      PLUS: ['ad_free', 'basic_analytics', 'priority_support', 'custom_profile'],
      PRO: ['ad_free', 'advanced_analytics', 'priority_support', 'custom_profile', 'api_access'],
      ELITE: ['ad_free', 'advanced_analytics', 'priority_support', 'custom_profile', 'api_access', 'white_label']
    }
    return features[tier]
  }
}
