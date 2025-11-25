// server/models/verification.ts
// Verification Model - Email/Phone verification

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type VerificationType = 'email' | 'phone' | 'identity'
export type VerificationStatus = 'pending' | 'verified' | 'failed' | 'expired'

export interface Verification {
  id: string
  user_id: string
  type: VerificationType
  value: string
  code: string
  status: VerificationStatus
  attempts: number
  expires_at: string
  verified_at?: string
  created_at: string
}

export interface CreateVerificationInput {
  userId: string
  type: VerificationType
  value: string
  code: string
  expiresAt: string
}

export class VerificationModel {
  static async create(input: CreateVerificationInput): Promise<Verification> {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .insert({
          user_id: input.userId,
          type: input.type,
          value: input.value,
          code: input.code,
          status: 'pending',
          attempts: 0,
          expires_at: input.expiresAt,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Verification
    } catch (error) {
      console.error('[VerificationModel] Create error:', error)
      throw error
    }
  }

  static async verify(verificationId: string, code: string): Promise<Verification | null> {
    try {
      const { data: verification, error: fetchError } = await supabase
        .from('verifications')
        .select('*')
        .eq('id', verificationId)
        .single()

      if (fetchError) throw fetchError

      if (verification.code !== code) {
        await supabase
          .from('verifications')
          .update({ attempts: verification.attempts + 1 })
          .eq('id', verificationId)
        return null
      }

      const { data, error } = await supabase
        .from('verifications')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', verificationId)
        .select()
        .single()

      if (error) throw error
      return data as Verification
    } catch (error) {
      console.error('[VerificationModel] Verify error:', error)
      throw error
    }
  }

  static async getPending(userId: string, type: VerificationType): Promise<Verification | null> {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as Verification) || null
    } catch (error) {
      console.error('[VerificationModel] Get pending error:', error)
      throw error
    }
  }

  static async isVerified(userId: string, type: VerificationType): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('status', 'verified')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return !!data
    } catch (error) {
      console.error('[VerificationModel] Is verified error:', error)
      return false
    }
  }
}

export default VerificationModel
