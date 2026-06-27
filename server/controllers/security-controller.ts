// server/controllers/security-controller.ts - Security Management Controller
// ============================================================================

import type { H3Event } from 'h3'
import { getRouterParam, getQuery, readBody } from 'h3'
import { UserSession } from '../models/userSession'
import { SecurityEvent } from '../models/security-event'
import { SecurityRestriction } from '../models/security-restriction'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SessionData {
  id: string
  session_token: string
  user_id: string
  device_info: Record<string, any>
  ip_address: string
  is_active: boolean
  created_at: string
  last_activity: string
  is_current?: boolean
}

export interface SecurityResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

// ============================================================================
// SECURITY CONTROLLER
// ============================================================================

export class SecurityController {
  /**
   * Get user's active sessions
   * GET /api/security/sessions
   */
  static async getUserSessions(event: H3Event): Promise<SecurityResponse> {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      const sessions = await UserSession.findUserSessions(userId)
      const currentSessionToken = event.context.sessionToken

      // Mark current session and hide sensitive data
      const sessionsWithCurrent = sessions.map((session: SessionData) => ({
        ...session,
        is_current: session.session_token === currentSessionToken,
        session_token: session.session_token === currentSessionToken ? session.session_token : '***'
      }))

      return {
        success: true,
        data: {
          sessions: sessionsWithCurrent,
          total: sessions.length,
          active: sessions.filter((s: SessionData) => s.is_active).length
        }
      }
    } catch (error) {
      console.error('Error getting user sessions:', error)
      return {
        success: false,
        message: 'Error retrieving sessions'
      }
    }
  }

  /**
   * Terminate a specific session
   * DELETE /api/security/sessions/:sessionId
   */
  static async terminateSession(event: H3Event): Promise<SecurityResponse> {
    try {
      const userId = event.context.user?.id
      const sessionId = getRouterParam(event, 'sessionId')

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      const sessions = await UserSession.findUserSessions(userId, false)
      const targetSession = sessions.find((s: SessionData) => s.id === sessionId)

      if (!targetSession) {
        return {
          success: false,
          message: 'Session not found'
        }
      }

      await UserSession.terminate(targetSession.session_token, 'User requested termination', userId)

      await SecurityEvent.create({
        user_id: userId,
        event_type: 'session_terminated',
        severity: 'low',
        description: `Session ${sessionId} terminated by user`,
        metadata: { session_id: sessionId }
      })

      return {
        success: true,
        message: 'Session terminated successfully'
      }
    } catch (error) {
      console.error('Error terminating session:', error)
      return {
        success: false,
        message: 'Error terminating session'
      }
    }
  }

  /**
   * Terminate all sessions except current
   * POST /api/security/sessions/terminate-all
   */
  static async terminateAllSessions(event: H3Event): Promise<SecurityResponse> {
    try {
      const userId = event.context.user?.id
      const currentSessionToken = event.context.sessionToken

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      const result = await UserSession.terminateAllExcept(currentSessionToken, userId)

      await SecurityEvent.create({
        user_id: userId,
        event_type: 'all_sessions_terminated',
        severity: 'medium',
        description: 'All sessions except current terminated by user',
        metadata: { terminated_count: result.count }
      })

      return {
        success: true,
        message: `Terminated ${result.count} sessions`,
        data: result
      }
    } catch (error) {
      console.error('Error terminating all sessions:', error)
      return {
        success: false,
        message: 'Error terminating sessions'
      }
    }
  }

  /**
   * Get security events for user
   * GET /api/security/events
   */
  static async getSecurityEvents(event: H3Event): Promise<SecurityResponse> {
    try {
      const userId = event.context.user?.id
      const query = getQuery(event)
      const limit = parseInt(query.limit as string) || 50
      const offset = parseInt(query.offset as string) || 0

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      const events = await SecurityEvent.findByUserId(userId, limit, offset)

      return {
        success: true,
        data: {
          events,
          total: events.length
        }
      }
    } catch (error) {
      console.error('Error getting security events:', error)
      return {
        success: false,
        message: 'Error retrieving security events'
      }
    }
  }

  /**
   * Add security restriction
   * POST /api/security/restrictions
   */
  static async addRestriction(event: H3Event): Promise<SecurityResponse> {
    try {
      const userId = event.context.user?.id
      const body = await readBody(event)
      const { restriction_type, reason, duration } = body

      if (!userId) {
        return {
          success: false,
          message: 'Authentication required'
        }
      }

      const restriction = await SecurityRestriction.create({
        user_id: userId,
        restriction_type,
        reason,
        duration,
        created_at: new Date().toISOString()
      })

      return {
        success: true,
        data: restriction,
        message: 'Restriction added successfully'
      }
    } catch (error) {
      console.error('Error adding restriction:', error)
      return {
        success: false,
        message: 'Error adding restriction'
      }
    }
  }
}
