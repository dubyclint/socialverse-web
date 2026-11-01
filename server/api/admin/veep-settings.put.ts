import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { DEFAULT_VEEP, getVeepSettings, type VeepSettings } from '~/server/utils/veep'

const LIMITS: Record<keyof VeepSettings, [number, number]> = {
  standard_s: [1, 600], engaged_s: [1, 3600], high_s: [10, 86400], monetize_views: [1, 100000000], monetize_days: [1, 365]
}

/** Admin: Veep view-tier thresholds and monetization target. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { data: me } = await getServiceClient().from('user').select('role').eq('user_id', user.id).maybeSingle()
  if (!['admin', 'manager'].includes(String(me?.role))) throw createError({ statusCode: 403, statusMessage: 'Admins and managers only' })
  const body = await readBody<Partial<Record<keyof VeepSettings, unknown>>>(event)
  const next = await getVeepSettings()
  for (const k of Object.keys(DEFAULT_VEEP) as (keyof VeepSettings)[]) {
    if (body?.[k] === undefined) continue
    const v = Number(body[k]); const [min, max] = LIMITS[k]
    if (!Number.isFinite(v) || v < min || v > max) throw createError({ statusCode: 400, statusMessage: `${k} must be between ${min} and ${max}` })
    next[k] = v
  }
  if (!(next.standard_s < next.engaged_s && next.engaged_s < next.high_s)) throw createError({ statusCode: 400, statusMessage: 'Thresholds must increase: standard < engaged < high' })
  const { error } = await getServiceClient().from('platform_configurations').upsert({ config_key: 'veep_settings', config_values: next } as never, { onConflict: 'config_key' })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return next
})
