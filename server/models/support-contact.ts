// FILE: /server/models/support-contact.ts
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
export interface SupportContact {
  id: string
  userId: string
  subject: string
  message: string
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  attachments?: string[]
  assignedAgentId?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class SupportContactModel {
  static async createContact(
    userId: string,
    subject: string,
    message: string,
    category: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    attachments?: string[]
  ): Promise<SupportContact> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('support_contacts')
        .insert({
          userId,
          subject,
          message,
          category,
          priority,
          status: 'OPEN',
          attachments,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SupportContact
    } catch (error) {
      console.error('[SupportContactModel] Error creating contact:', error)
      throw error
    }
  }

  static async getContact(id: string): Promise<SupportContact | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('support_contacts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[SupportContactModel] Contact not found')
        return null
      }

      return data as SupportContact
    } catch (error) {
      console.error('[SupportContactModel] Error fetching contact:', error)
      throw error
    }
  }

  static async getUserContacts(userId: string, limit = 50, offset = 0): Promise<SupportContact[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('support_contacts')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as SupportContact[]
    } catch (error) {
      console.error('[SupportContactModel] Error fetching user contacts:', error)
      throw error
    }
  }

  static async updateContactStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'): Promise<SupportContact> {
    try {
      const supabase = await getSupabase()
      const updates: any = {
        status,
        updatedAt: new Date().toISOString()
      }

      if (status === 'RESOLVED') {
        updates.resolvedAt = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('support_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SupportContact
    } catch (error) {
      console.error('[SupportContactModel] Error updating contact status:', error)
      throw error
    }
  }

  static async assignAgent(id: string, agentId: string): Promise<SupportContact> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('support_contacts')
        .update({
          assignedAgentId: agentId,
          status: 'IN_PROGRESS',
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SupportContact
    } catch (error) {
      console.error('[SupportContactModel] Error assigning agent:', error)
      throw error
    }
  }

  static async getOpenContacts(limit = 50): Promise<SupportContact[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('support_contacts')
        .select('*')
        .eq('status', 'OPEN')
        .order('priority', { ascending: false })
        .order('createdAt', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data || []) as SupportContact[]
    } catch (error) {
      console.error('[SupportContactModel] Error fetching open contacts:', error)
      throw error
    }
  }
}
