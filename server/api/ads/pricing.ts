export default defineEventHandler(async (event) => {
  if (event.req.method === 'GET') {
    return await db.collection('adPricing').find().toArray()
  }

  const pricing = await readBody(event)
  await db.collection('adPricing').deleteMany({})
  await db.collection('adPricing').insertMany(Object.entries(pricing).map(([type, rates]) => ({
    type, ...rates
  })))

  return { success: true }
})
