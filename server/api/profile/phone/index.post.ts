import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireUser } from '~/server/utils/auth'
import { currentSessionId, maskPhone, notifyTelegram, rpcObject, rpcString } from '~/server/utils/phone-identity'

interface Body {
  phone?: string
  phone_country?: string
}

type PhoneUpdateStatus = 'updated' | 'unchanged' | 'conflict' | 'rate_limited' | 'invalid'

interface PhoneUpdateResponse {
  status: PhoneUpdateStatus
  phone: string | null
  message: string
}

const MESSAGES: Record<PhoneUpdateStatus, string> = {
  updated: 'Phone number linked to your account.',
  unchanged: 'This number is already linked to your account.',
  conflict: 'This number is linked to another account. Tap Verify to prove it is yours and move it here.',
  rate_limited: 'You can change your phone number once every 7 days.',
  invalid: 'That is not a valid phone number for the selected country.'
}

const isStatus = (value: string | null): value is PhoneUpdateStatus =>
  value !== null && value in MESSAGES

/** Update button: link a free number, or park a number held elsewhere until it is verified. */
export default defineEventHandler(async (event): Promise<PhoneUpdateResponse> => {
  const user = await requireUser(event)
  const body = await readBody<Body>(event)
  const raw = body?.phone?.trim()
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Enter a phone number' })
  const country = body.phone_country?.trim().toUpperCase()
  if (!country) throw createError({ statusCode: 400, statusMessage: 'Select your country code' })

  const { data, error } = await getServiceClient().rpc('set_user_phone', {
    p_user: user.id,
    p_raw: raw,
    p_country: country,
    p_keep_session: (await currentSessionId(event)) ?? undefined
  })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const result = rpcObject(data)
  const status = rpcString(result, 'status')
  if (!isStatus(status)) throw createError({ statusCode: 500, statusMessage: 'Unexpected phone update result' })

  const phone = rpcString(result, 'phone')
  const previous = rpcString(result, 'previous')
  let message = MESSAGES[status]
  if (status === 'updated' && previous) {
    message += ' Other devices were signed out, and you can revert this within 24 hours.'
    await notifyTelegram(
      user.id,
      `Your Viorp phone number was changed from ${maskPhone(previous)} to ${maskPhone(phone)}. ` +
        'If this was not you, sign in and revert it from Edit profile within 24 hours.'
    )
  }

  return { status, phone, message }
})
