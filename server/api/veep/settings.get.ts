import { getVeepSettings } from '~/server/utils/veep'
import { loadCreatorRevenueConfig } from '~/server/utils/creator-revenue'

export default defineEventHandler(async () => {
  const [veep, revenue] = await Promise.all([getVeepSettings(), loadCreatorRevenueConfig()])
  return { ...veep, ad_engaged_s: revenue.engaged_seconds }
})
