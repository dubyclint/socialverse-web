// FILE: /server/models/user-session.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface UserSession {
  id: string
  userId: string
  token: string
  ipAddress: string
  userAgent: string
  expiresAt: string
  createdAt: string
  lastActivityAt: string
}

export interface CreateSessionInput {
  userId: string
  token: string
  ipAddress: string
  userAgent: string
  expiresAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class UserSessionModel {
  static async create(input: CreateSessionInput): Promise<UserSession> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          userId: input.userId,
          token: input.token,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          expiresAt: input.expiresAt,
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as UserSession
    } catch (error) {
      console.error('[UserSessionModel] Error creating session:', error)
      throw error
    }
  }

  static async getSession(token: string): Promise<UserSession | null> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('token', token)
        .gt('expiresAt', now)
        .single()

      if (error) {
        console.warn('[UserSessionModel] Session not found or expired')
        return null
      }

      return data as UserSession
    } catch (error) {
      console.error('[UserSessionModel] Error fetching session:', error)
      throw error
    }
  }

  static async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('userId', userId)
        .gt('expiresAt', now)
        .order('lastActivityAt', { ascending: false })

      if (error) throw error
      return (data || []) as UserSession[]
    } catch (error) {
      console.error('[UserSessionModel] Error fetching user sessions:', error)
      throw error
    }
  }

  static async updateActivity(token: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('user_sessions')
        .update({ lastActivityAt: new Date().toISOString() })
        .eq('token', token)

      if (error) throw error
    } catch (error) {
      console.error('[UserSessionModel] Error updating activity:', error)
      throw error
    }
  }

  static async revokeSession(token: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('token', token)

      if (error) throw error
    } catch (error) {
      console.error('[UserSessionModel] Error revoking session:', error)
      throw error
    }
  }

  static async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('userId', userId)

      if (error) throw error
    } catch (error) {
      console.error('[UserSessionModel] Error revoking all sessions:', error)
      throw error
    }
  }
}
