// FILE: /server/models/contact.ts
// User Contact Management
// Converted from: user-contact.js

import { db } from '~/server/utils/database'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UserContact {
  id: string
  user_id: string
  contact_user_id?: string
  contact_phone?: string
  contact_email?: string
  contact_name: string
  is_registered: boolean
  is_pal: boolean
  is_blocked: boolean
  is_favorite: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateContactInput {
  userId: string
  contactName: string
  contactPhone?: string
  contactEmail?: string
  notes?: string
}

export interface UpdateContactInput {
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  notes?: string
  isFavorite?: boolean
  isBlocked?: boolean
}

// ============================================================================
// CONTACT MODEL
// ============================================================================

export class ContactModel {
  /**
   * Create a new contact
   */
  static async create(input: CreateContactInput): Promise<UserContact> {
    try {
      const { data, error } = await db
        .from('user_contacts')
        .insert({
          user_id: input.userId,
          contact_name: input.contactName,
          contact_phone: input.contactPhone,
          contact_email: input.contactEmail,
          notes: input.notes,
          is_registered: false,
          is_pal: false,
          is_blocked: false,
          is_favorite: false
        })
        .select()
        .single()

      if (error) throw error
      return data as UserContact
    } catch (error) {
      console.error('[ContactModel] Create error:', error)
      throw error
    }
  }

  /**
   * Get contact by ID
   */
  static async getById(contactId: string): Promise<UserContact | null> {
    try {
      const { data, error } = await db
        .from('user_contacts')
        .select('*')
        .eq('id', contactId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserContact) || null
    } catch (error) {
      console.error('[ContactModel] Get by ID error:', error)
      throw error
    }
  }

  /**
   * Get all contacts for a user
   */
  static async getUserContacts(userId: string, limit: number = 100): Promise<UserContact[]> {
    try {
      const { data, error } = await db
        .from('user_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('contact_name', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data as UserContact[]) || []
    } catch (error) {
      console.error('[ContactModel] Get user contacts error:', error)
      throw error
    }
  }

  /**
   * Get favorite contacts
   */
  static async getFavoriteContacts(userId: string): Promise<UserContact[]> {
    try {
      const { data, error } = await db
        .from('user_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('contact_name', { ascending: true })

      if (error) throw error
      return (data as UserContact[]) || []
    } catch (error) {
      console.error('[ContactModel] Get favorite contacts error:', error)
      throw error
    }
  }

  /**
   * Get registered contacts (contacts who are also users)
   */
  static async getRegisteredContacts(userId: string): Promise<UserContact[]> {
    try {
      const { data, error } = await db
        .from('user_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_registered', true)
        .order('contact_name', { ascending: true })

      if (error) throw error
      return (data as UserContact[]) || []
    } catch (error) {
      console.error('[ContactModel] Get registered contacts error:', error)
      throw error
    }
  }

  /**
   * Update contact
   */
  static async update(contactId: string, userId: string, updates: UpdateContactInput): Promise<UserContact> {
    try {
      const { data, error } = await db
        .from('user_contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserContact
    } catch (error) {
      console.error('[ContactModel] Update error:', error)
      throw error
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(contactId: string, userId: string): Promise<UserContact> {
    try {
      const contact = await this.getById(contactId)
      if (!contact || contact.user_id !== userId) {
        throw new Error('Contact not found or unauthorized')
      }

      const { data, error } = await db
        .from('user_contacts')
        .update({
          is_favorite: !contact.is_favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .select()
        .single()

      if (error) throw error
      return data as UserContact
    } catch (error) {
      console.error('[ContactModel] Toggle favorite error:', error)
      throw error
    }
  }

  /**
   * Block/Unblock contact
   */
  static async toggleBlock(contactId: string, userId: string): Promise<UserContact> {
    try {
      const contact = await this.getById(contactId)
      if (!contact || contact.user_id !== userId) {
        throw new Error('Contact not found or unauthorized')
      }

      const { data, error } = await db
        .from('user_contacts')
        .update({
          is_blocked: !contact.is_blocked,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .select()
        .single()

      if (error) throw error
      return data as UserContact
    } catch (error) {
      console.error('[ContactModel] Toggle block error:', error)
      throw error
    }
  }

  /**
   * Delete contact
   */
  static async delete(contactId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await db
        .from('user_contacts')
        .delete()
        .eq('id', contactId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[ContactModel] Delete error:', error)
      throw error
    }
  }

  /**
   * Search contacts by name, phone, or email
   */
  static async search(userId: string, query: string): Promise<UserContact[]> {
    try {
      const { data, error } = await db
        .from('user_contacts')
        .select('*')
        .eq('user_id', userId)
        .or(
          `contact_name.ilike.%${query}%,contact_phone.ilike.%${query}%,contact_email.ilike.%${query}%`
        )
        .order('contact_name', { ascending: true })

      if (error) throw error
      return (data as UserContact[]) || []
    } catch (error) {
      console.error('[ContactModel] Search error:', error)
      throw error
    }
  }

  /**
   * Sync contacts (mark as registered if they join)
   */
  static async syncContact(contactId: string, contactUserId: string): Promise<UserContact> {
    try {
      const { data, error } = await db
        .from('user_contacts')
        .update({
          contact_user_id: contactUserId,
          is_registered: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId)
        .select()
        .single()

      if (error) throw error
      return data as UserContact
    } catch (error) {
      console.error('[ContactModel] Sync contact error:', error)
      throw error
    }
  }

  /**
   * Get contact by phone or email
   */
  static async getByPhoneOrEmail(userId: string, phone?: string, email?: string): Promise<UserContact | null> {
    try {
      let query = db.from('user_contacts').select('*').eq('user_id', userId)

      if (phone) {
        query = query.eq('contact_phone', phone)
      } else if (email) {
        query = query.eq('contact_email', email)
      } else {
        return null
      }

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserContact) || null
    } catch (error) {
      console.error('[ContactModel] Get by phone/email error:', error)
      throw error
    }
  }
}
