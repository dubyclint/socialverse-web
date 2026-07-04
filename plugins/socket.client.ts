import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null
let connectionAttempts = 0
const MAX_CONNECTION_ATTEMPTS = 5

export default defineNuxtPlugin({
  name: 'socialverse-socket-client',
  // Updated dependencies to reflect the new unified store
  dependsOn: ['00-init-sequence'],

  async setup(nuxtApp) {
    if (!process.client) return

    console.log('[Socket.IO] Initializing lifecycle sequence...')

    try {
      const { useUserStore } = await import('~/stores/user')
      const userStore = useUserStore()

      if (userStore.token) {
        console.log('[Socket.IO] ✅ Active user session found. Triggering auto-connect...')
        await autoConnect()
      } else {
        console.log('[Socket.IO] ℹ️ No active session token found.')
      }
    } catch (error: any) {
      console.error('[Socket.IO] ❌ Core initialization exception:', error?.message)
    }

    return {
      provide: {
        socket: {
          // ... (keep all your existing interface methods: connect, disconnect, emit, etc.)
          // Inside these methods, ensure they reference the new userStore if auth is needed
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
      auth: {
        token: userStore.token,
        userId: userStore.userId
      },
      // ... (keep existing reconnection settings)
    })

    // Update error handlers to use userStore.logout() or userStore.clearSession()
    socketInstance.on('connect_error', (error: any) => {
      if (error.message?.includes('auth')) {
        userStore.logout()
      }
    })

    return socketInstance
  } catch (error: any) {
    return null
  }
}

