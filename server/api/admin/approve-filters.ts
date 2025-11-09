import { sendNotification } from '~/server/utils/sendNotification'
import { sendPushAlert } from '~/server/utils/sendPushAlert'

export default defineEventHandler(async (event) => {
  const { userId, approvedFilters } = await readBody(event)

  await db.collection('filterRequests').updateOne(
    { userId },
    {
      $set: {
        status: 'approved',
        approvedFilters,
        rejectedFilters: []
      }
    }
  )

  await db.collection('users').updateOne(
    { _id: userId },
    { $set: { matchFilters: approvedFilters } }
  )

  await sendNotification(userId, 'filter', 'Your match filters were approved.')
  await sendPushAlert(userId, 'Match Filters Approved', 'Your filters are now active.')

  return { success: true }
})

