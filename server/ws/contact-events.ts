// server/ws/contact-events.ts
// Contact Sync WebSocket Handler
// Real-time contact synchronization and friend suggestions

import type { Socket } from 'socket.io'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ContactData {
  id: string
  userId: string
  name: string
  phone?: string
  email?: string
  status: 'registered' | 'unregistered' | 'already_pal'
  registeredUserId?: string
  syncedAt: string
}

interface SyncResult {
  registered: ContactData[]
  unregistered: ContactData[]
  alreadyPals: ContactData[]
  newConnections: number
}

interface UserContactSocket extends Socket {
  userId?: string
  syncInProgress?: boolean
}

const activeSyncs = new Map<string, SyncResult>()
const userContacts = new Map<string, ContactData[]>()

export default defineWebSocketHandler({
  async open(peer, socket: UserContactSocket) {
    console.log('[ContactSync] WebSocket connection opened:', socket.id)
    socket.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to contact sync server',
      timestamp: new Date().toISOString()
    }))
  },

  async message(peer, socket: UserContactSocket, message) {
    try {
      const data = JSON.parse(message)
      const { type, payload } = data

      switch (type) {
        case 'authenticate':
          await handleAuthenticate(socket, payload)
          break

        case 'sync_contacts':
          await handleSyncContacts(socket, payload)
          break

        case 'get_sync_status':
          await handleGetSyncStatus(socket, payload)
          break

        case 'get_contacts':
          await handleGetContacts(socket, payload)
          break

        case 'add_contact':
          await handleAddContact(socket, payload)
          break

        case 'remove_contact':
          await handleRemoveContact(socket, payload)
          break

        case 'get_friend_suggestions':
          await handleGetFriendSuggestions(socket, payload)
          break

        case 'block_contact':
          await handleBlockContact(socket, payload)
          break

        case 'unblock_contact':
          await handleUnblockContact(socket, payload)
          break

        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: `Unknown contact type: ${type}`
          }))
      }
    } catch (error) {
      console.error('[ContactSync] Message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process contact sync'
      }))
    }
  },

  async close(peer, socket: UserContactSocket) {
    console.log('[ContactSync] Connection closed:', socket.id)
    if (socket.userId) {
      activeSyncs.delete(socket.userId)
    }
  }
})

async function handleAuthenticate(socket: UserContactSocket, payload: any) {
  try {
    const { userId } = payload

    if (!userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'User ID required'
      }))
      return
    }

    socket.userId = userId

    socket.send(JSON.stringify({
      type: 'authenticated',
      userId,
      socketId: socket.id
    }))

    console.log(`[ContactSync] User ${userId} authenticated`)
  } catch (error) {
    console.error('[ContactSync] Auth error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleSyncContacts(socket: UserContactSocket, payload: any) {
  try {
    const { contacts } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    socket.syncInProgress = true

    socket.send(JSON.stringify({
      type: 'sync_started',
      totalContacts: contacts.length
    }))

    const result: SyncResult = {
      registered: [],
      unregistered: [],
      alreadyPals: [],
      newConnections: 0
    }

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      // Check if contact exists in system
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .or(`email.eq.${contact.email},phone.eq.${contact.phone}`)
        .single()

      if (existingUser) {
        // Check if already pals
        const { data: existingPal } = await supabase
          .from('pals')
          .select('id')
          .eq('user_id', socket.userId)
          .eq('pal_id', existingUser.id)
          .single()

        if (existingPal) {
          result.alreadyPals.push({
            id: existingUser.id,
            userId: socket.userId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            status: 'already_pal',
            registeredUserId: existingUser.id,
            syncedAt: new Date().toISOString()
          })
        } else {
          result.registered.push({
            id: existingUser.id,
            userId: socket.userId,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            status: 'registered',
            registeredUserId: existingUser.id,
            syncedAt: new Date().toISOString()
          })
          result.newConnections++
        }
      } else {
        result.unregistered.push({
          id: `unregistered_${i}`,
          userId: socket.userId,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          status: 'unregistered',
          syncedAt: new Date().toISOString()
        })
      }

      // Send progress update
      socket.send(JSON.stringify({
        type: 'sync_progress',
        processed: i + 1,
        total: contacts.length,
        percentage: Math.round(((i + 1) / contacts.length) * 100)
      }))
    }

    // Save sync result
    activeSyncs.set(socket.userId, result)
    userContacts.set(socket.userId, [
      ...result.registered,
      ...result.unregistered,
      ...result.alreadyPals
    ])

    socket.syncInProgress = false

    socket.send(JSON.stringify({
      type: 'sync_completed',
      result
    }))

    console.log(`[ContactSync] Sync completed for user ${socket.userId}`)
  } catch (error) {
    console.error('[ContactSync] Sync contacts error:', error)
    socket.syncInProgress = false
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to sync contacts'
    }))
  }
}

async function handleGetSyncStatus(socket: UserContactSocket, payload: any) {
  try {
    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const result = activeSyncs.get(socket.userId)

    socket.send(JSON.stringify({
      type: 'sync_status',
      inProgress: socket.syncInProgress || false,
      result: result || null
    }))
  } catch (error) {
    console.error('[ContactSync] Get sync status error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to get sync status'
    }))
  }
}

async function handleGetContacts(socket: UserContactSocket, payload: any) {
  try {
    const { status, limit = 50, offset = 0 } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    let contacts = userContacts.get(socket.userId) || []

    if (status) {
      contacts = contacts.filter(c => c.status === status)
    }

    socket.send(JSON.stringify({
      type: 'contacts_list',
      contacts: contacts.slice(offset, offset + limit),
      total: contacts.length,
      offset,
      limit
    }))
  } catch (error) {
    console.error('[ContactSync] Get contacts error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch contacts'
    }))
  }
}

async function handleAddContact(socket: UserContactSocket, payload: any) {
  try {
    const { contactUserId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    // Create pal relationship
    const { error } = await supabase
      .from('pals')
      .insert({
        user_id: socket.userId,
        pal_id: contactUserId,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'contact_added',
      contactUserId
    }))

    console.log(`[ContactSync] Contact ${contactUserId} added by user ${socket.userId}`)
  } catch (error) {
    console.error('[ContactSync] Add contact error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to add contact'
    }))
  }
}

async function handleRemoveContact(socket: UserContactSocket, payload: any) {
  try {
    const { contactUserId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { error } = await supabase
      .from('pals')
      .delete()
      .eq('user_id', socket.userId)
      .eq('pal_id', contactUserId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'contact_removed',
      contactUserId
    }))

    console.log(`[ContactSync] Contact ${contactUserId} removed by user ${socket.userId}`)
  } catch (error) {
    console.error('[ContactSync] Remove contact error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to remove contact'
    }))
  }
}

async function handleGetFriendSuggestions(socket: UserContactSocket, payload: any) {
  try {
    const { limit = 10 } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    // Get contacts that are registered but not yet pals
    const contacts = userContacts.get(socket.userId) || []
    const suggestions = contacts
      .filter(c => c.status === 'registered')
      .slice(0, limit)

    socket.send(JSON.stringify({
      type: 'friend_suggestions',
      suggestions,
      count: suggestions.length
    }))
  } catch (error) {
    console.error('[ContactSync] Get friend suggestions error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch friend suggestions'
    }))
  }
}

async function handleBlockContact(socket: UserContactSocket, payload: any) {
  try {
    const { contactUserId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { error } = await supabase
      .from('blocked_users')
      .insert({
        user_id: socket.userId,
        blocked_user_id: contactUserId,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'contact_blocked',
      contactUserId
    }))

    console.log(`[ContactSync] User ${contactUserId} blocked by ${socket.userId}`)
  } catch (error) {
    console.error('[ContactSync] Block contact error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to block contact'
    }))
  }
}

async function handleUnblockContact(socket: UserContactSocket, payload: any) {
  try {
    const { contactUserId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', socket.userId)
      .eq('blocked_user_id', contactUserId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'contact_unblocked',
      contactUserId
    }))

    console.log(`[ContactSync] User ${contactUserId} unblocked by ${socket.userId}`)
  } catch (error) {
    console.error('[ContactSync] Unblock contact error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to unblock contact'
    }))
  }
}
