// composables/useSecurity.js - Security Management Composable
import { ref, computed } from 'vue'

export const useSecurity = () => {
  const sessions = ref([])
  const securityEvents = ref([])
  const statistics = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const activeSessions = computed(() => 
    sessions.value.filter(session => session.is_active)
  )

  const currentSession = computed(() => 
    sessions.value.find(session => session.is_current)
  )

  /**
   * Load user sessions
   */
  const loadSessions = async () => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/security/sessions')

      if (result.success) {
        sessions.value = result.data.sessions
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading sessions:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Terminate a specific session
   */
  const terminateSession = async (sessionId) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch(`/api/security/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (result.success) {
        await loadSessions() // Reload sessions
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Terminate all sessions except current
   */
  const terminateAllSessions = async () => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/security/sessions/terminate-all', {
        method: 'POST'
      })

      if (result.success) {
        await loadSessions() // Reload sessions
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Load security events
   */
  const loadSecurityEvents = async (filters = {}) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const query = new URLSearchParams()
      
      if (filters.severity) query.append('severity', filters.severity)
      if (filters.eventType) query.append('eventType', filters.eventType)
      if (filters.limit) query.append('limit', filters.limit)

      const result = await $fetch(`/api/security/events?${query.toString()}`)

      if (result.success) {
        securityEvents.value = result.data.events
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading security events:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load security statistics
   */
  const loadStatistics = async (timeframe = '24h') => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch(`/api/security/statistics?timeframe=${timeframe}`)

      if (result.success) {
        statistics.value = result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading statistics:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get session display info
   */
  const getSessionInfo = (session) => {
    const deviceInfo = session.device_info || {}
    const userAgent = session.user_agent || ''
    
    // Parse browser and OS from user agent
    let browser = 'Unknown Browser'
    let os = 'Unknown OS'
    
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'
    
    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iOS')) os = 'iOS'

    return {
      browser,
      os,
      ip: session.ip_address,
      location: session.location_data?.city || 'Unknown Location',
      lastActivity: new Date(session.last_activity).toLocaleString(),
      created: new Date(session.created_at).toLocaleString(),
      isCurrent: session.is_current
    }
  }

  /**
   * Get event severity color
   */
  const getEventSeverityColor = (severity) => {
    const colors = {
      'INFO': 'blue',
      'WARNING': 'orange',
      'CRITICAL': 'red'
    }
    return colors[severity] || 'gray'
  }

  /**
   * Format event type for display
   */
  const formatEventType = (eventType) => {
    return eventType
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  return {
    // State
    sessions: readonly(sessions),
    securityEvents: readonly(securityEvents),
    statistics: readonly(statistics),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    activeSessions,
    currentSession,

    // Methods
    loadSessions,
    terminateSession,
    terminateAllSessions,
    loadSecurityEvents,
    loadStatistics,
    getSessionInfo,
    getEventSeverityColor,
    formatEventType
  }
}
