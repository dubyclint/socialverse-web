import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import type { Database } from '~/types/database.types'

const CONFIG_KEY = 'support_live_chat'

interface LiveChatConfig {
  label: string
  method: string
  script?: string
  url?: string
}

const readConfigs = async (
  client: Awaited<ReturnType<typeof serverSupabaseClient<Database>>>
): Promise<LiveChatConfig[]> => {
  const { data } = await client
    .from('platform_configurations')
    .select('config_values')
    .eq('config_key', CONFIG_KEY)
    .maybeSingle()

  return Array.isArray(data?.config_values) ? (data.config_values as unknown as LiveChatConfig[]) : []
}

const writeConfigs = async (
  client: Awaited<ReturnType<typeof serverSupabaseClient<Database>>>,
  configs: LiveChatConfig[]
) => {
  const { error } = await client
    .from('platform_configurations')
    .upsert(
      { config_key: CONFIG_KEY, config_values: configs as unknown as Database['public']['Tables']['platform_configurations']['Insert']['config_values'], updated_at: new Date().toISOString() },
      { onConflict: 'config_key' }
    )

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const method = getMethod(event)

  if (method === 'GET') {
    await requireAuth(event)
    return await readConfigs(client)
  }

  await requireAdmin(event)

  if (method === 'POST') {
    const body = await readBody<LiveChatConfig | LiveChatConfig[]>(event)
    const incoming = Array.isArray(body) ? body : [body]
    const existing = await readConfigs(client)
    const merged = [
      ...existing.filter(config => !incoming.some(next => next.label === config.label)),
      ...incoming
    ]
    await writeConfigs(client, merged)
    return { success: true, message: 'Live chat config saved.' }
  }

  if (method === 'DELETE') {
    const { label } = await readBody<{ label: string }>(event)
    const existing = await readConfigs(client)
    await writeConfigs(client, existing.filter(config => config.label !== label))
    return { success: true, message: 'Live chat config deleted.' }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
