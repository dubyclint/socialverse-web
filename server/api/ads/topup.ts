export default defineEventHandler(async (event) => {
  const { amount } = await readBody(event)
  const userId = event.context.user.id
  await db.collection('users').updateOne({ id: userId }, { $inc: { adBalance: amount } })
  return { success: true }
})
