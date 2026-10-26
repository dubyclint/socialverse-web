import { requireStaff } from '~/server/utils/staff'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { DEFAULT_AD_PRICING, DEFAULT_EXTERNAL_ADS, readPlatformConfig } from '~/server/utils/ads'
import type { AdPricing, ExternalAdsConfig } from '~/server/utils/ads'

const save = async (key: string, values: object) => {
  const service = getServiceClient()
  const { data } = await service.from('platform_configurations').select('id').eq('config_key', key).maybeSingle()
  const { error } = data
    ? await service.from('platform_configurations').update({ config_values: values as never, updated_at: new Date().toISOString() }).eq('config_key', key)
    : await service.from('platform_configurations').insert({ config_key: key, config_values: values as never })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
}

/** Updates CPM pricing, feed ad density and external network IDs. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'ads')
  const body = await readBody<{ pricing?: Partial<AdPricing>, external?: Partial<ExternalAdsConfig>, serving?: { enabled?: boolean, every_n_items?: number, every_n_min?: number, every_n_max?: number, first_slot?: number, external_fallback?: boolean } }>(event)

  if (body.pricing) {
    const current = await readPlatformConfig<AdPricing>('ad_pricing', DEFAULT_AD_PRICING)
    const next = { ...current }
    for (const key of Object.keys(DEFAULT_AD_PRICING) as (keyof AdPricing)[]) {
      const v = Number(body.pricing[key])
      if (body.pricing[key] !== undefined) {
        if (!Number.isFinite(v) || v <= 0) throw createError({ statusCode: 400, statusMessage: `${key} must be positive` })
        next[key] = v
      }
    }
    await save('ad_pricing', next)
  }
  if (body.external) {
    const current = await readPlatformConfig<ExternalAdsConfig>('external_ads', DEFAULT_EXTERNAL_ADS)
    const next = { ...current }
    for (const key of Object.keys(DEFAULT_EXTERNAL_ADS) as (keyof ExternalAdsConfig)[]) {
      const value = body.external[key]
      if (value === undefined) continue
      if (typeof DEFAULT_EXTERNAL_ADS[key] === 'boolean') (next as Record<string, unknown>)[key] = Boolean(value)
      else if (typeof DEFAULT_EXTERNAL_ADS[key] === 'number') (next as Record<string, unknown>)[key] = Math.max(1, Number(value) || 15)
      else (next as Record<string, unknown>)[key] = String(value).trim().slice(0, 500)
    }
    for (const key of ['monetag_social_bar_src', 'monetag_smartlink_url'] as const) {
      if (next[key] && !/^https:\/\//.test(next[key])) throw createError({ statusCode: 400, statusMessage: `${key} must start with https://` })
    }
    await save('external_ads', next)
  }
  if (body.serving) {
    const current = await readPlatformConfig<Record<string, unknown>>('ad_serving', {})
    const fallback = Number(body.serving.every_n_items ?? current.every_n_items ?? 5)
    const gapMin = Math.round(Number(body.serving.every_n_min ?? current.every_n_min ?? fallback))
    const gapMax = Math.round(Number(body.serving.every_n_max ?? current.every_n_max ?? fallback))
    if (!(gapMin >= 2 && gapMax <= 7 && gapMin <= gapMax)) throw createError({ statusCode: 400, statusMessage: 'Feed ads must come every 2–7 posts (minimum no more than maximum)' })
    const every = gapMin
    await save('ad_serving', {
      ...current,
      enabled: body.serving.enabled ?? current.enabled ?? true,
      every_n_items: every,
      every_n_min: gapMin,
      every_n_max: gapMax,
      first_slot: Math.max(1, Number(body.serving.first_slot ?? current.first_slot ?? 3)),
      external_fallback: body.serving.external_fallback ?? current.external_fallback ?? true
    })
  }
  return { saved: true }
})
