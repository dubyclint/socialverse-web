// FILE: /server/models/pal.ts
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
export interface Pal {
  id: string
  userId: string
  palUserId: string
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED'
  nickname?: string
  notes?: string
  createdAt: string
  acceptedAt?: string
  blockedAt?: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class PalModel {
  static async sendPalRequest(userId: string, palUserId: string): Promise<Pal> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pals')
        .insert({
          userId,
          palUserId,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Pal
    } catch (error) {
      console.error('[PalModel] Error sending pal request:', error)
      throw error
    }
  }

  static async getPal(userId: string, palUserId: string): Promise<Pal | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pals')
        .select('*')
        .eq('userId', userId)
        .eq('palUserId', palUserId)
        .single()

      if (error) {
        console.warn('[PalModel] Pal relationship not found')
        return null
      }

      return data as Pal
    } catch (error) {
      console.error('[PalModel] Error fetching pal:', error)
      throw error
    }
  }

  static async getUserPals(userId: string, status?: string): Promise<Pal[]> {
    try {
      const supabase = await getSupabase()
      let query = supabase
        .from('pals')
        .select('*')
        .eq('userId', userId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('createdAt', { ascending: false })

      if (error) throw error
      return (data || []) as Pal[]
    } catch (error) {
      console.error('[PalModel] Error fetching user pals:', error)
      throw error
    }
  }

  static async acceptPalRequest(userId: string, palUserId: string): Promise<Pal> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pals')
        .update({
          status: 'ACCEPTED',
          acceptedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .eq('palUserId', palUserId)
        .select()
        .single()

      if (error) throw error
      return data as Pal
    } catch (error) {
      console.error('[PalModel] Error accepting pal request:', error)
      throw error
    }
  }

  static async blockPal(userId: string, palUserId: string): Promise<Pal> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pals')
        .update({
          status: 'BLOCKED',
          blockedAt: new Date().toISOString()
        })
        .eq('userId', userId)
        .eq('palUserId', palUserId)
        .select()
        .single()

      if (error) throw error
      return data as Pal
    } catch (error) {
      console.error('[PalModel] Error blocking pal:', error)
      throw error
    }
  }

  static async removePal(userId: string, palUserId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('pals')
        .delete()
        .eq('userId', userId)
        .eq('palUserId', palUserId)

      if (error) throw error
    } catch (error) {
      console.error('[PalModel] Error removing pal:', error)
      throw error
    }
  }

  static async getAcceptedPals(userId: string): Promise<Pal[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pals')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'ACCEPTED')

      if (error) throw error
      return (data || []) as Pal[]
    } catch (error) {
      console.error('[PalModel] Error fetching accepted pals:', error)
      throw error
    }
  }
}
