// server/models/security-event.ts
// Security Event Model - Track security events

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type EventType = 'login' | 'logout' | 'password_change' | 'email_change' | 'suspicious_activity' | 'failed_login'

export interface SecurityEvent {
  id: string
  user_id: string
  event_type: EventType
  ip_address: string
  user_agent: string
  description: string
  created_at: string
}

export interface CreateSecurityEventInput {
  userId: string
  eventType: EventType
  ipAddress: string
  userAgent: string
  description: string
}

export class SecurityEventModel {
  static async create(input: CreateSecurityEventInput): Promise<SecurityEvent> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .insert({
          user_id: input.userId,
          event_type: input.eventType,
          ip_address: input.ipAddress,
          user_agent: input.userAgent,
          description: input.description,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SecurityEvent
    } catch (error) {
      console.error('[SecurityEventModel] Create error:', error)
      throw error
    }
  }

  static async getUserEvents(userId: string, limit: number = 50): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as SecurityEvent[]) || []
    } catch (error) {
      console.error('[SecurityEventModel] Get user events error:', error)
      throw error
    }
  }

  static async getRecentSuspiciousActivity(userId: string, hours: number = 24): Promise<SecurityEvent[]> {
    try {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - hours)

      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'suspicious_activity')
        .gt('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as SecurityEvent[]) || []
    } catch (error) {
      console.error('[SecurityEventModel] Get recent suspicious activity error:', error)
      throw error
    }
  }
}

export default SecurityEventModel
