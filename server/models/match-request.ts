// server/models/match-request.ts
// Match Request Model - User matching system

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface MatchRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: MatchStatus
  message?: string
  created_at: string
  updated_at: string
  expires_at: string
}

export interface CreateMatchRequestInput {
  requesterId: string
  recipientId: string
  message?: string
}

export class MatchRequestModel {
  static async create(input: CreateMatchRequestInput): Promise<MatchRequest> {
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data, error } = await supabase
        .from('match_requests')
        .insert({
          requester_id: input.requesterId,
          recipient_id: input.recipientId,
          message: input.message,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as MatchRequest
    } catch (error) {
      console.error('[MatchRequestModel] Create error:', error)
      throw error
    }
  }

  static async accept(matchId: string): Promise<MatchRequest> {
    try {
      const { data, error } = await supabase
        .from('match_requests')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      return data as MatchRequest
    } catch (error) {
      console.error('[MatchRequestModel] Accept error:', error)
      throw error
    }
  }

  static async reject(matchId: string): Promise<MatchRequest> {
    try {
      const { data, error } = await supabase
        .from('match_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single()

      if (error) throw error
      return data as MatchRequest
    } catch (error) {
      console.error('[MatchRequestModel] Reject error:', error)
      throw error
    }
  }

  static async getPending(recipientId: string, limit: number = 50): Promise<MatchRequest[]> {
    try {
      const { data, error } = await supabase
        .from('match_requests')
        .select('*')
        .eq('recipient_id', recipientId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as MatchRequest[]) || []
    } catch (error) {
      console.error('[MatchRequestModel] Get pending error:', error)
      throw error
    }
  }

  static async getAccepted(userId: string, limit: number = 50): Promise<MatchRequest[]> {
    try {
      const { data, error } = await supabase
        .from('match_requests')
        .select('*')
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as MatchRequest[]) || []
    } catch (error) {
      console.error('[MatchRequestModel] Get accepted error:', error)
      throw error
    }
  }
}

export default MatchRequestModel
