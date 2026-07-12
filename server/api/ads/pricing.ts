export default defineEventHandler(async (event) => {
  if (event.req.method === 'GET') {
    return await db.collection('adPricing').find().toArray()
  }

  const pricing: any = await readBody(event)
  await db.collection('adPricing').deleteMany({})
  await db.collection('adPricing').insertMany(Object.entries(pricing).map(([type, rates]: [string, any]) => ({
    type, ...rates
  })))

  return { success: true }
})
