// FILE: /server/models/user-override.ts
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
export interface UserOverride {
  id: string
  userId: string
  overrideType: string
  overrideValue: any
  reason: string
  isActive: boolean
  expiresAt?: string
  createdAt: string
  createdBy: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class UserOverrideModel {
  static async createOverride(
    userId: string,
    overrideType: string,
    overrideValue: any,
    reason: string,
    createdBy: string,
    expiresAt?: string
  ): Promise<UserOverride> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_overrides')
        .insert({
          userId,
          overrideType,
          overrideValue,
          reason,
          isActive: true,
          expiresAt,
          createdAt: new Date().toISOString(),
          createdBy,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserOverride
    } catch (error) {
      console.error('[UserOverrideModel] Error creating override:', error)
      throw error
    }
  }

  static async getActiveOverrides(userId: string): Promise<UserOverride[]> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('user_overrides')
        .select('*')
        .eq('userId', userId)
        .eq('isActive', true)
        .or(`expiresAt.is.null,expiresAt.gt.${now}`)

      if (error) throw error
      return (data || []) as UserOverride[]
    } catch (error) {
      console.error('[UserOverrideModel] Error fetching active overrides:', error)
      throw error
    }
  }

  static async getOverride(userId: string, overrideType: string): Promise<UserOverride | null> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('user_overrides')
        .select('*')
        .eq('userId', userId)
        .eq('overrideType', overrideType)
        .eq('isActive', true)
        .or(`expiresAt.is.null,expiresAt.gt.${now}`)
        .single()

      if (error) {
        console.warn('[UserOverrideModel] Override not found')
        return null
      }

      return data as UserOverride
    } catch (error) {
      console.error('[UserOverrideModel] Error fetching override:', error)
      throw error
    }
  }

  static async removeOverride(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('user_overrides')
        .update({ isActive: false })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[UserOverrideModel] Error removing override:', error)
      throw error
    }
  }
}
