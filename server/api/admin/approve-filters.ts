// ============================================================================
// 1. server/api/admin/approve-filters.ts - CORRECTED FOR SUPABASE
// ============================================================================
import { sendNotification } from '~/server/utils/send-notification'
import { sendPushAlert } from '~/server/utils/send-push-alert'
import { getSupabaseAdminClient } from '~/server/utils/database'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseAdminClient()
    const { userId, approvedFilters } = await readBody(event)

    // Update filter requests
    const { error: filterError } = await supabase
      .from('filter_requests')
      .update({
        status: 'approved',
        approved_filters: approvedFilters,
        rejected_filters: []
      })
      .eq('user_id', userId)

    if (filterError) throw filterError

    // Update user match filters
    const { error: userError } = await supabase
      .from('users')
      .update({ match_filters: approvedFilters })
      .eq('id', userId)

    if (userError) throw userError

    await sendNotification(userId, 'filter', 'Your match filters were approved.')
    await sendPushAlert(userId, 'Match Filters Approved', 'Your filters are now active.')

    return { success: true }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to approve filters'
    })
  }
})
