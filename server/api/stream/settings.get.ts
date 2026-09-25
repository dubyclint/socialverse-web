import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { DEFAULT_STREAM_SETTINGS, type StreamSettings } from '~/server/utils/stream-settings'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const { data: row, error } = await supabase
    .from('stream_settings')
    .select('settings')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const stored = (row?.settings ?? {}) as Partial<StreamSettings>

  return {
    success: true,
    data: {
      user_id: user.id,
      ...DEFAULT_STREAM_SETTINGS,
      ...stored
    }
  }
})
