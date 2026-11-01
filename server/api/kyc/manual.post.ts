import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getKyc, getKycSettings } from '~/server/utils/kyc'

interface Body {
  fullName?: string, idType?: string, idNumber?: string, residence?: string
  signature?: string, signedOn?: string, sentencePhotoPath?: string, acceptTerms?: boolean, payLater?: boolean
}
const ID_TYPES = ['national_id', 'passport', 'drivers_license', 'voters_card', 'residence_permit']
const clean = (v: unknown, max = 120) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max)

/** Manual KYC: legal name, government ID, and a photo holding the admin sentence. Fee is charged on approval. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<Body>(event)
  const fullName = clean(body?.fullName)
  const idType = clean(body?.idType, 40)
  const idNumber = clean(body?.idNumber, 60)
  const residence = clean(body?.residence)
  const signature = clean(body?.signature)
  const signedOn = clean(body?.signedOn, 10)
  const photo = String(body?.sentencePhotoPath ?? '')
  if (fullName.split(' ').length < 2) throw createError({ statusCode: 400, statusMessage: 'Enter your full legal name (first and last name)' })
  if (!ID_TYPES.includes(idType)) throw createError({ statusCode: 400, statusMessage: 'Choose a government ID type' })
  if (idNumber.length < 4) throw createError({ statusCode: 400, statusMessage: 'Enter your ID number' })
  if (!residence || !signature || !/^\d{4}-\d{2}-\d{2}$/.test(signedOn)) throw createError({ statusCode: 400, statusMessage: 'Fill in residence, signature and date' })
  if (!photo.startsWith(`${user.id}/`) || photo.includes('..')) throw createError({ statusCode: 400, statusMessage: 'Upload your sentence photo' })
  if (body?.acceptTerms !== true) throw createError({ statusCode: 400, statusMessage: 'Accept the KYC terms first' })

  const kyc = await getKyc(user.id)
  if (kyc.status === 'verified') throw createError({ statusCode: 409, statusMessage: 'You are already KYC verified' })
  const db = getServiceClient()
  const { data: open } = await db.from('kyc_requests' as never).select('id').eq('user_id', user.id).in('status', ['pending', 'in_review']).limit(1).maybeSingle()
  if (open) throw createError({ statusCode: 409, statusMessage: 'A KYC request is already under review' })

  const settings = await getKycSettings()
  const { data, error } = await db.from('kyc_requests' as never).insert({
    user_id: user.id, method: 'manual', full_name: fullName, id_type: idType, id_number: idNumber, residence,
    signature, signed_on: signedOn, sentence: settings.sentence, sentence_photo_path: photo,
    fee_pew: settings.fee_pew, pay_later: body?.payLater === true
  } as never).select('id').single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  await db.from('user_kyc' as never).upsert({ user_id: user.id, status: 'pending', updated_at: new Date().toISOString() } as never, { onConflict: 'user_id', ignoreDuplicates: false })
  return { id: (data as { id: string }).id }
})
