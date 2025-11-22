export default defineEventHandler(async (event) => {
  const { adId, approve } = await readBody(event)
  const status = approve ? 'approved' : 'rejected'
  await db.collection('ads').updateOne({ id: adId }, { $set: { status } })
  return { success: true }
})
