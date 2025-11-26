// FILE: /server/models/stream.ts
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
export interface Stream {
  id: string
  userId: string
  title: string
  description?: string
  streamUrl: string
  thumbnailUrl?: string
  status: 'LIVE' | 'OFFLINE' | 'SCHEDULED'
  viewerCount: number
  startedAt?: string
  endedAt?: string
  scheduledAt?: string
  createdAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class StreamModel {
  static async createStream(
    userId: string,
    title: string,
    streamUrl: string,
    description?: string,
    thumbnailUrl?: string,
    scheduledAt?: string
  ): Promise<Stream> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('streams')
        .insert({
          userId,
          title,
          description,
          streamUrl,
          thumbnailUrl,
          status: scheduledAt ? 'SCHEDULED' : 'OFFLINE',
          viewerCount: 0,
          scheduledAt,
          createdAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Stream
    } catch (error) {
      console.error('[StreamModel] Error creating stream:', error)
      throw error
    }
  }

  static async getStream(id: string): Promise<Stream | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[StreamModel] Stream not found')
        return null
      }

      return data as Stream
    } catch (error) {
      console.error('[StreamModel] Error fetching stream:', error)
      throw error
    }
  }

  static async getUserStreams(userId: string, limit = 50): Promise<Stream[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as Stream[]
    } catch (error) {
      console.error('[StreamModel] Error fetching user streams:', error)
      throw error
    }
  }

  static async getLiveStreams(limit = 50): Promise<Stream[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'LIVE')
        .order('viewerCount', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as Stream[]
    } catch (error) {
      console.error('[StreamModel] Error fetching live streams:', error)
      throw error
    }
  }

  static async startStream(id: string): Promise<Stream> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('streams')
        .update({
          status: 'LIVE',
          startedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Stream
    } catch (error) {
      console.error('[StreamModel] Error starting stream:', error)
      throw error
    }
  }

  static async endStream(id: string): Promise<Stream> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('streams')
        .update({
          status: 'OFFLINE',
          endedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Stream
    } catch (error) {
      console.error('[StreamModel] Error ending stream:', error)
      throw error
    }
  }

  static async updateViewerCount(id: string, count: number): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('streams')
        .update({ viewerCount: count })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[StreamModel] Error updating viewer count:', error)
      throw error
    }
  }
}
