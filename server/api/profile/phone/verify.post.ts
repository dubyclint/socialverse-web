import { randomBytes } from 'node:crypto'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireUser } from '~/server/utils/auth'
import { isTelegramConfigured } from '~/server/utils/telegram'
import { maskPhone, rpcObject, rpcString } from '~/server/utils/phone-identity'

interface VerifyStartResponse {
  status: 'started' | 'nothing_to_verify'
  phone: string | null
  link: string | null
  expiresInMinutes: number
  message: string
}

const TOKEN_TTL_MINUTES = 15

/** Verify button: one-time Telegram deep link that proves ownership of the pending number. */
export default defineEventHandler(async (event): Promise<VerifyStartResponse> => {
  const user = await requireUser(event)
  if (!isTelegramConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Phone verification is not configured yet' })
  }

  const token = randomBytes(24).toString('base64url')
  const { data, error } = await getServiceClient().rpc('start_phone_verification', {
    p_user: user.id,
    p_token: token
  })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const result = rpcObject(data)
  if (rpcString(result, 'status') !== 'started') {
    return {
      status: 'nothing_to_verify',
      phone: null,
      link: null,
      expiresInMinutes: 0,
      message: 'Your phone number is already verified.'
    }
  }

  const bot = useRuntimeConfig().public.telegramBotUsername
  const phone = rpcString(result, 'phone')
  return {
    status: 'started',
    phone: maskPhone(phone),
    link: `https://t.me/${bot}?start=${token}`,
    expiresInMinutes: TOKEN_TTL_MINUTES,
    message: `Open Telegram and share your contact to verify ${maskPhone(phone)}.`
  }
})
