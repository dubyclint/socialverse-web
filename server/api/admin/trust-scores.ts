// ============================================================================
// 9. server/api/admin/trust-scores.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { evaluateTrust } from '~/server/utils/evaluate-trust'
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (_event) => {
  try {
    const supabase = await getSupabaseAdminClient()

    const { data: users, error } = await supabase
      .from('user')
      .select('*')

    if (error) throw error

    const scored = (users || []).map((user: any) => {
      const trust = evaluateTrust(user)
      return {
        id: user.user_id,
        username: user.username,
        location: user.location,
        is_verified: user.is_verified,
        trust_score: trust.priorityRatio,
        criteria_met: trust.criteriaMet,
        is_trusted: trust.isTrusted
      }
    })

    return scored.sort((a: any, b: any) => b.trust_score - a.trust_score)
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to calculate trust scores'
    })
  }
})
