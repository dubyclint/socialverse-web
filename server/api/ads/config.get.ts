import { DEFAULT_AD_PRICING, DEFAULT_EXTERNAL_ADS, readPlatformConfig } from '~/server/utils/ads'
import type { AdPricing, ExternalAdsConfig } from '~/server/utils/ads'
import { currentDau, loadCreatorRevenueConfig } from '~/server/utils/creator-revenue'

/** Public ad-network placement IDs and pricing (no secrets). */
export default defineEventHandler(async () => {
  const [external, pricing, revenue, dau] = await Promise.all([
    readPlatformConfig<ExternalAdsConfig>('external_ads', DEFAULT_EXTERNAL_ADS),
    readPlatformConfig<AdPricing>('ad_pricing', DEFAULT_AD_PRICING),
    loadCreatorRevenueConfig(),
    currentDau()
  ])
  // Scale gate: third-party SDKs (Monetag/Appodeal) stay off below the admin DAU gate; house ads serve instead.
  const networksActive = dau >= revenue.dau_gate
  return {
    external: { ...external, monetag_enabled: Boolean(external.monetag_enabled) && networksActive, networks_active: networksActive, appodeal_app_key: external.appodeal_app_key || process.env.APPODEAL_APP_KEY || '' },
    pricing
  }
})
