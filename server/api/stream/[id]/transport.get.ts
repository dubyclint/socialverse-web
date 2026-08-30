import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { loadConfig } from '~/server/utils/platform-config'
import type { Database } from '~/types/database.types'

/**
 * Streaming transport. `mesh` publishes browser-to-browser and only suits small
 * rooms; `whip` hands ingest and playback to a WebRTC CDN (Cloudflare Stream,
 * Dolby, Cloudflare-compatible SFUs) which is what carries large audiences.
 */
export type StreamingConfig = {
  provider: 'mesh' | 'whip'
  whip_ingest_url: string
  whep_playback_url: string
  bearer_token: string
}

const DEFAULT_STREAMING: StreamingConfig = {
  provider: 'mesh',
  whip_ingest_url: '',
  whep_playback_url: '',
  bearer_token: ''
}

export interface StreamTransport {
  mode: 'mesh' | 'whip'
  ingestUrl?: string
  playbackUrl?: string
  token?: string
}

const withStreamKey = (template: string, streamKey: string, streamId: string) =>
  template.replace('{streamKey}', streamKey).replace('{streamId}', streamId)

export default defineEventHandler(async (event): Promise<{ success: boolean, data: StreamTransport }> => {
  const user = await requireAuth(event)
  const streamId = getRouterParam(event, 'id')
  if (!streamId) throw createError({ statusCode: 400, statusMessage: 'Stream id is required' })

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: stream, error } = await supabase
    .from('streams')
    .select('id, creator_id, stream_key')
    .eq('id', streamId)
    .single()

  if (error || !stream) throw createError({ statusCode: 404, statusMessage: 'Stream not found' })

  const config = await loadConfig<StreamingConfig>(supabase, 'streaming', DEFAULT_STREAMING)
  const isBroadcaster = stream.creator_id === user.id

  if (config.provider !== 'whip' || !config.whip_ingest_url || !config.whep_playback_url) {
    return { success: true, data: { mode: 'mesh' } }
  }

  return {
    success: true,
    data: {
      mode: 'whip',
      // The ingest URL embeds the stream key, so only the broadcaster receives it.
      ingestUrl: isBroadcaster
        ? withStreamKey(config.whip_ingest_url, stream.stream_key, stream.id)
        : undefined,
      playbackUrl: withStreamKey(config.whep_playback_url, stream.stream_key, stream.id),
      token: config.bearer_token || undefined
    }
  }
})
