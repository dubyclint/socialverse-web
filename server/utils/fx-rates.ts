import type { getServiceClient } from '~/server/utils/supabase-admin'

type Db = ReturnType<typeof getServiceClient>

const STALE_MS = 6 * 60 * 60 * 1000
let lastAttempt = 0

/** Refreshes supported_assets.reference_rate (USD per unit, 1 PEW = 1 USD) for every fiat currency. */
export async function refreshFiatRates(db: Db, force = false): Promise<number> {
  if (!force && Date.now() - lastAttempt < STALE_MS) return 0
  lastAttempt = Date.now()
  const res = await $fetch<{ result: string, rates: Record<string, number> }>('https://open.er-api.com/v6/latest/USD').catch(() => null)
  if (!res || res.result !== 'success') return 0
  const { data: assets } = await db.from('supported_assets').select('code').eq('kind', 'FIAT')
  let updated = 0
  for (const { code } of assets ?? []) {
    const perUsd = res.rates[code]
    if (!perUsd || perUsd <= 0) continue
    await db.from('supported_assets')
      .update({ reference_rate: Number((1 / perUsd).toFixed(10)), rate_updated_at: new Date().toISOString(), is_enabled: true })
      .eq('code', code)
    updated++
  }
  return updated
}

export async function refreshFiatRatesIfStale(db: Db): Promise<void> {
  const { data } = await db.from('supported_assets').select('rate_updated_at').eq('kind', 'FIAT').eq('code', 'EUR').maybeSingle()
  const at = data?.rate_updated_at ? new Date(data.rate_updated_at).getTime() : 0
  if (Date.now() - at > STALE_MS) await refreshFiatRates(db)
}
