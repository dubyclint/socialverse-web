import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')
  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('supported_assets')
    .select('*')
    .order('kind')
    .order('sort_order')
    .order('code')

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const enabledCrypto = (data ?? []).filter((a) => a.kind === 'CRYPTO' && a.is_enabled).length
  return { assets: data ?? [], enabledCrypto, cryptoLimit: 20 }
})
