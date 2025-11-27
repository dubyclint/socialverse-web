// FILE: /server/models/match-request.ts
// REFACTORED: Lazy-loaded Supabase with Exported Wrapper Functions

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
export type MatchRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface MatchRequest {
  id: string
  senderId: string
  receiverId: string
  status: MatchRequestStatus
  message?: string
  expiresAt: string
  respondedAt?: string
  createdAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class MatchRequestModel {
  static async sendRequest(senderId: string, receiverId: string, message?: string): Promise<MatchRequest> {
    try {
      const supabase = await getSupabase()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

      const { data, error } = await supabase
        .from('match_requests')
        .insert({
          senderId,
          receiverId,
          message,
          status: 'PENDING',
          expiresAt,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as MatchRequest
    } catch (error) {
      console.error('[MatchRequestModel] Error sending request:', error)
      throw error
    }
  }

  static async getRequest(id: string): Promise<MatchRequest | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('match_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[MatchRequestModel] Request not found')
        return null
      }

      return data as MatchRequest
    } catch (error) {
      console.error('[MatchRequestModel] Error fetching request:', error)
      throw error
    }
  }

  static async getUserRequests(userId: string, status?: MatchRequestStatus): Promise<MatchRequest[]> {
    try {
      const supabase = await getSupabase()
      let query = supabase
        .from('match_requests')
        .select('*')
        .eq('receiverId', userId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('createdAt', { ascending: false })

      if (error) throw error
      return (data || []) as MatchRequest[]
    } catch (error) {
      console.error('[MatchRequestModel] Error fetching requests:', error)
      throw error
    }
  }

  static async respondToRequest(id: string, status: 'ACCEPTED' | 'REJECTED'): Promise<MatchRequest> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('match_requests')
        .update({
          status,
          respondedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MatchRequest
    } catch (error) {
      console.error('[MatchRequestModel] Error responding to request:', error)
      throw error
    }
  }

  static async getPendingRequests(userId: string): Promise<MatchRequest[]> {
    try {
      const supabase = await getSupabase()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('match_requests')
        .select('*')
        .eq('receiverId', userId)
        .eq('status', 'PENDING')
        .gt('expiresAt', now)
        .order('createdAt', { ascending: false })

      if (error) throw error
      return (data || []) as MatchRequest[]
    } catch (error) {
      console.error('[MatchRequestModel] Error fetching pending requests:', error)
      throw error
    }
  }
}

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new match request
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  requester_id: string
  target_user_id: string
  match_type?: string
  location?: string
  preferred_date?: string
  preferred_time?: string
  activity_type?: string
  message?: string
  budget_range?: string
}): Promise<MatchRequest> {
  return MatchRequestModel.sendRequest(
    data.requester_id,
    data.target_user_id,
    data.message
  )
}

/**
 * Find match request by ID
 */
export async function findById(id: string): Promise<MatchRequest | null> {
  return MatchRequestModel.getRequest(id)
}

/**
 * Update match request
 */
export async function update(
  id: string,
  updates: Partial<MatchRequest>
): Promise<MatchRequest> {
  if (updates.status) {
    const status = updates.status as 'ACCEPTED' | 'REJECTED'
    return MatchRequestModel.respondToRequest(id, status)
  }
  
  return MatchRequestModel.getRequest(id) as Promise<MatchRequest>
}

/**
 * Find pending match requests between two users
 */
export async function findPendingBetweenUsers(
  userId1: string,
  userId2: string
): Promise<MatchRequest | null> {
  const requests = await MatchRequestModel.getUserRequests(userId1, 'PENDING')
  return requests.find(r => r.senderId === userId2 || r.receiverId === userId2) || null
}

/**
 * Accept match request
 */
export async function accept(id: string): Promise<MatchRequest> {
  return MatchRequestModel.respondToRequest(id, 'ACCEPTED')
}

/**
 * Reject match request
 */
export async function reject(id: string): Promise<MatchRequest> {
  return MatchRequestModel.respondToRequest(id, 'REJECTED')
}

/**
 * Get pending requests for user
 */
export async function getPending(userId: string): Promise<MatchRequest[]> {
  return MatchRequestModel.getPendingRequests(userId)
}
