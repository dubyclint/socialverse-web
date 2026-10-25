import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { DEFAULT_VERIFICATION_FEES, getVerificationFees, type VerificationFees } from '~/server/utils/verification-fees'

/** Admins set verification badge fees; the T&C page reads them live. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'fees')
  const body = await readBody<Partial<Record<keyof VerificationFees, number | string | null>>>(event)
  const current = await getVerificationFees()
  const next = { ...current }
  for (const key of Object.keys(DEFAULT_VERIFICATION_FEES) as (keyof VerificationFees)[]) {
    if (!(key in (body ?? {}))) continue
    const raw = body[key]
    if (raw === null || raw === '') { next[key] = null; continue }
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0 || value > 100000) throw createError({ statusCode: 400, statusMessage: `Invalid fee for ${key}` })
    next[key] = Math.round(value * 100) / 100
  }
  const service = getServiceClient()
  const { data: existing } = await service.from('platform_configurations').select('id').eq('config_key', 'verification_fees').maybeSingle()
  const { error } = existing
    ? await service.from('platform_configurations').update({ config_values: next, updated_at: new Date().toISOString() } as never).eq('id', existing.id)
    : await service.from('platform_configurations').insert({ config_key: 'verification_fees', config_values: next } as never)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await logStaffAction(staff.id, 'verification_fees_update', 'config', 'verification_fees', { before: current, after: next })
  return { success: true, fees: next }
})
