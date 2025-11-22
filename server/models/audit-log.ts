import { supabase } from '~/server/utils/database'

export interface AuditLog {
  id: string
  type: string
  userId: string
  feature: string
  result: 'ALLOWED' | 'DENIED'
  reason?: string
  context: Record<string, any>
  policies: string[]
  ip?: string
  userAgent?: string
  country?: string
  region?: string
  timestamp: string
}

export class AuditLogModel {
  static async create(logData: Omit<AuditLog, 'id' | 'timestamp'>) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([
        {
          type: logData.type,
          user_id: logData.userId,
          feature: logData.feature,
          result: logData.result,
          reason: logData.reason,
          context: logData.context,
          policies: logData.policies,
          ip: logData.ip,
          user_agent: logData.userAgent,
          country: logData.country,
          region: logData.region,
          timestamp: new Date().toISOString()
        }
      ])
      .select()
      .single()
    if (error) throw error
    return data as AuditLog
  }

  static async batchInsert(logs: Omit<AuditLog, 'id' | 'timestamp'>[]) {
    const logsWithTimestamp = logs.map(log => ({
      type: log.type,
      user_id: log.userId,
      feature: log.feature,
      result: log.result,
      reason: log.reason,
      context: log.context,
      policies: log.policies,
      ip: log.ip,
      user_agent: log.userAgent,
      country: log.country,
      region: log.region,
      timestamp: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('audit_logs')
      .insert(logsWithTimestamp)

    if (error) throw error
  }

  static async getByUserId(userId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data as AuditLog[]
  }

  static async getByFeature(feature: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('feature', feature)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data as AuditLog[]
  }

  static async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return data as AuditLog[]
  }
}
