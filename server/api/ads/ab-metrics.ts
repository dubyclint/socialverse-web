export default defineEventHandler(async (event) => {
  const { page, region, startDate, endDate } = getQuery(event)

  const match: any = { action: 'variant' }
  if (page) match.page = page
  if (region) match.region = region
  if (startDate) match.timestamp = { $gte: new Date(startDate).getTime() }
  if (endDate) match.timestamp = { ...match.timestamp, $lte: new Date(endDate).getTime() }

  const metrics = await db.collection('adMetrics').find(match).toArray()
  const conversions = await db.collection('adConversions').find().toArray()

  const formats = ['image', 'video', 'text', 'audio', 'external']
  const result = formats.map(format => {
    const filtered = metrics.filter(m => m.variant === format)
    const adIds = [...new Set(filtered.map(m => m.adId))]
    const clicks = metrics.filter(m => m.variant === format && m.action === 'click').length
    const impressions = filtered.length
    const ctr = impressions ? (clicks / impressions) * 100 : 0
    const conv = conversions.filter(c => adIds.includes(c.adId)).length
    return { format, impressions, clicks, ctr, conversions: conv }
  })

  return result
})

