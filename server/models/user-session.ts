// server/models/user-session.ts
// User Session Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface UserSession {
  id: string
  user_id: string
  token: string
  ip_address: string
  user_agent: string
  expires_at: string
  created_at: string
  last_activity: string
}

export interface CreateSessionInput {
  userId: string
  token: string
  ipAddress: string
  userAgent: string
  expiresAt: string
}

export class UserSessionModel {
  static async create(input: CreateSessionInput): Promise<UserSession> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: input.userId,
          token: input.token,
          ip_address: input.ipAddress,
          user_agent: input.userAgent,
          expires_at: input.expiresAt,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserSession
    } catch (error) {
      console.error('[UserSessionModel] Create error:', error)
      throw error
    }
  }

  static async getByToken(token: string): Promise<UserSession | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('token', token)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as UserSession) || null
    } catch (error) {
      console.error('[UserSessionModel] Get by token error:', error)
      throw error
    }
  }

  static async updateActivity(sessionId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId)
    } catch (error) {
      console.error('[UserSessionModel] Update activity error:', error)
      throw error
    }
  }

  static async revoke(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[UserSessionModel] Revoke error:', error)
      throw error
    }
  }

  static async revokeAll(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
    } catch (error) {
      console.error('[UserSessionModel] Revoke all error:', error)
      throw error
    }
  }

  static async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity', { ascending: false })

      if (error) throw error
      return (data as UserSession[]) || []
    } catch (error) {
      console.error('[UserSessionModel] Get user sessions error:', error)
      throw error
    }
  }
}

export default UserSessionModel
