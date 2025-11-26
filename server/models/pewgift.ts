// FILE: /server/models/pewgift.ts
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
