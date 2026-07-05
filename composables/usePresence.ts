// composables/usePresence.ts
export const usePresence = () => {
  const isOnline = ref(true)
  let heartbeatInterval: any = null

  const sendHeartbeat = async () => {
    if (document.visibilityState === 'visible') {
      // Send ping to your Redis-backed presence handler
      await $fetch('/api/presence/ping', { method: 'POST' })
    }
  }

  onMounted(() => {
    // Ping every 30 seconds
    heartbeatInterval = setInterval(sendHeartbeat, 30000)
    sendHeartbeat() // Send first immediately
  })

  onUnmounted(() => {
    clearInterval(heartbeatInterval)
  })

  return { isOnline }
}
