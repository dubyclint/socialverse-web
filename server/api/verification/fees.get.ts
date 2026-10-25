import { getVerificationFees, TIER_LABELS } from '~/server/utils/verification-fees'

/** Current verification badge fees (PEW), shown on the badge T&C page. */
export default defineEventHandler(async () => ({ fees: await getVerificationFees(), tiers: TIER_LABELS }))
