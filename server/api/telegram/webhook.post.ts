import { timingSafeEqual } from 'node:crypto'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { telegramSend } from '~/server/utils/telegram'
import { maskPhone, notifyTelegram, rpcObject, rpcString } from '~/server/utils/phone-identity'

interface TelegramUser {
  id: number
}

interface TelegramContact {
  phone_number: string
  user_id?: number
}

interface TelegramMessage {
  chat: { id: number }
  from?: TelegramUser
  text?: string
  contact?: TelegramContact
}

interface TelegramUpdate {
  message?: TelegramMessage
}

const sameSecret = (a: string, b: string): boolean => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

const SHARE_KEYBOARD = {
  keyboard: [[{ text: 'Share my phone number', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true
}

const handleStart = async (chatId: string, text: string): Promise<void> => {
  const token = text.split(/\s+/)[1]
  if (!token) {
    await telegramSend(chatId, 'To verify your number, open Viorp → Edit profile and tap Verify next to your phone number.')
    return
  }
  const { data: userId } = await getServiceClient().rpc('bind_phone_verification_chat', {
    p_token: token,
    p_chat_id: chatId
  })
  if (!userId) {
    await telegramSend(chatId, 'This verification link has expired. Tap Verify in Viorp to get a new one.')
    return
  }
  await telegramSend(
    chatId,
    'Tap the button below to share your phone number. Viorp only uses it to confirm the number on your account.',
    SHARE_KEYBOARD
  )
}

const handleContact = async (chatId: string, message: TelegramMessage, contact: TelegramContact): Promise<void> => {
  if (!message.from || contact.user_id !== message.from.id) {
    await telegramSend(chatId, 'Please share your own number using the button below.', SHARE_KEYBOARD)
    return
  }

  const raw = contact.phone_number.trim()
  const { data, error } = await getServiceClient().rpc('claim_verified_phone', {
    p_chat_id: chatId,
    p_phone: raw.startsWith('+') ? raw : `+${raw}`,
    p_telegram_user_id: String(message.from.id)
  })
  if (error) {
    console.error('[telegram] claim_verified_phone failed:', error.message)
    await telegramSend(chatId, 'Something went wrong while verifying. Please try again from Viorp.')
    return
  }

  const result = rpcObject(data)
  const status = rpcString(result, 'status')
  if (status === 'verified') {
    const phone = rpcString(result, 'phone')
    await telegramSend(chatId, `Verified. ${maskPhone(phone)} is now linked to your Viorp account.`, { remove_keyboard: true })
    const previousHolder = rpcString(result, 'previous_holder')
    if (previousHolder) {
      await notifyTelegram(
        previousHolder,
        `${maskPhone(phone)} was verified by its owner on another Viorp account and has been removed from yours.`
      )
    }
    return
  }
  if (status === 'mismatch') {
    await telegramSend(
      chatId,
      `The number you shared does not match the one waiting on your Viorp account (${maskPhone(rpcString(result, 'expected'))}). ` +
        'Check the number in Edit profile, tap Update, then Verify again.',
      { remove_keyboard: true }
    )
    return
  }
  await telegramSend(chatId, 'No verification is in progress. Tap Verify in Viorp to start.', { remove_keyboard: true })
}

/** Telegram bot webhook for phone ownership verification. */
export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig().telegramWebhookSecret
  const header = getHeader(event, 'x-telegram-bot-api-secret-token')
  if (!secret || !header || !sameSecret(header, secret)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const update = await readBody<TelegramUpdate>(event)
  const message = update?.message
  if (!message?.chat) return { ok: true }

  const chatId = String(message.chat.id)
  if (message.contact) {
    await handleContact(chatId, message, message.contact)
  } else if (message.text?.startsWith('/start')) {
    await handleStart(chatId, message.text)
  }
  return { ok: true }
})
