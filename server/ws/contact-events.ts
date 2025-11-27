// FILE: /server/ws/contact-events.ts - FIXED WITH LAZY LOADING
// ============================================================================
// Contact Sync WebSocket Handler
// Real-time contact synchronization and friend suggestions
// ============================================================================

import type { Socket } from 'socket.io'
import { getWSSupabaseClient } from '~/server/utils/ws-supabase'

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

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

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
    console.log('[ContactSync] User authenticated:', userId)

    socket.send(JSON.stringify({
      type: 'authenticated',
      userId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[ContactSync] Authentication error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Authentication failed'
    }))
  }
}

async function handleSyncContacts(socket: UserContactSocket, payload: any) {
  try {
    // ✅ NOW USE LAZY-LOADED SUPABASE
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    if (socket.syncInProgress) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Sync already in progress'
      }))
      return
    }

    socket.syncInProgress = true
    const { contacts } = payload

    const result: SyncResult = {
      registered: [],
      unregistered: [],
      alreadyPals: [],
      newConnections: 0
    }

    // Process contacts
    for (const contact of contacts) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', contact.email)
        .single()

      if (existingUser) {
        // Check if already connected
        const { data: existingConnection } = await supabase
          .from('connections')
          .select('id')
          .eq('user_id', socket.userId)
          .eq('connected_user_id', existingUser.id)
          .single()

        if (existingConnection) {
          result.alreadyPals.push({
            id: existingUser.id,
            userId: socket.userId,
            name: contact.name,
            email: contact.email,
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
            status: 'registered',
            registeredUserId: existingUser.id,
            syncedAt: new Date().toISOString()
          })
          result.newConnections++
        }
      } else {
        result.unregistered.push({
          id: crypto.randomUUID(),
          userId: socket.userId,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          status: 'unregistered',
          syncedAt: new Date().toISOString()
        })
      }
    }

    // Store sync result
    activeSyncs.set(socket.userId, result)
    userContacts.set(socket.userId, [...result.registered, ...result.unregistered])

    socket.syncInProgress = false

    socket.send(JSON.stringify({
      type: 'sync_complete',
      result,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[ContactSync] Sync error:', error)
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
      status: socket.syncInProgress ? 'in_progress' : 'idle',
      result: result || null,
      timestamp: new Date().toISOString()
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
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { data: contacts, error } = await supabase
      .from('connections')
      .select('connected_user_id, profiles(id, username, avatar_url)')
      .eq('user_id', socket.userId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'contacts',
      contacts: contacts || [],
      timestamp: new Date().toISOString()
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
    const supabase = await getWSSupabaseClient()
    const { contactUserId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { error } = await supabase
      .from('connections')
      .insert({
        user_id: socket.userId,
        connected_user_id: contactUserId,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'contact_added',
      contactUserId,
      timestamp: new Date().toISOString()
    }))
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
    const supabase = await getWSSupabaseClient()
    const { contactUserId } = payload

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('user_id', socket.userId)
      .eq('connected_user_id', contactUserId)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'contact_removed',
      contactUserId,
      timestamp: new Date().toISOString()
    }))
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
    const supabase = await getWSSupabaseClient()

    if (!socket.userId) {
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Not authenticated'
      }))
      return
    }

    const { limit = 10 } = payload

    // Get users with similar interests
    const { data: suggestions, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, interests')
      .neq('id', socket.userId)
      .limit(limit)

    if (error) throw error

    socket.send(JSON.stringify({
      type: 'friend_suggestions',
      suggestions: suggestions || [],
      timestamp: new Date().toISOString()
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
    const supabase = await getWSSupabaseClient()
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
      contactUserId,
      timestamp: new Date().toISOString()
    }))
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
    const supabase = await getWSSupabaseClient()
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
      contactUserId,
      timestamp: new Date().toISOString()
    }))
  } catch (error) {
    console.error('[ContactSync] Unblock contact error:', error)
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to unblock contact'
    }))
  }
}
