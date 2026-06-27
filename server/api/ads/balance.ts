export default defineEventHandler(async (event) => {
  const userId = event.context.user.id
  const user = await db.collection('users').findOne({ id: userId })
  return user?.adBalance || 0
})
