import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import type { LiveRules } from '~/server/utils/live-access'

const LIMITS: Record<keyof LiveRules, [number, number]> = {
  trial_minutes: [0, 1440],
  min_followers: [0, 100_000_000],
  min_account_days: [0, 3650],
  min_pew_added: [0, 100_000_000],
  min_pew_received: [0, 100_000_000],
  min_active_days: [0, 3650],
  min_transactions: [0, 1_000_000],
  window_days: [1, 3650]
}

export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'compliance')
  const body = await readBody<Partial<Record<keyof LiveRules, unknown>>>(event)
  const patch: Partial<LiveRules> = {}
  for (const key of Object.keys(LIMITS) as (keyof LiveRules)[]) {
    if (body?.[key] === undefined) continue
    const value = Number(body[key])
    const [min, max] = LIMITS[key]
    if (!Number.isFinite(value) || value < min || value > max) {
      throw createError({ statusCode: 400, statusMessage: `${key} must be between ${min} and ${max}` })
    }
    patch[key] = value
  }
  const { data, error } = await getServiceClient().from('live_access_rules' as never)
    .update({ ...patch, updated_at: new Date().toISOString() } as never).eq('id', true).select('*').single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await logStaffAction(staff.id, 'live_rules_update', 'live_access_rules', 'global', patch)
  return { rules: data }
})
