import { getServiceClient } from '~/server/utils/supabase-admin'
import type { Database } from '~/types/database.types'

export type StreamBroadcastState = Database['public']['Enums']['stream_broadcast_state']
export type StreamRow = Database['public']['Tables']['streams']['Row']

const randomStreamKey = () =>
  `sv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`

export class StreamModel {
  static async createStream(
    creatorId: string,
    title: string,
    _streamUrl = '',
    description?: string
  ): Promise<StreamRow> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('streams')
      .insert({
        creator_id: creatorId,
        title,
        description: description ?? null,
        stream_key: randomStreamKey(),
        broadcast_status: 'PREPARING',
        current_viewer_count: 0,
        peak_viewer_count: 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getStream(id: string): Promise<StreamRow | null> {
    const supabase = getServiceClient()
    const { data, error } = await supabase.from('streams').select('*').eq('id', id).maybeSingle()

    if (error) throw error
    return data
  }

  static async getUserStreams(creatorId: string, limit = 50): Promise<StreamRow[]> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data ?? []
  }

  static async getLiveStreams(limit = 50): Promise<StreamRow[]> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .eq('broadcast_status', 'LIVE')
      .order('current_viewer_count', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data ?? []
  }

  static async startStream(id: string): Promise<StreamRow> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('streams')
      .update({ broadcast_status: 'LIVE', started_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async endStream(id: string): Promise<StreamRow> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('streams')
      .update({
        broadcast_status: 'ENDED',
        ended_at: new Date().toISOString(),
        current_viewer_count: 0
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateViewerCount(id: string, count: number): Promise<void> {
    const supabase = getServiceClient()
    const { data: current, error: readError } = await supabase
      .from('streams')
      .select('peak_viewer_count')
      .eq('id', id)
      .maybeSingle()

    if (readError) throw readError

    const { error } = await supabase
      .from('streams')
      .update({
        current_viewer_count: count,
        peak_viewer_count: Math.max(count, current?.peak_viewer_count ?? 0)
      })
      .eq('id', id)

    if (error) throw error
  }
}
