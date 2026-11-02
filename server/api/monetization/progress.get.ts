import { requireUser } from '~/server/utils/auth'
import { computeMonetization } from '~/server/utils/monetization'

export { DEFAULT_MONETIZATION } from '~/server/utils/monetization'
export type { Criterion, MonetizationRules } from '~/server/utils/monetization'

/** Live progress for every monetization requirement on /monetization. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return computeMonetization(user.id)
})
