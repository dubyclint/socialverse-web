export default defineEventHandler(async (event) => {
  const user = event.context.user
  const request = await db.collection('filterRequests').findOne({ userId: user.id })

  if (!request) return { status: 'none' }

  return {
    status: request.status,
    approvedFilters: request.approvedFilters,
    rejectedFilters: request.rejectedFilters,
    rejectionReason: request.rejectionReason
  }
})
