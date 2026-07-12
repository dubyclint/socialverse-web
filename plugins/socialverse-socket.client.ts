// ============================================================================
// FILE: /plugins/socialverse-socket.client.ts
// Standardized on useUserStore as the Single Source of Truth.
// Canonical Socket.IO plugin - registered explicitly in nuxt.config.ts.
// (Previously duplicated across socket.client.ts / socialverse-socket.client.ts;
// consolidated into this single file under the configured/documented name.)
// ============================================================================
import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null
const MAX_CONNECTION_ATTEMPTS = 5

export default defineNuxtPlugin({
  name: 'socialverse-socket-client',
  dependsOn: ['00-init-sequence'],

  async setup(_nuxtApp: any) {
    // NOTE: no `if (!process.client) return` guard here (unlike several sibling
    // `.client.ts` plugins) - Nuxt's `.client.ts` filename suffix already
    // guarantees this file only runs in the browser, so the guard would be
    // dead code. It's omitted specifically in this file because a bare early
    // `return` combined with the `return { provide: { socket } }` below made
    // TS infer this function's return type as `Promise<{...} | undefined>`,
    // which doesn't structurally match Nuxt's `Plugin<T>` expected signature
    // (TS2322). Every other call site in the setup body always falls through
    // to the final `return`, so removing the guard is behavior-neutral.
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

    // Built as a named local const (rather than an inline object literal returned
    // directly) so the domain-hook methods below can call `socket.emit(...)`
    // instead of `this.emit(...)`. Referencing `this` inside object-literal
    // methods that are themselves part of a `defineNuxtPlugin` return value
    // confuses TS's contextual `this` inference (it falls back to `{}`), which
    // surfaced as "Property 'emit' does not exist on type '{}'" once `#app`
    // started resolving to Nuxt's real `Plugin<T>` typing. Calling `socket.emit`
    // works because the reference is inside a deferred closure - by the time any
    // of these methods actually run, `socket` has finished initializing.
    const socket = {
      async connect(): Promise<Socket | null> { return autoConnect() },
      getInstance(): Socket | null { return socketInstance },
      isConnected(): boolean { return socketInstance?.connected || false },

      disconnect(): void {
        if (socketInstance) {
          socketInstance.disconnect()
          socketInstance = null
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
      joinChat(chatId: string): void { socket.emit('join_chat', { chatId }) },
      leaveChat(chatId: string): void { socket.emit('leave_chat', { chatId }) },
      sendMessage(chatId: string, message: string): void { socket.emit('send_message', { chatId, message }) },
      sendTyping(chatId: string): void { socket.emit('typing', { chatId }) },
      updatePresence(status: string, activity?: string): void { socket.emit('update_presence', { status, activity }) },
      subscribeNotifications(types: string[]): void { socket.emit('subscribe_notifications', { types }) },
      unsubscribeNotifications(types: string[]): void { socket.emit('unsubscribe_notifications', { types }) },
      startStream(streamId: string, title: string): void { socket.emit('start_stream', { streamId, title }) },
      endStream(streamId: string): void { socket.emit('end_stream', { streamId }) },
      joinStream(streamId: string): void { socket.emit('join_stream', { streamId }) },
      leaveStream(streamId: string): void { socket.emit('leave_stream', { streamId }) },
      initiateCall(targetUserId: string, offer: any): void { socket.emit('initiate_call', { targetUserId, offer }) },
      answerCall(targetUserId: string, answer: any): void { socket.emit('answer_call', { targetUserId, answer }) },
      sendIceCandidate(targetUserId: string, candidate: any): void { socket.emit('ice_candidate', { targetUserId, candidate }) },
      endCall(targetUserId: string): void { socket.emit('end_call', { targetUserId }) }
    }

    return { provide: { socket } }
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
