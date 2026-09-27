import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'

// The `support_contacts` table holds user-submitted tickets; the published
// support channels are platform configuration, so they live here.
const CONFIG_KEY = 'support_channels'

interface SupportChannel {
  label: string
  value: string
  type: string
  region: string
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const method = getMethod(event)

  if (method === 'GET') {
    await requireAuth(event)
    const { data, error } = await client
      .from('platform_configurations')
      .select('config_values')
      .eq('config_key', CONFIG_KEY)
      .maybeSingle()

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return Array.isArray(data?.config_values) ? (data.config_values as unknown as SupportChannel[]) : []
  }

  if (method === 'POST') {
    await requireAdmin(event)
    const channels = await readBody<SupportChannel[]>(event)

    const { error } = await client
      .from('platform_configurations')
      .upsert(
        {
          config_key: CONFIG_KEY,
          config_values: channels as unknown as Database['public']['Tables']['platform_configurations']['Insert']['config_values'],
          updated_at: new Date().toISOString()
        },
        { onConflict: 'config_key' }
      )

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return { success: true, message: 'Support contacts updated.' }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
