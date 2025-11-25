// server/models/verified-badge.ts
// Verified Badge Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type BadgeStatus = 'pending' | 'approved' | 'rejected'

export interface VerifiedBadge {
  id: string
  user_id: string
  badge_type: string
  status: BadgeStatus
  social_link?: string
  document_url?: string
  verified_at?: string
  rejected_reason?: string
  created_at: string
  updated_at: string
}

export interface CreateBadgeInput {
  userId: string
  badgeType: string
  socialLink?: string
  documentUrl?: string
}

export class VerifiedBadgeModel {
  static async create(input: CreateBadgeInput): Promise<VerifiedBadge> {
    try {
      const { data, error } = await supabase
        .from('verified_badges')
        .insert({
          user_id: input.userId,
          badge_type: input.badgeType,
          social_link: input.socialLink,
          document_url: input.documentUrl,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as VerifiedBadge
    } catch (error) {
      console.error('[VerifiedBadgeModel] Create error:', error)
      throw error
    }
  }

  static async getByUserId(userId: string): Promise<VerifiedBadge | null> {
    try {
      const { data, error } = await supabase
        .from('verified_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as VerifiedBadge) || null
    } catch (error) {
      console.error('[VerifiedBadgeModel] Get by user ID error:', error)
      throw error
    }
  }

  static async approve(badgeId: string): Promise<VerifiedBadge> {
    try {
      const { data, error } = await supabase
        .from('verified_badges')
        .update({
          status: 'approved',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', badgeId)
        .select()
        .single()

      if (error) throw error
      return data as VerifiedBadge
    } catch (error) {
      console.error('[VerifiedBadgeModel] Approve error:', error)
      throw error
    }
  }

  static async reject(badgeId: string, reason: string): Promise<VerifiedBadge> {
    try {
      const { data, error } = await supabase
        .from('verified_badges')
        .update({
          status: 'rejected',
          rejected_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', badgeId)
        .select()
        .single()

      if (error) throw error
      return data as VerifiedBadge
    } catch (error) {
      console.error('[VerifiedBadgeModel] Reject error:', error)
      throw error
    }
  }

  static async getPending(limit: number = 50): Promise<VerifiedBadge[]> {
    try {
      const { data, error } = await supabase
        .from('verified_badges')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data as VerifiedBadge[]) || []
    } catch (error) {
      console.error('[VerifiedBadgeModel] Get pending error:', error)
      throw error
    }
  }

  static async isVerified(userId: string): Promise<boolean> {
    try {
      const badge = await this.getByUserId(userId)
      return !!badge
    } catch (error) {
      console.error('[VerifiedBadgeModel] Is verified error:', error)
      return false
    }
  }
}

export default VerifiedBadgeModel
