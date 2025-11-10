// server/models/report.js - Supabase PostgreSQL Report Model
import { supabase } from '../utils/supabase.js';

export class Report {
  static async create(reportData) {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        reporter_id: reportData.reporterId,
        target_type: reportData.targetType,
        target_id: reportData.targetId,
        reason: reportData.reason,
        description: reportData.description,
        evidence_urls: reportData.evidenceUrls || []
      }])
      .select(`
        *,
        reporter:reporter_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async assignModerator(reportId, moderatorId) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        moderator_id: moderatorId,
        status: 'reviewed'
      })
      .eq('id', reportId)
      .select(`
        *,
        reporter:reporter_id(username, avatar_url),
        moderator:moderator_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async resolveReport(reportId, resolutionData) {
    const { data, error } = await supabase
      .from('reports')
      .update({
        status: 'resolved',
        moderator_notes: resolutionData.notes,
        action_taken: resolutionData.actionTaken,
        resolved_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select(`
        *,
        reporter:reporter_id(username, avatar_url),
        moderator:moderator_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getPendingReports() {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(username, avatar_url)
      `)
      .eq('status', 'pending')
      .order('created_at');

    if (error) throw error;
    return data;
  }

  static async getModeratorReports(moderatorId) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(username, avatar_url)
      `)
      .eq('moderator_id', moderatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getReportsByTarget(targetType, targetId) {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(username, avatar_url),
        moderator:moderator_id(username, avatar_url)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getReportStatistics() {
    const { data, error } = await supabase
      .from('reports')
      .select('reason, status, target_type, created_at');

    if (error) throw error;

    const stats = {
      total_reports: data.length,
      by_status: {},
      by_reason: {},
      by_target_type: {},
      resolved_count: data.filter(r => r.status === 'resolved').length
    };

    data.forEach(report => {
      // By status
      if (!stats.by_status[report.status]) {
        stats.by_status[report.status] = 0;
      }
      stats.by_status[report.status]++;

      // By reason
      if (!stats.by_reason[report.reason]) {
        stats.by_reason[report.reason] = 0;
      }
      stats.by_reason[report.reason]++;

      // By target type
      if (!stats.by_target_type[report.target_type]) {
        stats.by_target_type[report.target_type] = 0;
      }
      stats.by_target_type[report.target_type]++;
    });

    return stats;
  }
}
