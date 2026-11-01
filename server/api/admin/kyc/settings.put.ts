import { readBody } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { logStaffAction, requireStaff } from '~/server/utils/staff'
import { getKycSettings } from '~/server/utils/kyc'

/** KYC fee (PEW) and the sentence applicants hold in their photo. */
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event, 'verification')
  const body = await readBody<{ fee_pew?: number, sentence?: string }>(event)
  const current = await getKycSettings()
  const fee = body?.fee_pew === undefined ? current.fee_pew : Number(body.fee_pew)
  if (!Number.isFinite(fee) || fee < 0 || fee > 10000) throw createError({ statusCode: 400, statusMessage: 'Fee must be 0–10000 PEW' })
  const sentence = body?.sentence === undefined ? current.sentence : String(body.sentence).trim().slice(0, 600)
  if (sentence.length < 20) throw createError({ statusCode: 400, statusMessage: 'Sentence is too short' })
  const next = { fee_pew: fee, sentence }
  const db = getServiceClient()
  const { data: existing } = await db.from('platform_configurations').select('id').eq('config_key', 'kyc_settings').maybeSingle()
  const { error } = existing
    ? await db.from('platform_configurations').update({ config_values: next } as never).eq('id', existing.id)
    : await db.from('platform_configurations').insert({ config_key: 'kyc_settings', config_values: next } as never)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await logStaffAction(staff.id, 'kyc_settings', 'config', 'kyc_settings', next)
  return next
})
