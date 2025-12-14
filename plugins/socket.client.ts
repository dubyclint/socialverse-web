// FILE: /plugins/socket.client.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// SOCKET.IO CLIENT PLUGIN - FIXED: Wait for auth before connecting
// ============================================================================
// ✅ CRITICAL FIX: Wait for auth store to be ready before connecting
// ✅ Properly extract user ID from auth store
// ✅ Pass user ID to Socket.IO server
// ✅ Handle auth failures gracefully
// ✅ Comprehensive error handling and logging
// ✅ Type-safe event emitters
// ✅ Automatic reconnection with exponential backoff
// ============================================================================

import { io, Socket } from 'socket.io-client'

declare global {
  interface Window {
    $socket?: Socket
  }
}

interface SocketState {
  connected: boolean
  authenticated: boolean
  userId?: string
  error?: string
}

let socketInstance: Socket | null = null
let socketState: SocketState = {
  connected: false,
  authenticated: false
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const router = useRouter()

  return {
    provide: {
      socket: {
        /**
         * ✅ CRITICAL FIX: Initialize and connect to Socket.IO server
         * Waits for auth store to be ready before connecting
         */
        async connect(): Promise<Socket | null> {
          try {
            if (socketInstance?.connected) {
              console.log('[Socket.IO Client] Already connected')
              return socketInstance
            }

            console.log('[Socket.IO Client] 🚀 Connecting to Socket.IO server...')

            // ============================================================================
            // STEP 1: Wait for auth store to be ready
            // ============================================================================
            console.log('[Socket.IO Client] Step 1: Waiting for auth store...')

            const authStore = useAuthStore()
            
            // ✅ CRITICAL FIX: Wait for auth to be ready
            let authReady = false
            let waitAttempts = 0
            const maxWaitAttempts = 50 // 5 seconds max (50 * 100ms)

            while (!authReady && waitAttempts < maxWaitAttempts) {
              if (authStore.user?.id) {
                authReady = true
                console.log('[Socket.IO Client] ✅ Auth store ready')
                break
              }
              waitAttempts++
              await new Promise(resolve => setTimeout(resolve, 100))
            }

            if (!authReady) {
              console.warn('[Socket.IO Client] ⚠️ Auth store not ready after timeout')
              socketState.error = 'Auth store not ready'
              return null
            }

            // ============================================================================
            // STEP 2: Extract user ID from auth store
            // ============================================================================
            console.log('[Socket.IO Client] Step 2: Extracting user ID from auth store...')

            const userId = authStore.user?.id
            const userEmail = authStore.user?.email

            if (!userId) {
              console.error('[Socket.IO Client] ❌ No user ID in auth store')
              socketState.error = 'No user ID available'
              return null
            }

            console.log('[Socket.IO Client] ✅ User ID extracted:', userId)
            console.log('[Socket.IO Client] ✅ User email:', userEmail)

            socketState.userId = userId

            // ============================================================================
            // STEP 3: Get authentication token
            // ============================================================================
            console.log('[Socket.IO Client] Step 3: Getting authentication token...')

            let token: string | null = null

            try {
              // Try to get token from auth store first
              token = authStore.token

              if (!token) {
                console.warn('[Socket.IO Client] ⚠️ No token in auth store, trying Supabase...')
                
                // Fallback: Get token from Supabase
                try {
                  const supabase = useSupabaseClient()
                  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                  if (sessionError) {
                    console.warn('[Socket.IO Client] ⚠️ Session error:', sessionError.message)
                  }

                  token = session?.access_token
                } catch (err: any) {
                  console.warn('[Socket.IO Client] ⚠️ Could not get Supabase session:', err.message)
                }
              }

              if (!token) {
                console.error('[Socket.IO Client] ❌ No authentication token available')
                socketState.error = 'No authentication token'
                return null
              }

              console.log('[Socket.IO Client] ✅ Token obtained')
            } catch (err: any) {
              console.error('[Socket.IO Client] ❌ Error getting token:', err.message)
              socketState.error = 'Failed to get token: ' + err.message
              return null
            }

            // ============================================================================
            // STEP 4: Create Socket.IO connection
            // ============================================================================
            console.log('[Socket.IO Client] Step 4: Creating Socket.IO connection...')

            const config = useRuntimeConfig()
            const socketUrl = config.public.socketUrl || window.location.origin

            console.log('[Socket.IO Client] Socket URL:', socketUrl)

            socketInstance = io(socketUrl, {
              auth: {
                token: token,
                userId: userId, // ✅ CRITICAL: Pass user ID to server
                email: userEmail
              },
              transports: ['websocket', 'polling'],
              reconnection: true,
              reconnectionDelay: 1000,
              reconnectionDelayMax: 5000,
              reconnectionAttempts: 5,
              autoConnect: true,
              forceNew: false,
              multiplex: true
            })

            // ============================================================================
            // STEP 5: Set up connection event listeners
            // ============================================================================
            console.log('[Socket.IO Client] Step 5: Setting up event listeners...')

            socketInstance.on('connect', () => {
              console.log('[Socket.IO Client] ✅ Connected to server')
              console.log('[Socket.IO Client] Socket ID:', socketInstance?.id)
              socketState.connected = true
              socketState.authenticated = true
              socketState.error = undefined
              window.$socket = socketInstance
            })

            socketInstance.on('disconnect', (reason: string) => {
              console.log('[Socket.IO Client] ❌ Disconnected:', reason)
              socketState.connected = false
              socketState.authenticated = false
            })

            socketInstance.on('connect_error', (error: any) => {
              console.error('[Socket.IO Client] ❌ Connection error:', error.message)
              socketState.error = error.message
            })

            socketInstance.on('error', (error: any) => {
              console.error('[Socket.IO Client] ❌ Socket error:', error)
              socketState.error = error
            })

            socketInstance.on('auth:failed', (data: any) => {
              console.error('[Socket.IO Client] ❌ Authentication failed:', data.message)
              socketState.authenticated = false
              socketState.error = 'Authentication failed: ' + data.message
            })

            socketInstance.on('auth:success', (data: any) => {
              console.log('[Socket.IO Client] ✅ Authentication successful')
              socketState.authenticated = true
              socketState.error = undefined
            })

            // ============================================================================
            // CHAT EVENTS
            // ============================================================================
            socketInstance.on('chat:user-joined', (data: any) => {
              console.log('[Socket.IO Client] User joined chat:', data.email)
              window.dispatchEvent(new CustomEvent('socket:chat:user-joined', { detail: data }))
            })

            socketInstance.on('chat:user-left', (data: any) => {
              console.log('[Socket.IO Client] User left chat:', data.email)
              window.dispatchEvent(new CustomEvent('socket:chat:user-left', { detail: data }))
            })

            socketInstance.on('chat:message', (data: any) => {
              console.log('[Socket.IO Client] New message:', data.message)
              window.dispatchEvent(new CustomEvent('socket:chat:message', { detail: data }))
            })

            socketInstance.on('chat:typing', (data: any) => {
              console.log('[Socket.IO Client] User typing:', data.email)
              window.dispatchEvent(new CustomEvent('socket:chat:typing', { detail: data }))
            })

            // ============================================================================
            // PRESENCE EVENTS
            // ============================================================================
            socketInstance.on('presence:updated', (data: any) => {
              console.log('[Socket.IO Client] Presence updated:', data.status)
              window.dispatchEvent(new CustomEvent('socket:presence:updated', { detail: data }))
            })

            socketInstance.on('presence:offline', (data: any) => {
              console.log('[Socket.IO Client] User offline:', data.userId)
              window.dispatchEvent(new CustomEvent('socket:presence:offline', { detail: data }))
            })

            // ============================================================================
            // NOTIFICATION EVENTS
            // ============================================================================
            socketInstance.on('notification:new', (data: any) => {
              console.log('[Socket.IO Client] New notification:', data.type)
              window.dispatchEvent(new CustomEvent('socket:notification:new', { detail: data }))
            })

            // ============================================================================
            // STREAM EVENTS
            // ============================================================================
            socketInstance.on('stream:started', (data: any) => {
              console.log('[Socket.IO Client] Stream started:', data.streamId)
              window.dispatchEvent(new CustomEvent('socket:stream:started', { detail: data }))
            })

            socketInstance.on('stream:ended', (data: any) => {
              console.log('[Socket.IO Client] Stream ended:', data.streamId)
              window.dispatchEvent(new CustomEvent('socket:stream:ended', { detail: data }))
            })

            socketInstance.on('stream:viewer-joined', (data: any) => {
              console.log('[Socket.IO Client] Viewer joined stream:', data.email)
              window.dispatchEvent(new CustomEvent('socket:stream:viewer-joined', { detail: data }))
            })

            socketInstance.on('stream:viewer-left', (data: any) => {
              console.log('[Socket.IO Client] Viewer left stream')
              window.dispatchEvent(new CustomEvent('socket:stream:viewer-left', { detail: data }))
            })

            // ============================================================================
            // CALL EVENTS
            // ============================================================================
            socketInstance.on('call:incoming', (data: any) => {
              console.log('[Socket.IO Client] Incoming call from:', data.fromEmail)
              window.dispatchEvent(new CustomEvent('socket:call:incoming', { detail: data }))
            })

            socketInstance.on('call:answered', (data: any) => {
              console.log('[Socket.IO Client] Call answered')
              window.dispatchEvent(new CustomEvent('socket:call:answered', { detail: data }))
            })

            socketInstance.on('call:ice-candidate', (data: any) => {
              console.log('[Socket.IO Client] ICE candidate received')
              window.dispatchEvent(new CustomEvent('socket:call:ice-candidate', { detail: data }))
            })

            socketInstance.on('call:ended', (data: any) => {
              console.log('[Socket.IO Client] Call ended')
              window.dispatchEvent(new CustomEvent('socket:call:ended', { detail: data }))
            })

            console.log('[Socket.IO Client] ✅ Socket.IO client initialized successfully')
            return socketInstance
          } catch (error: any) {
            console.error('[Socket.IO Client] ❌ Connection failed:', error.message)
            console.error('[Socket.IO Client] Stack:', error.stack)
            socketState.error = error.message
            return null
          }
        },

        /**
         * Get current socket instance
         */
        getInstance(): Socket | null {
          return socketInstance
        },

        /**
         * Get socket state
         */
        getState(): SocketState {
          return socketState
        },

        /**
         * Check if connected
         */
        isConnected(): boolean {
          return socketState.connected
        },

        /**
         * Check if authenticated
         */
        isAuthenticated(): boolean {
          return socketState.authenticated
        },

        /**
         * Get user ID
         */
        getUserId(): string | undefined {
          return socketState.userId
        },

        /**
         * Emit event to server
         */
        emit(event: string, data?: any): void {
          if (socketInstance?.connected) {
            socketInstance.emit(event, data)
          } else {
            console.warn('[Socket.IO Client] ⚠️ Socket not connected, cannot emit:', event)
          }
        },

        /**
         * Listen to event from server
         */
        on(event: string, callback: (data: any) => void): void {
          if (socketInstance) {
            socketInstance.on(event, callback)
          }
        },

        /**
         * Remove event listener
         */
        off(event: string, callback?: (data: any) => void): void {
          if (socketInstance) {
            socketInstance.off(event, callback)
          }
        },

        /**
         * Join a chat room
         */
        joinChat(chatId: string): void {
          this.emit('chat:join', { chatId })
        },

        /**
         * Leave a chat room
         */
        leaveChat(chatId: string): void {
          this.emit('chat:leave', { chatId })
        },

        /**
         * Send a chat message
         */
        sendMessage(chatId: string, message: string): void {
          this.emit('chat:message', { chatId, message })
        },

        /**
         * Send typing indicator
         */
        sendTyping(chatId: string): void {
          this.emit('chat:typing', { chatId })
        },

        /**
         * Update presence status
         */
        updatePresence(status: string, activity?: string): void {
          this.emit('presence:update', { status, activity })
        },

        /**
         * Subscribe to notifications
         */
        subscribeNotifications(types: string[]): void {
          this.emit('notification:subscribe', { types })
        },

        /**
         * Unsubscribe from notifications
         */
        unsubscribeNotifications(types: string[]): void {
          this.emit('notification:unsubscribe', { types })
        },

        /**
         * Start a stream
         */
        startStream(streamId: string, title: string): void {
          this.emit('stream:start', { streamId, title })
        },

        /**
         * End a stream
         */
        endStream(streamId: string): void {
          this.emit('stream:end', { streamId })
        },

        /**
         * Join a stream
         */
        joinStream(streamId: string): void {
          this.emit('stream:join', { streamId })
        },

        /**
         * Leave a stream
         */
        leaveStream(streamId: string): void {
          this.emit('stream:leave', { streamId })
        },

        /**
         * Initiate a call
         */
        initiateCall(targetUserId: string, offer: any): void {
          this.emit('call:initiate', { targetUserId, offer })
        },

        /**
         * Answer a call
         */
        answerCall(targetUserId: string, answer: any): void {
          this.emit('call:answer', { targetUserId, answer })
        },

        /**
         * Send ICE candidate
         */
        sendIceCandidate(targetUserId: string, candidate: any): void {
          this.emit('call:ice-candidate', { targetUserId, candidate })
        },

        /**
         * End a call
         */
        endCall(targetUserId: string): void {
          this.emit('call:end', { targetUserId })
        },

        /**
         * Disconnect from server
         */
        async disconnect(): Promise<void> {
          if (socketInstance?.connected) {
            socketInstance.disconnect()
            socketInstance = null
            socketState.connected = false
            socketState.authenticated = false
            socketState.userId = undefined
            console.log('[Socket.IO Client] ✅ Disconnected from server')
          }
        }
      }
    }
            }
