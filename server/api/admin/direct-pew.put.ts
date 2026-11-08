import { createError, readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireWalletAdmin } from '~/server/utils/wallet'

/** Sets the warning text, or a per-user direct PEW limit by @username (limit null removes the override). */
export default defineEventHandler(async (event) => {
  const admin = await requireWalletAdmin(event)
  const body = await readBody<{ warning?: string, username?: string, limit?: number | null }>(event)
  const db = getServiceClient()

  if (typeof body?.warning === 'string') {
    const warning = body.warning.trim().slice(0, 300)
    const { error } = await db.from('platform_configurations')
      .upsert({ config_key: 'direct_pew_settings', config_values: { warning } }, { onConflict: 'config_key' })
    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (body?.username) {
    const { data: u } = await db.from('user').select('user_id').eq('username', body.username.replace(/^@/, '').trim()).maybeSingle()
    if (!u) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    if (body.limit === null || body.limit === undefined) {
      await db.from('direct_pew_limits' as never).delete().eq('user_id', u.user_id)
    } else {
      const limit = Number(body.limit)
      if (!Number.isFinite(limit) || limit < 0) throw createError({ statusCode: 400, statusMessage: 'Limit must be 0 or more' })
      const { error } = await db.from('direct_pew_limits' as never)
        .upsert({ user_id: u.user_id, limit_pew: limit, updated_by: admin.id, updated_at: new Date().toISOString() } as never)
      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    }
  }
  return { ok: true }
})
