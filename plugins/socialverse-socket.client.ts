// ============================================================================
// FILE: /plugins/socialverse-socket.client.ts
// Standardized on useUserStore as the Single Source of Truth.
// Canonical Socket.IO plugin - registered explicitly in nuxt.config.ts.
// (Previously duplicated across socket.client.ts / socialverse-socket.client.ts;
// consolidated into this single file under the configured/documented name.)
// ============================================================================
import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { io, Socket } from 'socket.io-client'
import { ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import type { SupabaseClient } from '@supabase/supabase-js'

let socketInstance: Socket | null = null
let connecting: Promise<Socket | null> | null = null
let supabaseClient: SupabaseClient | null = null
let socketUrl = ''
let authRetries = 0
const MAX_CONNECTION_ATTEMPTS = 5
const connected = ref(false)

// Listeners registered before the socket exists (or surviving a reconnect that
// replaced the instance) are kept here and re-attached to every new instance.
const listeners = new Map<string, Set<(data: any) => void>>()

const attachListeners = (instance: Socket) => {
  for (const [event, handlers] of listeners) {
    for (const handler of handlers) instance.on(event, handler)
  }
}

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
    supabaseClient = useSupabaseClient()
    const config = useRuntimeConfig()
    // Inside the native shell the page origin is local, so the socket must
    // target the deployed site explicitly.
    socketUrl = String(
      config.public.socketUrl ||
      (Capacitor.isNativePlatform() ? config.public.siteUrl : window.location.origin)
    )
    const supabaseUser = useSupabaseUser()
    watch(supabaseUser, (current, previous) => {
      if (current && !previous) void autoConnect()
      if (!current && previous) disconnectSocket()
    })

    try {
      if (useSupabaseUser().value) {
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

      state: connected,
      disconnect(): void { disconnectSocket() },

      emit(event: string, data?: any, ack?: (response: any) => void): void {
        // Socket.IO buffers emits while (re)connecting, so only a missing
        // instance (signed out) drops the event.
        if (socketInstance) {
          if (ack) socketInstance.emit(event, data, ack)
          else socketInstance.emit(event, data)
        } else {
          ack?.({ success: false, error: 'Socket offline' })
        }
      },

      on(event: string, callback: (data: any) => void): void {
        const handlers = listeners.get(event) ?? new Set()
        if (handlers.has(callback)) return
        handlers.add(callback)
        listeners.set(event, handlers)
        socketInstance?.on(event, callback)
      },

      off(event: string, callback?: (data: any) => void): void {
        if (callback) listeners.get(event)?.delete(callback)
        else listeners.delete(event)
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
function disconnectSocket(): void {
  if (!socketInstance) return
  socketInstance.disconnect()
  socketInstance = null
  connected.value = false
}

function autoConnect(): Promise<Socket | null> {
  if (socketInstance) {
    if (!socketInstance.connected) socketInstance.connect()
    return Promise.resolve(socketInstance)
  }
  connecting ??= createSocket().finally(() => { connecting = null })
  return connecting
}

async function createSocket(): Promise<Socket | null> {
  const client = supabaseClient
  if (!client) return null
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return null

    const instance = io(socketUrl, {
      // Read on every (re)connect so a reconnect never presents an expired
      // access token; the server validates it against Supabase.
      auth: (cb) => {
        void client.auth.getSession().then(({ data }) =>
          cb({ token: data.session?.access_token, userId: data.session?.user.id })
        )
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      // Polling first, upgrading to websocket: a websocket-only client cannot
      // connect through proxies that do not upgrade.
      transports: ['polling', 'websocket']
    })

    socketInstance = instance
    attachListeners(instance)

    instance.on('connect', () => {
      connected.value = true
      authRetries = 0
    })
    instance.on('disconnect', () => { connected.value = false })
    instance.on('connect_error', (error: Error) => {
      connected.value = false
      console.warn('[Socket.IO] ⚠️ Connection error:', error.message)
      // Rejections by the auth middleware are not retried by Socket.IO itself.
      if (!instance.active && authRetries < MAX_CONNECTION_ATTEMPTS) {
        authRetries++
        setTimeout(() => { if (socketInstance === instance) instance.connect() }, 2000 * authRetries)
      }
    })

    return instance
  } catch {
    return null
  }
}
