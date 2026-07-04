// ============================================================================
// FILE: /plugins/socket.client.ts
// Standardized on useUserStore as the Single Source of Truth.
// ============================================================================
import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null
let connectionAttempts = 0
const MAX_CONNECTION_ATTEMPTS = 5

export default defineNuxtPlugin({
  name: 'socialverse-socket-client',
  dependsOn: ['00-init-sequence'],

  async setup(nuxtApp) {
    if (!process.client) return

    console.log('[Socket.IO] Initializing lifecycle sequence...')

    try {
      // Standardized to useUserStore
      const { useUserStore } = await import('~/stores/user')
      const userStore = useUserStore()

      if (userStore.token) {
        console.log('[Socket.IO] ✅ Active session found. Triggering auto-connect...')
        await autoConnect()
      }
    } catch (error: any) {
      console.error('[Socket.IO] ❌ Core initialization exception:', error?.message)
    }

    return {
      provide: {
        socket: {
          async connect(): Promise<Socket | null> { return autoConnect() },
          getInstance(): Socket | null { return socketInstance },
          isConnected(): boolean { return socketInstance?.connected || false },
          
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
              socketInstance.emit(event, data)
            } else {
              console.warn('[Socket.IO] ⚠️ Transmission dropped. Socket offline:', event)
            }
          },

          on(event: string, callback: (data: any) => void): void {
            socketInstance?.on(event, callback)
          },

          off(event: string, callback?: (data: any) => void): void {
            socketInstance?.off(event, callback)
          },

          // --- DOMAIN HOOK IMPLEMENTATIONS ---
          joinChat(chatId: string): void { this.emit('join_chat', { chatId }) },
          leaveChat(chatId: string): void { this.emit('leave_chat', { chatId }) },
          sendMessage(chatId: string, message: string): void { this.emit('send_message', { chatId, message }) },
          sendTyping(chatId: string): void { this.emit('typing', { chatId }) },
          updatePresence(status: string, activity?: string): void { this.emit('update_presence', { status, activity }) },
          subscribeNotifications(types: string[]): void { this.emit('subscribe_notifications', { types }) },
          unsubscribeNotifications(types: string[]): void { this.emit('unsubscribe_notifications', { types }) },
          startStream(streamId: string, title: string): void { this.emit('start_stream', { streamId, title }) },
          endStream(streamId: string): void { this.emit('end_stream', { streamId }) },
          joinStream(streamId: string): void { this.emit('join_stream', { streamId }) },
          leaveStream(streamId: string): void { this.emit('leave_stream', { streamId }) },
          initiateCall(targetUserId: string, offer: any): void { this.emit('initiate_call', { targetUserId, offer }) },
          answerCall(targetUserId: string, answer: any): void { this.emit('answer_call', { targetUserId, answer }) },
          sendIceCandidate(targetUserId: string, candidate: any): void { this.emit('ice_candidate', { targetUserId, candidate }) },
          endCall(targetUserId: string): void { this.emit('end_call', { targetUserId }) }
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
    if (socketInstance?.connected) return socketInstance

    const { useUserStore } = await import('~/stores/user')
    const userStore = useUserStore()

    if (!userStore.token) return null

    const config = useRuntimeConfig()
    const socketUrl = config.public.socketUrl || window.location.origin

    socketInstance = io(socketUrl, {
      auth: { token: userStore.token, userId: userStore.userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: MAX_CONNECTION_ATTEMPTS,
      transports: ['websocket']
    })

    socketInstance.on('connect_error', (error: any) => {
      if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
        userStore.logout() // Standardized to the new unified logout
      }
    })

    return socketInstance
  } catch (error: any) {
    return null
  }
}
