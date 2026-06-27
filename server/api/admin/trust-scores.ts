// ============================================================================
// 9. server/api/admin/trust-scores.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { evaluateTrust } from '~/server/utils/evaluate-trust'
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('*')

    if (error) throw error

    const scored = (users || []).map(user => {
      const trust = evaluateTrust(user)
      return {
        id: user.id,
        username: user.username,
        country: user.country,
        region: user.region,
        is_verified: user.is_verified,
        kyc_verified: user.kyc_verified,
        is_premium: user.is_premium,
        trust_score: trust.priorityRatio,
        criteria_met: trust.criteriaMet,
        is_trusted: trust.isTrusted
      }
    })

    return scored.sort((a, b) => b.trust_score - a.trust_score)
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to calculate trust scores'
    })
  }
})
