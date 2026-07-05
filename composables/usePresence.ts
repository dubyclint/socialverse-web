// composables/usePresence.ts
import { ref, onMounted, onUnmounted } from 'vue'

export const usePresence = () => {
  const isOnline = ref(true)
  const currentIntent = ref<string | null>(null)
  let heartbeatInterval: any = null

  /**
   * Sends a heartbeat to the server to update Redis presence status.
   * Also retrieves and updates the user's current intent.
   */
  const sendHeartbeat = async () => {
    // Only send pings if the user has the tab active
    if (document.visibilityState === 'visible') {
      try {
        const response: { success: boolean; intent?: string } = await $fetch('/api/presence/ping', {
          method: 'POST',
          body: { 
            lastActivity: Date.now() 
          }
        })
        
        if (response?.intent) {
          currentIntent.value = response.intent
        }
      } catch (error) {
        console.error('[usePresence] Heartbeat failed:', error)
      }
    }
  }

  onMounted(() => {
    // Ping every 30 seconds to maintain 60s TTL in Redis
    heartbeatInterval = setInterval(sendHeartbeat, 30000)
    
    // Initial immediate heartbeat
    sendHeartbeat()
  })

  onUnmounted(() => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
  })

  return { 
    isOnline, 
    currentIntent 
  }
}
