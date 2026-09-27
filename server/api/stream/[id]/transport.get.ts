import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { loadConfig } from '~/server/utils/platform-config'
import { createCloudflareLiveInput } from '~/server/utils/streaming/cloudflare'
import type { Database } from '~/types/database.types'

/**
 * Streaming transport. `mesh` publishes browser-to-browser and only suits small
 * rooms. `whip` points at any WHIP/WHEP media server, and `cloudflare`
 * provisions a Cloudflare Stream live input per broadcast so the edge, rather
 * than the broadcaster's uplink, carries the audience.
 */
export type StreamingConfig = {
  provider: 'mesh' | 'whip' | 'cloudflare'
  whip_ingest_url: string
  whep_playback_url: string
  bearer_token: string
}

export const DEFAULT_STREAMING: StreamingConfig = {
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
    .select('id, title, creator_id, stream_key, provider_input_id, ingest_url, playback_url')
    .eq('id', streamId)
    .single()

  if (error || !stream) throw createError({ statusCode: 404, statusMessage: 'Stream not found' })

  const config = await loadConfig(supabase, 'streaming', DEFAULT_STREAMING)
  const isBroadcaster = stream.creator_id === user.id

  if (config.provider === 'cloudflare') {
    const { cloudflareAccountId, cloudflareStreamToken } = useRuntimeConfig(event)

    if (!cloudflareAccountId || !cloudflareStreamToken) {
      // No credentials means no edge fan-out; mesh keeps small rooms working.
      return { success: true, data: { mode: 'mesh' } }
    }

    let ingestUrl = stream.ingest_url
    let playbackUrl = stream.playback_url

    if (!playbackUrl) {
      if (!isBroadcaster) return { success: true, data: { mode: 'mesh' } }

      const input = await createCloudflareLiveInput(
        cloudflareAccountId,
        cloudflareStreamToken,
        `${stream.title} (${stream.id})`
      )
      ingestUrl = input.ingestUrl
      playbackUrl = input.playbackUrl

      const admin = serverSupabaseServiceRole<Database>(event)
      const { error: updateError } = await admin
        .from('streams')
        .update({
          media_provider: 'cloudflare',
          provider_input_id: input.inputId,
          ingest_url: input.ingestUrl,
          playback_url: input.playbackUrl
        })
        .eq('id', stream.id)

      if (updateError) throw createError({ statusCode: 500, statusMessage: updateError.message })
    }

    return {
      success: true,
      data: {
        mode: 'whip',
        ingestUrl: isBroadcaster ? ingestUrl ?? undefined : undefined,
        playbackUrl: playbackUrl ?? undefined
      }
    }
  }

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
