import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'
import type { StreamingConfig } from '~/server/api/stream/[id]/transport.get'

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  await requireAdmin(event)
  const body = await readBody<Partial<StreamingConfig>>(event)

  const provider = body.provider === 'whip' ? 'whip' : 'mesh'
  const ingest = (body.whip_ingest_url ?? '').trim()
  const playback = (body.whep_playback_url ?? '').trim()

  if (provider === 'whip' && (!ingest || !playback)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A media server needs both a WHIP ingest URL and a WHEP playback URL'
    })
  }

  const values: StreamingConfig = {
    provider,
    whip_ingest_url: ingest,
    whep_playback_url: playback,
    bearer_token: (body.bearer_token ?? '').trim()
  }

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { error } = await supabase
    .from('platform_configurations')
    .upsert({
      config_key: 'streaming',
      config_values: values,
      updated_at: new Date().toISOString()
    }, { onConflict: 'config_key' })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true }
})
