export default defineEventHandler(async (event) => {
  if (event.req.method === 'GET') {
    return await db.collection('adPageRules').find().toArray()
  }

  const rules = await readBody(event)
  await db.collection('adPageRules').deleteMany({})
  await db.collection('adPageRules').insertMany(rules)
  return { success: true }
})
