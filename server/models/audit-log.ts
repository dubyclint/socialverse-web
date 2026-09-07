// FILE: /server/models/audit-log.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null
import { getAdminClient } from '~/server/utils/supabase-server'

async function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = await getAdminClient()
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  changes: Record<string, any>
  ipAddress: string
  userAgent: string
  status: 'SUCCESS' | 'FAILURE'
  errorMessage?: string
  createdAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class AuditLogModel {
  static async log(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          ...log,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as AuditLog
    } catch (error) {
      console.error('[AuditLogModel] Error logging action:', error)
      throw error
    }
  }

  static async getUserLogs(userId: string, limit = 50, offset = 0): Promise<AuditLog[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as AuditLog[]
    } catch (error) {
      console.error('[AuditLogModel] Error fetching user logs:', error)
      throw error
    }
  }

  static async getResourceLogs(resource: string, resourceId: string, limit = 50): Promise<AuditLog[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource', resource)
        .eq('resourceId', resourceId)
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as AuditLog[]
    } catch (error) {
      console.error('[AuditLogModel] Error fetching resource logs:', error)
      throw error
    }
  }

  static async getFailedActions(limit = 50): Promise<AuditLog[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('status', 'FAILURE')
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as AuditLog[]
    } catch (error) {
      console.error('[AuditLogModel] Error fetching failed actions:', error)
      throw error
    }
  }
}

// Compatibility: alias `create` to `log` for older callers
export async function create(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
  return AuditLogModel.log(log)
}

// Ensure runtime shape matches older callers that expect AuditLogModel.create()
;(AuditLogModel as any).create = async function (log: any) {
  return AuditLogModel.log(log)
}

export const AuditLogModelRuntime: any = {
  create: (log: any) => AuditLogModel.log(log),
  log: AuditLogModel.log,
  getUserLogs: AuditLogModel.getUserLogs,
  getResourceLogs: AuditLogModel.getResourceLogs,
  getFailedActions: AuditLogModel.getFailedActions
}
