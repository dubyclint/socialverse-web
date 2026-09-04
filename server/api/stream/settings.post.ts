import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { DEFAULT_STREAM_SETTINGS, type StreamSettings } from '~/server/utils/stream-settings'
import type { Database, Json } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody<Partial<StreamSettings>>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  if (body.bitrate !== undefined && (body.bitrate < 500 || body.bitrate > 5000)) {
    throw createError({ statusCode: 400, statusMessage: 'Bitrate must be between 500 and 5000 kbps' })
  }
  if (body.frameRate !== undefined && ![24, 30, 60].includes(body.frameRate)) {
    throw createError({ statusCode: 400, statusMessage: 'Frame rate must be 24, 30, or 60' })
  }
  if (body.micVolume !== undefined && (body.micVolume < 0 || body.micVolume > 100)) {
    throw createError({ statusCode: 400, statusMessage: 'Microphone volume must be between 0 and 100' })
  }
  if (body.slowModeDelay !== undefined && (body.slowModeDelay < 1 || body.slowModeDelay > 60)) {
    throw createError({ statusCode: 400, statusMessage: 'Slow mode delay must be between 1 and 60 seconds' })
  }

  const { data: existing } = await supabase
    .from('stream_settings')
    .select('settings')
    .eq('user_id', user.id)
    .maybeSingle()

  const merged: StreamSettings = {
    ...DEFAULT_STREAM_SETTINGS,
    ...((existing?.settings ?? {}) as Partial<StreamSettings>),
    ...body
  }

  const { error } = await supabase
    .from('stream_settings')
    .upsert(
      {
        user_id: user.id,
        settings: merged as unknown as Json,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    )

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, data: { user_id: user.id, ...merged }, message: 'Settings saved successfully' }
})
