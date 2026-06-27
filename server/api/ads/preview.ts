export default defineEventHandler(async (event) => {
  const { adId, variant } = getQuery(event)
  const ad = await db.collection('ads').findOne({ id: adId })
  const version = variant ? ad.variants?.[variant] : ad
  return version
})
