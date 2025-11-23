// composables/use-security.ts
import { ref, computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'

interface SecuritySession {
  id: string
  is_active: boolean
  is_current: boolean
  device: string
  location: string
  ip_address: string
  created_at: string
  last_activity: string
}

interface SecurityEvent {
  id: string
  event_type: string
  description: string
  timestamp: string
  ip_address: string
  device: string
}

interface SecurityStatistics {
  total_sessions: number
  active_sessions: number
  failed_login_attempts: number
  last_login: string
}

interface SecurityReturn {
  sessions: Ref<SecuritySession[]>
  securityEvents: Ref<SecurityEvent[]>
  statistics: Ref<SecurityStatistics | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  activeSessions: ComputedRef<SecuritySession[]>
  currentSession: ComputedRef<SecuritySession | undefined>
  loadSessions: () => Promise<void>
  terminateSession: (sessionId: string) => Promise<any>
  terminateAllSessions: () => Promise<any>
  loadSecurityEvents: () => Promise<void>
  getStatistics: () => Promise<void>
}

export const useSecurity = (): SecurityReturn => {
  const sessions = ref<SecuritySession[]>([])
  const securityEvents = ref<SecurityEvent[]>([])
  const statistics = ref<SecurityStatistics | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeSessions = computed(() =>
    sessions.value.filter(session => session.is_active)
  )

  const currentSession = computed(() =>
    sessions.value.find(session => session.is_current)
  )

  const loadSessions = async (): Promise<void> => {
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
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading sessions:', err)
    } finally {
      loading.value = false
    }
  }

  const terminateSession = async (sessionId: string): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch(`/api/security/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (result.success) {
        await loadSessions()
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const terminateAllSessions = async (): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/security/sessions/terminate-all', {
        method: 'POST'
      })

      if (result.success) {
        await loadSessions()
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadSecurityEvents = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/security/events')

      if (result.success) {
        securityEvents.value = result.data.events
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading security events:', err)
    } finally {
      loading.value = false
    }
  }

  const getStatistics = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/security/statistics')

      if (result.success) {
        statistics.value = result.data.statistics
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading statistics:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    sessions: readonly(sessions),
    securityEvents: readonly(securityEvents),
    statistics: readonly(statistics),
    loading: readonly(loading),
    error: readonly(error),
    activeSessions,
    currentSession,
    loadSessions,
    terminateSession,
    terminateAllSessions,
    loadSecurityEvents,
    getStatistics
  }
}

