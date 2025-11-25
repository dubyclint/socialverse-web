// server/models/security-restriction.ts
// Security Restriction Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type RestrictionType = 'account_lock' | 'ip_ban' | 'rate_limit' | 'content_restriction'

export interface SecurityRestriction {
  id: string
  user_id: string
  restriction_type: RestrictionType
  reason: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface CreateRestrictionInput {
  userId: string
  restrictionType: RestrictionType
  reason: string
  expiresAt: string
}

export class SecurityRestrictionModel {
  static async create(input: CreateRestrictionInput): Promise<SecurityRestriction> {
    try {
      const { data, error } = await supabase
        .from('security_restrictions')
        .insert({
          user_id: input.userId,
          restriction_type: input.restrictionType,
          reason: input.reason,
          expires_at: input.expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SecurityRestriction
    } catch (error) {
      console.error('[SecurityRestrictionModel] Create error:', error)
      throw error
    }
  }

  static async getActive(userId: string): Promise<SecurityRestriction[]> {
    try {
      const { data, error } = await supabase
        .from('security_restrictions')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())

      if (error) throw error
      return (data as SecurityRestriction[]) || []
    } catch (error) {
      console.error('[SecurityRestrictionModel] Get active error:', error)
      throw error
    }
  }

  static async remove(restrictionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('security_restrictions')
        .delete()
        .eq('id', restrictionId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[SecurityRestrictionModel] Remove error:', error)
      throw error
    }
  }
}

export default SecurityRestrictionModel
