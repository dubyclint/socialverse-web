// ============================================================================
// FILE: /plugins/socket.client.ts - RECONCILED VERSION
// Description: Sequenced Socket.IO initialization dependent on Auth status.
// ============================================================================

import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null
let connectionAttempts = 0
const MAX_CONNECTION_ATTEMPTS = 5

export default defineNuxtPlugin({
  name: 'socialverse-socket-client',

  // ✅ FIXED: Explicit dependency sequencing prevents race conditions during boot
  dependsOn: ['00-init-sequence', 'socialverse-auth-client'],

  async setup(nuxtApp) {
    if (!process.client) return

    console.log('[Socket.IO] Initializing lifecycle sequence...')

    try {
      // Lazy-import store to completely eliminate top-level bundling deadlocks
      const { useAuthStore } = await import('~/stores/auth')
      const authStore = useAuthStore()

      // ✅ RECONCILED: Auth plugin already ran and resolved its promise due to dependsOn,
      // so we can directly evaluate the presence of the session token.
      if (authStore.token) {
        console.log('[Socket.IO] ✅ Active auth session found. Triggering auto-connect...')
        await autoConnect()
      } else {
        console.log('[Socket.IO] ℹ️ No active session token found. Skipping auto-connect fallback.')
      }

    } catch (error: any) {
      console.error('[Socket.IO] ❌ Core initialization exception thrown:', error?.message || error)
    }

    // ========================================================================
    // EXPOSED UTILITIES (UNIVERSAL CLIENT INTERFACE)
    // ========================================================================
    return {
      provide: {
        socket: {
          async connect(): Promise<Socket | null> {
            return autoConnect()
          },

          getInstance(): Socket | null {
            return socketInstance
          },

          isConnected(): boolean {
            return socketInstance?.connected || false
          },

          getState(): { connected: boolean; authenticated: boolean; error: string | null } {
            return {
              connected: socketInstance?.connected || false,
              authenticated: socketInstance?.connected || false,
              error: null
            }
          },

          disconnect(): void {
            if (socketInstance) {
              socketInstance.disconnect()
              socketInstance = null
              connectionAttempts = 0
              console.log('[Socket.IO] ✅ Connection severed cleanly.')
            }
          },

          emit(event: string, data?: any): void {
            if (socketInstance?.connected) {
              try {
                socketInstance.emit(event, data)
                console.log('[Socket.IO] ✅ Packet transmitted:', event)
              } catch (error) {
                console.error('[Socket.IO] ❌ Transmission glitch:', error)
              }
            } else {
              console.warn('[Socket.IO] ⚠️ Transmission dropped. Socket is offline:', event)
            }
          },

          on(event: string, callback: (data: any) => void): void {
            if (socketInstance) {
              try {
                socketInstance.on(event, callback)
                console.log('[Socket.IO] ✅ Pipeline listener bound:', event)
              } catch (error) {
                console.error('[Socket.IO] ❌ Pipeline attachment failure:', error)
              }
            }
          },

          off(event: string, callback?: (data: any) => void): void {
            if (socketInstance) {
              try {
                socketInstance.off(event, callback)
                console.log('[Socket.IO] ✅ Pipeline listener decoupled:', event)
              } catch (error) {
                console.error('[Socket.IO] ❌ Pipeline decoupling error:', error)
              }
            }
          },

          async reconnect(): Promise<Socket | null> {
            console.log('[Socket.IO] 🔄 Resetting runtime pipeline connection instance...')
            this.disconnect()
            await new Promise(resolve => setTimeout(resolve, 1000))
            return this.connect()
          },

          // --- DOMAIN HOOK IMPLEMENTATIONS ---
          joinChat(chatId: string): void {
            this.emit('join_chat', { chatId })
          },

          leaveChat(chatId: string): void {
            this.emit('leave_chat', { chatId })
          },

          sendMessage(chatId: string, message: string): void {
            this.emit('send_message', { chatId, message })
          },

          sendTyping(chatId: string): void {
            this.emit('typing', { chatId })
          },

          updatePresence(status: string, activity?: string): void {
            this.emit('update_presence', { status, activity })
          },

          subscribeNotifications(types: string[]): void {
            this.emit('subscribe_notifications', { types })
          },

          unsubscribeNotifications(types: string[]): void {
            this.emit('unsubscribe_notifications', { types })
          },

          startStream(streamId: string, title: string): void {
            this.emit('start_stream', { streamId, title })
          },

          endStream(streamId: string): void {
            this.emit('end_stream', { streamId })
          },

          joinStream(streamId: string): void {
            this.emit('join_stream', { streamId })
          },

          leaveStream(streamId: string): void {
            this.emit('leave_stream', { streamId })
          },

          initiateCall(targetUserId: string, offer: any): void {
            this.emit('initiate_call', { targetUserId, offer })
          },

          answerCall(targetUserId: string, answer: any): void {
            this.emit('answer_call', { targetUserId, answer })
          },

          sendIceCandidate(targetUserId: string, candidate: any): void {
            this.emit('ice_candidate', { targetUserId, candidate })
          },

          endCall(targetUserId: string): void {
            this.emit('end_call', { targetUserId })
          }
        }
      }
    }
  }
})

// ============================================================================
// DRIVER FACTORY METHOD
// ============================================================================
async function autoConnect(): Promise<Socket | null> {
  try {
    if (socketInstance?.connected) {
      console.log('[Socket.IO] Active connection exists. Skipping initialization.')
      return socketInstance
    }

    const { useAuthStore } = await import('~/stores/auth')
    const authStore = useAuthStore()

    if (!authStore.token) {
      console.warn('[Socket.IO] ⚠️ Aborted connection request. Auth missing.')
      return null
    }

    const config = useRuntimeConfig()
    const socketUrl = config.public.socketUrl || window.location.origin

    console.log('[Socket.IO] Establishing secure handshake with target:', socketUrl)

    socketInstance = io(socketUrl, {
      auth: {
        token: authStore.token,
        userId: authStore.userId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_CONNECTION_ATTEMPTS,
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
      secure: window.location.protocol === 'https:',
      rejectUnauthorized: false,
      forceNew: false,
      autoConnect: true
    })

    // SYSTEM LIFECYCLE ROUTERS
    socketInstance.on('connect', () => {
      console.log('[Socket.IO] ✅ Channel connection authorized.')
      console.log('[Socket.IO] Assignation ID:', socketInstance?.id)
      connectionAttempts = 0
    })

    socketInstance.on('connect_error', (error: any) => {
      console.error('[Socket.IO] ❌ Handshake error exception:', error.message)
      connectionAttempts++

      if (error.code === 'ERR_AUTH' || error.message?.includes('auth')) {
        console.error('[Socket.IO] Token rejected by server authority. Purging store state.')
        authStore.clearAuth?.()
      }
    })

    socketInstance.on('disconnect', (reason: string) => {
      console.log('[Socket.IO] ⚠️ Connection dropped. Reason context:', reason)
    })

    socketInstance.on('error', (error: any) => {
      console.error('[Socket.IO] ❌ Runtime internal error:', error)
    })

    socketInstance.on('auth_error', (error: any) => {
      console.error('[Socket.IO] ❌ Server session authorization fault:', error)
      authStore.clearAuth?.()
    })

    return socketInstance

  } catch (error: any) {
    console.error('[Socket.IO] ❌ Thread instantiation error:', error.message)
    return null
  }
}

