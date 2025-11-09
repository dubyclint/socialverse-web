export default defineEventHandler(async () => {
  const requests = await db.collection('filterRequests').find({ status: 'pending' }).toArray()
  return requests
})
