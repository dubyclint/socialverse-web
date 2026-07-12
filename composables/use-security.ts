// ============================================================================
// FILE: /composables/use-security.ts
// Description: Composable managing user account session histories, logs, and termination states.
// ============================================================================
import { ref, computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { ApiResponse } from '~/types/api'

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
  sessions: Ref<readonly SecuritySession[]>
  securityEvents: Ref<readonly SecurityEvent[]>
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

  /**
   * Pull list of all current hardware authorization sessions associated with this user
   */
  const loadSessions = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<ApiResponse<{ sessions: SecuritySession[] }>>('/api/security/sessions')

      if (result.success && result.data) {
        sessions.value = result.data.sessions
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected failure occurred while syncing active sessions.'
      console.error('[useSecurity] Error loading sessions:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Revoke a single active authentication session block by its target identifier
   */
  const terminateSession = async (sessionId: string): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<ApiResponse<null>>(`/api/security/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (result.success) {
        await loadSessions()
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to terminate target device access context.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Force clean out all authentication records outside of the immediate active instance
   */
  const terminateAllSessions = async (): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<ApiResponse<null>>('/api/security/sessions/terminate-all', {
        method: 'POST'
      })

      if (result.success) {
        await loadSessions()
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to terminate secondary session logs.'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Sync complete historic operational audit trails
   */
  const loadSecurityEvents = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<ApiResponse<{ events: SecurityEvent[] }>>('/api/security/events')

      if (result.success && result.data) {
        securityEvents.value = result.data.events
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message || 'An anomaly occurred while building event trail histories.'
      console.error('[useSecurity] Error loading security events:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Pull structural numeric parameters regarding failure tracking flags
   */
  const getStatistics = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<ApiResponse<SecurityStatistics>>('/api/security/statistics')

      if (result.success && result.data) {
        statistics.value = result.data
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message || 'Error collecting security metric datasets.'
      console.error('[useSecurity] Error loading statistics:', err)
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
