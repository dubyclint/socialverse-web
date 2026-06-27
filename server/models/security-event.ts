// FILE: /server/models/security-event.ts
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
export type SecurityEventType = 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'DEVICE_ADDED'

export interface SecurityEvent {
  id: string
  userId: string
  eventType: SecurityEventType
  ipAddress: string
  userAgent: string
  location?: string
  deviceInfo?: Record<string, any>
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  acknowledged: boolean
  createdAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class SecurityEventModel {
  static async recordEvent(
    userId: string,
    eventType: SecurityEventType,
    ipAddress: string,
    userAgent: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: string,
    location?: string,
    deviceInfo?: Record<string, any>
  ): Promise<SecurityEvent> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('security_events')
        .insert({
          userId,
          eventType,
          ipAddress,
          userAgent,
          location,
          deviceInfo,
          severity,
          description,
          acknowledged: false,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SecurityEvent
    } catch (error) {
      console.error('[SecurityEventModel] Error recording event:', error)
      throw error
    }
  }

  static async getUserEvents(userId: string, limit = 50, offset = 0): Promise<SecurityEvent[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as SecurityEvent[]
    } catch (error) {
      console.error('[SecurityEventModel] Error fetching user events:', error)
      throw error
    }
  }

  static async getUnacknowledgedEvents(userId: string): Promise<SecurityEvent[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('userId', userId)
        .eq('acknowledged', false)
        .order('createdAt', { ascending: false })

      if (error) throw error
      return (data || []) as SecurityEvent[]
    } catch (error) {
      console.error('[SecurityEventModel] Error fetching unacknowledged events:', error)
      throw error
    }
  }

  static async acknowledgeEvent(id: string): Promise<SecurityEvent> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('security_events')
        .update({ acknowledged: true })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SecurityEvent
    } catch (error) {
      console.error('[SecurityEventModel] Error acknowledging event:', error)
      throw error
    }
  }

  static async getCriticalEvents(limit = 20): Promise<SecurityEvent[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('severity', 'CRITICAL')
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as SecurityEvent[]
    } catch (error) {
      console.error('[SecurityEventModel] Error fetching critical events:', error)
      throw error
    }
  }
}
