export default defineEventHandler(async (event) => {
  const { adId } = getQuery(event)
  const metrics = await db.collection('adMetrics').find({ adId }).toArray()
  const ctr = metrics.filter(m => m.action === 'click').length / metrics.length
  const optimized = ctr > 0.05 ? 'boost' : 'pause'
  return { action: optimized }
})
