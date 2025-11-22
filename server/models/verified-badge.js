// server/models/verified-badge.js - Supabase PostgreSQL Verified Badge Model
import { supabase } from '../utils/supabase.js';

export class VerifiedBadge {
  static async submitApplication(applicationData) {
    const { data, error } = await supabase
      .from('verified_badges')
      .insert([{
        user_id: applicationData.userId,
        badge_type: applicationData.badgeType,
        application_data: applicationData.applicationData,
        documents_urls: applicationData.documentsUrls || []
      }])
      .select(`
        *,
        profiles:user_id(username, avatar_url, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async reviewApplication(applicationId, reviewData) {
    const { data, error } = await supabase
      .from('verified_badges')
      .update({
        status: reviewData.status,
        reviewer_id: reviewData.reviewerId,
        review_notes: reviewData.notes,
        approved_at: reviewData.status === 'approved' ? new Date().toISOString() : null,
        expires_at: reviewData.status === 'approved' ? reviewData.expiresAt : null
      })
      .eq('id', applicationId)
      .select(`
        *,
        profiles:user_id(username, avatar_url, email),
        reviewer:reviewer_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Update user's verified status if approved
    if (reviewData.status === 'approved') {
      await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', data.user_id);
    }

    return data;
  }

  static async getUserBadges(userId) {
    const { data, error } = await supabase
      .from('verified_badges')
      .select(`
        *,
        reviewer:reviewer_id(username, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getPendingApplications(reviewerId = null) {
    let query = supabase
      .from('verified_badges')
      .select(`
        *,
        profiles:user_id(username, avatar_url, email, reputation_score)
      `)
      .eq('status', 'pending');

    if (reviewerId) {
      query = query.eq('reviewer_id', reviewerId);
    }

    query = query.order('created_at');

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getApplicationById(id) {
    const { data, error } = await supabase
      .from('verified_badges')
      .select(`
        *,
        profiles:user_id(username, avatar_url, email, reputation_score, total_trades),
        reviewer:reviewer_id(username, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async assignReviewer(applicationId, reviewerId) {
    const { data, error } = await supabase
      .from('verified_badges')
      .update({ reviewer_id: reviewerId })
      .eq('id', applicationId)
      .select(`
        *,
        profiles:user_id(username, avatar_url),
        reviewer:reviewer_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getVerificationStatistics() {
    const { data, error } = await supabase
      .from('verified_badges')
      .select('badge_type, status, created_at');

    if (error) throw error;

    const stats = {
      total_applications: data.length,
      pending: data.filter(b => b.status === 'pending').length,
      approved: data.filter(b => b.status === 'approved').length,
      rejected: data.filter(b => b.status === 'rejected').length,
      by_type: {}
    };

    data.forEach(badge => {
      if (!stats.by_type[badge.badge_type]) {
        stats.by_type[badge.badge_type] = {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        };
      }
      stats.by_type[badge.badge_type].total++;
      stats.by_type[badge.badge_type][badge.status]++;
    });

    return stats;
  }

  static async renewBadge(badgeId, newExpiryDate) {
    const { data, error } = await supabase
      .from('verified_badges')
      .update({ expires_at: newExpiryDate })
      .eq('id', badgeId)
      .eq('status', 'approved')
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
