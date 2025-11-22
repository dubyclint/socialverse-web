import { sendNotification } from '~/server/utils/send-notification'
import { sendPushAlert } from '~/server/utils/send-push-alert'

export default defineEventHandler(async (event) => {
  const { userId, reason } = await readBody(event)

  await db.collection('filterRequests').updateOne(
    { userId },
    {
      $set: {
        status: 'rejected',
        approvedFilters: [],
        rejectedFilters: ['all'],
        rejectionReason: reason.slice(0, 40)
      }
    }
  )

  await sendNotification(userId, 'filter', `Your match filters were rejected: '${reason.slice(0, 40)}'`)
  await sendPushAlert(userId, 'Match Filters Rejected', `Reason: ${reason.slice(0, 40)}`)

  return { success: true }
})
