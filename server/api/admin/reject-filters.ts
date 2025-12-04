// ============================================================================
// 6. server/api/admin/reject-filters.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { sendNotification } from '~/server/utils/send-notification'
import { sendPushAlert } from '~/server/utils/send-push-alert'
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()
    const { userId, reason } = await readBody(event)

    const { error } = await supabase
      .from('filter_requests')
      .update({
        status: 'rejected',
        approved_filters: [],
        rejected_filters: ['all'],
        rejection_reason: reason.slice(0, 40)
      })
      .eq('user_id', userId)

    if (error) throw error

    await sendNotification(userId, 'filter', `Your match filters were rejected: '${reason.slice(0, 40)}'`)
    await sendPushAlert(userId, 'Match Filters Rejected', `Reason: ${reason.slice(0, 40)}`)

    return { success: true }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to reject filters'
    })
  }
})
