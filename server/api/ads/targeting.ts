export default defineEventHandler(async (event) => {
  const rules = await readBody(event)
  await db.collection('adTargetingRules').updateOne({ key: 'default' }, { $set: { rules } }, { upsert: true })
  return { success: true }
})
