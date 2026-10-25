import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { getStatusSettings, STATUS_DURATION_LIMITS } from '~/server/utils/status-settings'

/** Admin sets how long new statuses stay visible. Existing statuses keep their expiry. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'admin')
  const body = await readBody<{ duration_hours?: number | string }>(event)
  const hours = Number(body?.duration_hours)
  if (!Number.isFinite(hours) || hours < STATUS_DURATION_LIMITS.min || hours > STATUS_DURATION_LIMITS.max) {
    throw createError({ statusCode: 400, statusMessage: `Duration must be between ${STATUS_DURATION_LIMITS.min} and ${STATUS_DURATION_LIMITS.max} hours` })
  }
  const before = await getStatusSettings()
  const next = { duration_hours: Math.round(hours * 4) / 4 }
  const service = getServiceClient()
  const { data: existing } = await service.from('platform_configurations').select('id').eq('config_key', 'status_settings').maybeSingle()
  const { error } = existing
    ? await service.from('platform_configurations').update({ config_values: next, updated_at: new Date().toISOString() } as never).eq('id', existing.id)
    : await service.from('platform_configurations').insert({ config_key: 'status_settings', config_values: next } as never)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await logStaffAction(staff.id, 'status_settings_update', 'config', 'status_settings', { before, after: next })
  return next
})
