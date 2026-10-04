import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { telegramSend } from '~/server/utils/telegram'

export type RpcObject = Record<string, unknown>

/** The phone RPCs return a jsonb object; read it without trusting its shape. */
export const rpcObject = (data: unknown): RpcObject =>
  data !== null && typeof data === 'object' && !Array.isArray(data) ? (data as RpcObject) : {}

export const rpcString = (obj: RpcObject, key: string): string | null => {
  const value = obj[key]
  return typeof value === 'string' ? value : null
}

/** Show only the last digits of a number in messages. */
export const maskPhone = (phone: string | null): string | null =>
  phone ? `${'•'.repeat(Math.max(phone.length - 4, 0))}${phone.slice(-4)}` : null

/** Supabase session id of the caller, so "sign out other devices" keeps this one. */
export const currentSessionId = async (event: H3Event): Promise<string | null> => {
  const client = await serverSupabaseClient(event)
  const { data } = await client.auth.getSession()
  const token = data.session?.access_token
  const payload = token?.split('.')[1]
  if (!payload) return null
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { session_id?: unknown }
    return typeof claims.session_id === 'string' ? claims.session_id : null
  } catch {
    return null
  }
}

/** Telegram chat a user linked when they last verified, if any. */
export const telegramChatFor = async (userId: string): Promise<string | null> => {
  const { data } = await getServiceClient()
    .from('user_telegram_links')
    .select('chat_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.chat_id ?? null
}

export const notifyTelegram = async (userId: string, text: string): Promise<void> => {
  const chatId = await telegramChatFor(userId)
  if (chatId) await telegramSend(chatId, text)
}
