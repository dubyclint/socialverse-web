import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { getLiveEligibility } from '~/server/utils/live-access'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type Action = 'grant' | 'deny' | 'auto' | 'reset_trial'

export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'compliance')
  const body = await readBody<{ userId?: string, action?: Action, note?: string }>(event)
  const userId = body?.userId ?? ''
  const action = body?.action
  if (!UUID_RE.test(userId)) throw createError({ statusCode: 400, statusMessage: 'Invalid user' })
  if (!action || !['grant', 'deny', 'auto', 'reset_trial'].includes(action)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
  }

  const service = getServiceClient()
  const { data: existing } = await service.from('live_access' as never).select('override, trial_reset_at').eq('user_id', userId).maybeSingle()
  const current = existing as { override?: string, trial_reset_at?: string | null } | null
  const row = {
    user_id: userId,
    override: action === 'grant' ? 'granted' : action === 'deny' ? 'denied' : action === 'auto' ? 'auto' : current?.override ?? 'auto',
    trial_reset_at: action === 'reset_trial' ? new Date().toISOString() : current?.trial_reset_at ?? null,
    note: body?.note?.trim().slice(0, 300) || null,
    updated_by: staff.id,
    updated_at: new Date().toISOString()
  }
  const { error } = await service.from('live_access' as never).upsert(row as never, { onConflict: 'user_id' })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  if (action === 'deny') {
    await service.from('streams').update({ broadcast_status: 'ENDED', ended_at: new Date().toISOString(), current_viewer_count: 0 })
      .eq('creator_id', userId).eq('broadcast_status', 'LIVE')
  }
  await logStaffAction(staff.id, `live_access_${action}`, 'user', userId, { note: row.note })
  return { success: true, eligibility: await getLiveEligibility(userId) }
})
