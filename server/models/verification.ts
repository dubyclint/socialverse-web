// FILE: /server/models/verification.ts
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
export type VerificationType = 'EMAIL' | 'PHONE' | 'IDENTITY' | 'ADDRESS'

export interface Verification {
  id: string
  userId: string
  type: VerificationType
  value: string
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED'
  code?: string
  attempts: number
  maxAttempts: number
  expiresAt: string
  verifiedAt?: string
  createdAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class VerificationModel {
  static async createVerification(
    userId: string,
    type: VerificationType,
    value: string,
    code: string,
    expiresAt: string
  ): Promise<Verification> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('verifications')
        .insert({
          userId,
          type,
          value,
          code,
          status: 'PENDING',
          attempts: 0,
          maxAttempts: 5,
          expiresAt,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Verification
    } catch (error) {
      console.error('[VerificationModel] Error creating verification:', error)
      throw error
    }
  }

  static async getVerification(userId: string, type: VerificationType): Promise<Verification | null> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('userId', userId)
        .eq('type', type)
        .eq('status', 'PENDING')
        .gt('expiresAt', now)
        .single()

      if (error) {
        console.warn('[VerificationModel] Verification not found')
        return null
      }

      return data as Verification
    } catch (error) {
      console.error('[VerificationModel] Error fetching verification:', error)
      throw error
    }
  }

  static async verifyCode(id: string, code: string): Promise<Verification | null> {
    try {
      const supabase = await getSupabase()
      
      // Get verification
      const verification = await supabase
        .from('verifications')
        .select('*')
        .eq('id', id)
        .single()

      if (verification.error) throw verification.error

      const data = verification.data as any

      // Check if expired
      if (new Date(data.expiresAt) < new Date()) {
        throw new Error('Verification code expired')
      }

      // Check if max attempts exceeded
      if (data.attempts >= data.maxAttempts) {
        throw new Error('Max verification attempts exceeded')
      }

      // Check code
      if (data.code !== code) {
        // Increment attempts
        await supabase
          .from('verifications')
          .update({ attempts: data.attempts + 1 })
          .eq('id', id)

        return null
      }

      // Mark as verified
      const { data: updated, error } = await supabase
        .from('verifications')
        .update({
          status: 'VERIFIED',
          verifiedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated as Verification
    } catch (error) {
      console.error('[VerificationModel] Error verifying code:', error)
      throw error
    }
  }

  static async isVerified(userId: string, type: VerificationType): Promise<boolean> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('verifications')
        .select('id')
        .eq('userId', userId)
        .eq('type', type)
        .eq('status', 'VERIFIED')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return !!data
    } catch (error) {
      console.error('[VerificationModel] Error checking verification:', error)
      return false
    }
  }
}
