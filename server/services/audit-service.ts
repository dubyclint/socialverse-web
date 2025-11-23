// server/services/audit-service.ts
// ============================================================================
// AUDIT SERVICE - TYPESCRIPT CONVERSION
// ============================================================================

import { supabase } from '~/server/utils/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuditLogEntry {
  id?: string
  type: string
  userId: string
  feature: string
  result: 'allowed' | 'denied'
  reason?: string
  context?: Record<string, any>
  policies?: string[]
  timestamp?: string
  ip?: string
  userAgent?: string
  country?: string
  region?: string
}

export interface ComplianceCheckData {
  userId: string
  feature: string
  result: 'allowed' | 'denied'
  reason?: string
  context?: Record<string, any>
  policies?: string[]
}

export class AuditService {
  private batchSize: number = 100
  private flushInterval: number = 30000 // 30 seconds
  private pendingLogs: AuditLogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    this.startBatchProcessor()
  }

  /**
   * Log compliance check
   */
  async logComplianceCheck(data: ComplianceCheckData): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        type: 'COMPLIANCE_CHECK',
        userId: data.userId,
        feature: data.feature,
        result: data.result,
        reason: data.reason,
        context: data.context,
        policies: data.policies || [],
        timestamp: new Date().toISOString(),
        ip: data.context?.ip,
        userAgent: data.context?.userAgent,
        country: data.context?.country,
        region: data.context?.region
      }

      this.addToBatch(logEntry)
    } catch (error: any) {
      console.error('Error logging compliance check:', error)
    }
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    adminId: string,
    action: string,
    targetId: string,
    targetType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        type: 'ADMIN_ACTION',
        userId: adminId,
        feature: action,
        result: 'allowed',
        context: {
          targetId,
          targetType,
          ...metadata
        },
        timestamp: new Date().toISOString()
      }

      this.addToBatch(logEntry)
    } catch (error: any) {
      console.error('Error logging admin action:', error)
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const logEntry: AuditLogEntry = {
        type: 'SECURITY_EVENT',
        userId,
        feature: eventType,
        result: 'allowed',
        context: {
          severity,
          ...details
        },
        timestamp: new Date().toISOString()
      }

      this.addToBatch(logEntry)
    } catch (error: any) {
      console.error('Error logging security event:', error)
    }
  }

  /**
   * Add log to batch
   */
  private addToBatch(logEntry: AuditLogEntry): void {
    this.pendingLogs.push(logEntry)

    if (this.pendingLogs.length >= this.batchSize) {
      this.flushBatch()
    }
  }

  /**
   * Start batch processor
   */
  private startBatchProcessor(): void {
    this.flushTimer = setInterval(() => {
      if (this.pendingLogs.length > 0) {
        this.flushBatch()
      }
    }, this.flushInterval)
  }

  /**
   * Flush batch to database
   */
  private async flushBatch(): Promise<void> {
    if (this.pendingLogs.length === 0) return

    try {
      const logsToFlush = [...this.pendingLogs]
      this.pendingLogs = []

      const { error } = await supabase
        .from('audit_logs')
        .insert(logsToFlush)

      if (error) throw error

      console.log(`Flushed ${logsToFlush.length} audit logs`)
    } catch (error: any) {
      console.error('Error flushing audit logs:', error)
      // Re-add logs to pending if flush failed
      this.pendingLogs.push(...this.pendingLogs)
    }
  }

  /**
   * Get audit logs
   */
  async getLogs(
    filters?: {
      userId?: string
      feature?: string
      type?: string
      startDate?: string
      endDate?: string
    },
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    try {
      let query = supabase.from('audit_logs').select('*')

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters?.feature) {
        query = query.eq('feature', filters.feature)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate)
      }

      const { data, error } = await query
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error getting audit logs:', error)
      return []
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    if (this.pendingLogs.length > 0) {
      this.flushBatch()
    }
  }
}

export const auditService = new AuditService()
