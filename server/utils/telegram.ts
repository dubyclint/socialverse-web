interface TelegramKeyboardButton {
  text: string
  request_contact?: boolean
}

export interface TelegramReplyMarkup {
  keyboard?: TelegramKeyboardButton[][]
  resize_keyboard?: boolean
  one_time_keyboard?: boolean
  remove_keyboard?: boolean
}

export const isTelegramConfigured = (): boolean => Boolean(useRuntimeConfig().telegramBotToken)

/** Best-effort message from the verification bot; returns false when it could not be delivered. */
export const telegramSend = async (
  chatId: string,
  text: string,
  replyMarkup?: TelegramReplyMarkup
): Promise<boolean> => {
  const token = useRuntimeConfig().telegramBotToken
  if (!token) return false
  try {
    await $fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      body: { chat_id: chatId, text, reply_markup: replyMarkup }
    })
    return true
  } catch (err) {
    console.error('[telegram] sendMessage failed:', err instanceof Error ? err.message : err)
    return false
  }
}
