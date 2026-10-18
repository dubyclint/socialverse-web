import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { runtimeSecret } from '~/server/utils/runtime-secret'

export interface BachsCheckout {
  checkout_id: string
  checkout_url?: string
  status: string
  payment_status?: string | null
  amount?: string | null
  currency?: string | null
  charge?: { id: string, amount: string, currency: string, status: string } | null
  metadata?: Record<string, string> | null
}

export const bachsApiKey = () => runtimeSecret(useRuntimeConfig().bachsApiKey, 'BACHS_API_KEY')

/** Sandbox keys (`sk_sandbox_…`) only work against the sandbox host. */
export const bachsBaseUrl = (key: string) =>
  key.startsWith('sk_sandbox_') ? 'https://sandbox-api.bachs.io' : 'https://api.bachs.io'

export async function bachsRequest<T>(path: string, init: { method?: 'GET' | 'POST', body?: Record<string, unknown> } = {}): Promise<T> {
  const key = bachsApiKey()
  if (!key) throw createError({ statusCode: 503, statusMessage: 'Bachs is not configured' })
  try {
    return await $fetch<T>(`${bachsBaseUrl(key)}${path}`, {
      method: init.method ?? 'GET',
      headers: { authorization: `Bearer ${key}`, accept: 'application/json' },
      body: init.body,
      timeout: 20000
    })
  } catch (err) {
    const data = (err as { data?: { detail?: string, error_code?: string } }).data
    console.error('[bachs]', path, data?.error_code, data?.detail)
    throw createError({ statusCode: 502, statusMessage: data?.detail ? `Bachs: ${data.detail}` : 'Bachs request failed' })
  }
}

/** A checkout counts as paid only when Bachs itself reports a collected charge. */
export const isBachsPaid = (checkout: BachsCheckout) =>
  checkout.payment_status === 'paid' || checkout.charge?.status === 'succeeded'
