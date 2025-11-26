// FILE: /server/models/contact.ts
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
export interface Contact {
  id: string
  userId: string
  contactUserId: string
  name: string
  email?: string
  phone?: string
  notes?: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ContactModel {
  static async addContact(userId: string, contactUserId: string, name: string): Promise<Contact> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          userId,
          contactUserId,
          name,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Contact
    } catch (error) {
      console.error('[ContactModel] Error adding contact:', error)
      throw error
    }
  }

  static async getContact(userId: string, contactUserId: string): Promise<Contact | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('userId', userId)
        .eq('contactUserId', contactUserId)
        .single()

      if (error) {
        console.warn('[ContactModel] Contact not found')
        return null
      }

      return data as Contact
    } catch (error) {
      console.error('[ContactModel] Error fetching contact:', error)
      throw error
    }
  }

  static async getUserContacts(userId: string, limit = 100, offset = 0): Promise<Contact[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('userId', userId)
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as Contact[]
    } catch (error) {
      console.error('[ContactModel] Error fetching contacts:', error)
      throw error
    }
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Contact
    } catch (error) {
      console.error('[ContactModel] Error updating contact:', error)
      throw error
    }
  }

  static async removeContact(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[ContactModel] Error removing contact:', error)
      throw error
    }
  }

  static async getFavoriteContacts(userId: string): Promise<Contact[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('userId', userId)
        .eq('isFavorite', true)
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []) as Contact[]
    } catch (error) {
      console.error('[ContactModel] Error fetching favorite contacts:', error)
      throw error
    }
  }
}
