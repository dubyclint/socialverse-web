// FILE: /server/models/report.ts
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
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'FRAUD' | 'OTHER'
export type ReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'

export interface Report {
  id: string
  reporterId: string
  reportedUserId?: string
  reportedContentId?: string
  contentType: 'USER' | 'POST' | 'COMMENT' | 'MESSAGE'
  reason: ReportReason
  description: string
  status: ReportStatus
  resolution?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class ReportModel {
  static async createReport(
    reporterId: string,
    contentType: 'USER' | 'POST' | 'COMMENT' | 'MESSAGE',
    reason: ReportReason,
    description: string,
    reportedUserId?: string,
    reportedContentId?: string
  ): Promise<Report> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporterId,
          reportedUserId,
          reportedContentId,
          contentType,
          reason,
          description,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Report
    } catch (error) {
      console.error('[ReportModel] Error creating report:', error)
      throw error
    }
  }

  static async getReport(id: string): Promise<Report | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[ReportModel] Report not found')
        return null
      }

      return data as Report
    } catch (error) {
      console.error('[ReportModel] Error fetching report:', error)
      throw error
    }
  }

  static async getPendingReports(limit = 50): Promise<Report[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'PENDING')
        .order('createdAt', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data || []) as Report[]
    } catch (error) {
      console.error('[ReportModel] Error fetching pending reports:', error)
      throw error
    }
  }

  static async updateReportStatus(id: string, status: ReportStatus, resolution?: string): Promise<Report> {
    try {
      const supabase = await getSupabase()
      const updates: any = {
        status,
        updatedAt: new Date().toISOString()
      }

      if (resolution) {
        updates.resolution = resolution
      }

      if (status === 'RESOLVED') {
        updates.resolvedAt = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Report
    } catch (error) {
      console.error('[ReportModel] Error updating report:', error)
      throw error
    }
  }

  static async getUserReports(userId: string, limit = 50): Promise<Report[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('reporterId', userId)
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as Report[]
    } catch (error) {
      console.error('[ReportModel] Error fetching user reports:', error)
      throw error
    }
  }
}
