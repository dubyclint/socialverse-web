import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import { loadConfig } from '~/server/utils/platform-config'
import type { Database } from '~/types/database.types'
import { DEFAULT_STREAMING } from '~/server/api/stream/[id]/transport.get'
import type { StreamingConfig } from '~/server/api/stream/[id]/transport.get'

export default defineEventHandler(async (event): Promise<{ success: boolean, data: StreamingConfig }> => {
  await requireAdmin(event)
  const supabase = await serverSupabaseClient<Database>(event)
  return { success: true, data: await loadConfig(supabase, 'streaming', DEFAULT_STREAMING) }
})
