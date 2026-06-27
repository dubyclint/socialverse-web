export default defineEventHandler(async (event) => {
  const { region, device, startDate, endDate } = getQuery(event)

  const ads = await db.collection('ads').find({
    ...(region && { location: region }),
    ...(device && { deviceTarget: device })
  }).toArray()

  const match: any = { adId: { $in: ads.map(a => a.id) } }
  if (startDate) match.timestamp = { $gte: new Date(startDate).getTime() }
  if (endDate) match.timestamp = { ...match.timestamp, $lte: new Date(endDate).getTime() }

  const metrics = await db.collection('adMetrics').aggregate([
    { $match: match },
    { $group: {
      _id: '$adId',
      impressions: { $sum: { $cond: [{ $eq: ['$action', 'impression'] }, 1, 0] } },
      clicks: { $sum: { $cond: [{ $eq: ['$action', 'click'] }, 1, 0] } }
    }}
  ]).toArray()

  const pricing = await db.collection('adPricing').find().toArray()
  const pricingMap = Object.fromEntries(pricing.map(p => [p.type, p]))

  return ads.map(ad => {
    const m = metrics.find(x => x._id === ad.id) || { impressions: 0, clicks: 0 }
    const rates = pricingMap[ad.type] || { cpm: 0, cpc: 0 }
    const spend = (m.impressions / 1000) * rates.cpm + m.clicks * rates.cpc
    return { ...ad, ...m, spend }
  })
})
