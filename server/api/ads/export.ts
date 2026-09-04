export default defineEventHandler(async () => {
  const ads = await db.collection('ads').find().toArray()
  const metrics = await db.collection('adMetrics').find().toArray()
  const conversions = await db.collection('adConversions').find().toArray()

  const report = ads.map((ad: any) => {
    const m = metrics.filter((x: any) => x.adId === ad.id)
    const c = conversions.filter((x: any) => x.adId === ad.id)
    return {
      id: ad.id,
      type: ad.type,
      impressions: m.filter((x: any) => x.action === 'impression').length,
      clicks: m.filter((x: any) => x.action === 'click').length,
      conversions: c.length,
      status: ad.status
    }
  })

  return report
})
