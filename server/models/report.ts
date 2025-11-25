// server/models/report.ts
// Report Model - User/content reporting

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ReportType = 'user' | 'post' | 'comment' | 'content'
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fraud' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  reporter_id: string
  reported_id?: string
  report_type: ReportType
  reason: ReportReason
  description: string
  status: ReportStatus
  created_at: string
  updated_at: string
}

export interface CreateReportInput {
  reporterId: string
  reportedId?: string
  reportType: ReportType
  reason: ReportReason
  description: string
}

export class ReportModel {
  static async create(input: CreateReportInput): Promise<Report> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: input.reporterId,
          reported_id: input.reportedId,
          report_type: input.reportType,
          reason: input.reason,
          description: input.description,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Report
    } catch (error) {
      console.error('[ReportModel] Create error:', error)
      throw error
    }
  }

  static async getPending(limit: number = 50): Promise<Report[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data as Report[]) || []
    } catch (error) {
      console.error('[ReportModel] Get pending error:', error)
      throw error
    }
  }

  static async resolve(reportId: string): Promise<Report> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error
      return data as Report
    } catch (error) {
      console.error('[ReportModel] Resolve error:', error)
      throw error
    }
  }

  static async dismiss(reportId: string): Promise<Report> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .update({
          status: 'dismissed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error
      return data as Report
    } catch (error) {
      console.error('[ReportModel] Dismiss error:', error)
      throw error
    }
  }
}

export default ReportModel
