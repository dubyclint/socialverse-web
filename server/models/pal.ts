// FILE: /server/models/pal.ts
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

  static async getPalById(id: string): Promise<Pal | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pals')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[PalModel] Pal not found')
        return null
      }

      return data as Pal
    } catch (error) {
      console.error('[PalModel] Error fetching pal by ID:', error)
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

  static async respondToPalRequest(userId: string, palUserId: string, status: 'ACCEPTED' | 'BLOCKED'): Promise<Pal> {
    try {
      const supabase = await getSupabase()
      const updates: any = {
        status
      }

      if (status === 'ACCEPTED') {
        updates.acceptedAt = new Date().toISOString()
      } else if (status === 'BLOCKED') {
        updates.blockedAt = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('pals')
        .update(updates)
        .eq('userId', userId)
        .eq('palUserId', palUserId)
        .select()
        .single()

      if (error) throw error
      return data as Pal
    } catch (error) {
      console.error('[PalModel] Error responding to pal request:', error)
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

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new pal request
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  requester_id: string
  requested_id: string
  message?: string
}): Promise<Pal> {
  return PalModel.sendPalRequest(data.requester_id, data.requested_id)
}

/**
 * Find pal by ID
 */
export async function findById(id: string): Promise<Pal | null> {
  return PalModel.getPalById(id)
}

/**
 * Update pal
 */
export async function update(
  id: string,
  updates: Partial<Pal>
): Promise<Pal> {
  const pal = await PalModel.getPalById(id)
  
  if (!pal) {
    throw new Error(`Pal not found: ${id}`)
  }

  if (updates.status) {
    return PalModel.respondToPalRequest(
      pal.userId,
      pal.palUserId,
      updates.status as 'ACCEPTED' | 'BLOCKED'
    )
  }
  
  return pal
}

/**
 * Find pal relationship between two users
 */
export async function findBetweenUsers(
  userId1: string,
  userId2: string
): Promise<Pal | null> {
  return PalModel.getPal(userId1, userId2)
}

/**
 * Accept pal request
 */
export async function accept(id: string): Promise<Pal> {
  const pal = await PalModel.getPalById(id)
  
  if (!pal) {
    throw new Error(`Pal not found: ${id}`)
  }

  return PalModel.respondToPalRequest(pal.userId, pal.palUserId, 'ACCEPTED')
}

/**
 * Reject pal request (block)
 */
export async function reject(id: string): Promise<Pal> {
  const pal = await PalModel.getPalById(id)
  
  if (!pal) {
    throw new Error(`Pal not found: ${id}`)
  }

  return PalModel.respondToPalRequest(pal.userId, pal.palUserId, 'BLOCKED')
}

/**
 * Block a pal
 */
export async function block(userId: string, palUserId: string): Promise<Pal> {
  return PalModel.blockPal(userId, palUserId)
}

/**
 * Remove a pal
 */
export async function remove(userId: string, palUserId: string): Promise<void> {
  return PalModel.removePal(userId, palUserId)
}

/**
 * Get accepted pals
 */
export async function getAccepted(userId: string): Promise<Pal[]> {
  return PalModel.getAcceptedPals(userId)
}
