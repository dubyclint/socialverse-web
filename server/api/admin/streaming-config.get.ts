import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import { loadConfig } from '~/server/utils/platform-config'
import type { Database } from '~/types/database.types'
import { DEFAULT_STREAMING } from '~/server/api/stream/[id]/transport.get'
import type { StreamingConfig } from '~/server/api/stream/[id]/transport.get'

export default defineEventHandler(async (event): Promise<{ success: boolean, data: StreamingConfig, status: { cloudflareConfigured: boolean, turnConfigured: boolean } }> => {
  await requireAdmin(event)
  const supabase = await serverSupabaseClient<Database>(event)
  const cfg = useRuntimeConfig(event)
  const env = (key: string, fallback: unknown) => String(fallback || process.env[key] || '')
  return {
    success: true,
    data: await loadConfig(supabase, 'streaming', DEFAULT_STREAMING),
    status: {
      cloudflareConfigured: Boolean(env('CLOUDFLARE_ACCOUNT_ID', cfg.cloudflareAccountId) && env('CLOUDFLARE_STREAM_TOKEN', cfg.cloudflareStreamToken)),
      turnConfigured: Boolean((env('CLOUDFLARE_TURN_KEY_ID', cfg.cloudflareTurnKeyId) && env('CLOUDFLARE_TURN_API_TOKEN', cfg.cloudflareTurnApiToken)) || (env('TURN_URLS', cfg.turnUrls) && env('TURN_USERNAME', cfg.turnUsername)))
    }
  }
})
