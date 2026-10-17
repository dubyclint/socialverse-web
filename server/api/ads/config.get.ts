import { DEFAULT_AD_PRICING, DEFAULT_EXTERNAL_ADS, readPlatformConfig } from '~/server/utils/ads'
import type { AdPricing, ExternalAdsConfig } from '~/server/utils/ads'

/** Public ad-network placement IDs and pricing (no secrets). */
export default defineEventHandler(async () => {
  const [external, pricing] = await Promise.all([
    readPlatformConfig<ExternalAdsConfig>('external_ads', DEFAULT_EXTERNAL_ADS),
    readPlatformConfig<AdPricing>('ad_pricing', DEFAULT_AD_PRICING)
  ])
  return {
    external: { ...external, appodeal_app_key: external.appodeal_app_key || process.env.APPODEAL_APP_KEY || '' },
    pricing
  }
})
