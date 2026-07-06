import { useSocket } from '~/composables/useSocket'

export default defineNuxtPlugin({
  name: 'socialverse-socket-client',
  dependsOn: ['00-init-sequence'],
  setup() {
    // Client-only plugin file already enforces this, but this guard is harmless.
    if (import.meta.server) return

    const socketStore = useSocket()

    // Initialize socket connection lifecycle.
    socketStore.initialize?.()

    // Optional: expose for direct access via `const { $socket } = useNuxtApp()`
    return {
      provide: {
        socket: socketStore
      }
    }
  }
})
