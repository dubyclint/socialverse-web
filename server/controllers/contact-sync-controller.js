// server/controllers/contact-sync-controller.ts - Contact Sync Management
// ============================================================================

import type { H3Event } from 'h3'
import { readBody } from 'h3'
import { UserContact } from '../models/user-contact'
import { User } from '../models/profile'
import { Pal } from '../models/pal'
import { supabase } from '../utils/supabase'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ContactData {
  name: string
  phone?: string
  email?: string
}

export interface SyncResult {
  registered: any[]
  unregistered: any[]
  alreadyPals: any[]
  errors: any[]
}

export interface ContactSyncResponse {
  success: boolean
  data?: SyncResult
  message?: string
  error?: string
}

// ============================================================================
// CONTACT SYNC CONTROLLER
// ============================================================================

export class ContactSyncController {
  /**
   * Sync user's phone/email contacts
   * POST /api/contacts/sync
   */
  static async syncContacts(event: H3Event): Promise<ContactSyncResponse> {
    try {
      const userId = event.context.user?.id
      const body = await readBody(event)
      const { contacts } = body

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      if (!contacts || !Array.isArray(contacts)) {
        return {
          success: false,
          error: 'Contacts array is required'
        }
      }

      const syncResults: SyncResult = {
        registered: [],
        unregistered: [],
        alreadyPals: [],
        errors: []
      }

      for (const contact of contacts) {
        try {
          const { name, phone, email } = contact

          if (!name || (!phone && !email)) {
            syncResults.errors.push({
              contact,
              error: 'Name and at least one contact method required'
            })
            continue
          }

          // Search for user by phone or email
          let user = null

          if (phone) {
            user = await User.findOne({
              where: { phone }
            })
          }

          if (!user && email) {
            user = await User.findOne({
              where: { email }
            })
          }

          if (user) {
            // Check if already pals
            const existingPal = await Pal.findOne({
              where: {
                user_id: userId,
                pal_id: user.id
              }
            })

            if (existingPal) {
              syncResults.alreadyPals.push({
                name,
                userId: user.id,
                username: user.username
              })
            } else {
              // Add as pal
              await Pal.create({
                user_id: userId,
                pal_id: user.id,
                source: 'contact_sync',
                created_at: new Date().toISOString()
              })

              syncResults.registered.push({
                name,
                userId: user.id,
                username: user.username
              })
            }
          } else {
            syncResults.unregistered.push({
              name,
              phone,
              email
            })
          }

          // Save contact locally
          await UserContact.create({
            user_id: userId,
            contact_name: name,
            contact_phone: phone,
            contact_email: email,
            is_registered: !!user,
            registered_user_id: user?.id,
            created_at: new Date().toISOString()
          })
        } catch (error) {
          syncResults.errors.push({
            contact,
            error: (error as Error).message
          })
        }
      }

      return {
        success: true,
        data: syncResults,
        message: 'Contacts synced successfully'
      }
    } catch (error) {
      console.error('Error syncing contacts:', error)
      return {
        success: false,
        message: 'Error syncing contacts'
      }
    }
  }

  /**
   * Get synced contacts
   * GET /api/contacts
   */
  static async getSyncedContacts(event: H3Event): Promise<ContactSyncResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      const contacts = await UserContact.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      })

      return {
        success: true,
        data: {
          registered: contacts.filter((c: any) => c.is_registered),
          unregistered: contacts.filter((c: any) => !c.is_registered),
          alreadyPals: [],
          errors: []
        }
      }
    } catch (error) {
      console.error('Error getting synced contacts:', error)
      return {
        success: false,
        message: 'Error retrieving contacts'
      }
    }
  }

  /**
   * Remove synced contact
   * DELETE /api/contacts/:contactId
   */
  static async removeContact(event: H3Event): Promise<ContactSyncResponse> {
    try {
      const userId = event.context.user?.id
      const contactId = event.context.params?.contactId

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      await UserContact.destroy({
        where: {
          id: contactId,
          user_id: userId
        }
      })

      return {
        success: true,
        message: 'Contact removed successfully'
      }
    } catch (error) {
      console.error('Error removing contact:', error)
      return {
        success: false,
        message: 'Error removing contact'
      }
    }
  }

  /**
   * Clear all synced contacts
   * DELETE /api/contacts/clear-all
   */
  static async clearAllContacts(event: H3Event): Promise<ContactSyncResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      await UserContact.destroy({
        where: { user_id: userId }
      })

      return {
        success: true,
        message: 'All contacts cleared successfully'
      }
    } catch (error) {
      console.error('Error clearing contacts:', error)
      return {
        success: false,
        message: 'Error clearing contacts'
      }
    }
  }
}
