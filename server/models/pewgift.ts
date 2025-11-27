// FILE: /server/models/pewgift.ts
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
export interface PewGift {
  id: string
  senderId: string
  recipientId: string
  amount: number
  message?: string
  status: 'PENDING' | 'SENT' | 'RECEIVED' | 'CANCELLED'
  sentAt?: string
  receivedAt?: string
  createdAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class PewGiftModel {
  static async sendGift(senderId: string, recipientId: string, amount: number, message?: string): Promise<PewGift> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pewgifts')
        .insert({
          senderId,
          recipientId,
          amount,
          message,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as PewGift
    } catch (error) {
      console.error('[PewGiftModel] Error sending gift:', error)
      throw error
    }
  }

  static async getGift(id: string): Promise<PewGift | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pewgifts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[PewGiftModel] Gift not found')
        return null
      }

      return data as PewGift
    } catch (error) {
      console.error('[PewGiftModel] Error fetching gift:', error)
      throw error
    }
  }

  static async getUserReceivedGifts(userId: string, limit = 50, offset = 0): Promise<PewGift[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pewgifts')
        .select('*')
        .eq('recipientId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as PewGift[]
    } catch (error) {
      console.error('[PewGiftModel] Error fetching received gifts:', error)
      throw error
    }
  }

  static async getUserSentGifts(userId: string, limit = 50, offset = 0): Promise<PewGift[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pewgifts')
        .select('*')
        .eq('senderId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as PewGift[]
    } catch (error) {
      console.error('[PewGiftModel] Error fetching sent gifts:', error)
      throw error
    }
  }

  static async updateStatus(id: string, status: string): Promise<PewGift> {
    try {
      const supabase = await getSupabase()
      const updates: any = { status }

      if (status === 'RECEIVED') {
        updates.receivedAt = new Date().toISOString()
      } else if (status === 'SENT') {
        updates.sentAt = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('pewgifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PewGift
    } catch (error) {
      console.error('[PewGiftModel] Error updating gift status:', error)
      throw error
    }
  }

  static async confirmGiftReceived(id: string): Promise<PewGift> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pewgifts')
        .update({
          status: 'RECEIVED',
          receivedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PewGift
    } catch (error) {
      console.error('[PewGiftModel] Error confirming gift:', error)
      throw error
    }
  }

  static async cancelGift(id: string): Promise<PewGift> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('pewgifts')
        .update({ status: 'CANCELLED' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PewGift
    } catch (error) {
      console.error('[PewGiftModel] Error cancelling gift:', error)
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
 * Create a new pew gift
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  sender_id: string
  receiver_id: string
  gift_type?: string
  gift_name?: string
  gift_value: number
  message?: string
  is_anonymous?: boolean
}): Promise<PewGift> {
  return PewGiftModel.sendGift(
    data.sender_id,
    data.receiver_id,
    data.gift_value,
    data.message
  )
}

/**
 * Find pew gift by ID
 */
export async function findById(id: string): Promise<PewGift | null> {
  return PewGiftModel.getGift(id)
}

/**
 * Find pew gifts by receiver ID
 */
export async function findByReceiverId(
  receiverId: string,
  limit = 20,
  offset = 0
): Promise<PewGift[]> {
  return PewGiftModel.getUserReceivedGifts(receiverId, limit, offset)
}

/**
 * Find pew gifts by sender ID
 */
export async function findBySenderId(
  senderId: string,
  limit = 20,
  offset = 0
): Promise<PewGift[]> {
  return PewGiftModel.getUserSentGifts(senderId, limit, offset)
}

/**
 * Update pew gift
 */
export async function update(
  id: string,
  updates: Partial<PewGift>
): Promise<PewGift> {
  if (updates.status) {
    return PewGiftModel.updateStatus(id, updates.status)
  }
  
  return PewGiftModel.getGift(id) as Promise<PewGift>
}

/**
 * Accept pew gift
 */
export async function accept(id: string): Promise<PewGift> {
  return PewGiftModel.confirmGiftReceived(id)
}

/**
 * Cancel pew gift
 */
export async function cancel(id: string): Promise<PewGift> {
  return PewGiftModel.cancelGift(id)
}
