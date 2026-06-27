// FILE: /server/models/security-restriction.ts
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
export type RestrictionType = 'IP_BAN' | 'ACCOUNT_LOCK' | 'RATE_LIMIT' | 'CONTENT_RESTRICTION'

export interface SecurityRestriction {
  id: string
  userId?: string
  ipAddress?: string
  restrictionType: RestrictionType
  reason: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  expiresAt: string
  isActive: boolean
  createdAt: string
  createdBy: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class SecurityRestrictionModel {
  static async createRestriction(
    restrictionType: RestrictionType,
    reason: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    expiresAt: string,
    createdBy: string,
    userId?: string,
    ipAddress?: string
  ): Promise<SecurityRestriction> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('security_restrictions')
        .insert({
          userId,
          ipAddress,
          restrictionType,
          reason,
          severity,
          expiresAt,
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy
        })
        .select()
        .single()

      if (error) throw error
      return data as SecurityRestriction
    } catch (error) {
      console.error('[SecurityRestrictionModel] Error creating restriction:', error)
      throw error
    }
  }

  static async getActiveRestrictions(userId?: string, ipAddress?: string): Promise<SecurityRestriction[]> {
    try {
      const supabase = await getSupabase()
      let query = supabase
        .from('security_restrictions')
        .select('*')
        .eq('isActive', true)
        .gt('expiresAt', new Date().toISOString())

      if (userId) {
        query = query.eq('userId', userId)
      }

      if (ipAddress) {
        query = query.eq('ipAddress', ipAddress)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as SecurityRestriction[]
    } catch (error) {
      console.error('[SecurityRestrictionModel] Error fetching restrictions:', error)
      throw error
    }
  }

  static async removeRestriction(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('security_restrictions')
        .update({ isActive: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[SecurityRestrictionModel] Error removing restriction:', error)
      throw error
    }
  }

  static async isUserRestricted(userId: string): Promise<boolean> {
    try {
      const restrictions = await this.getActiveRestrictions(userId)
      return restrictions.length > 0
    } catch (error) {
      console.error('[SecurityRestrictionModel] Error checking restriction:', error)
      return false
    }
  }
}
