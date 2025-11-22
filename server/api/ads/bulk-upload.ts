export default defineEventHandler(async (event) => {
  const file = await readMultipartFormData(event)
  const rows = parseSpreadsheet(file)
  const ads = rows.map(row => ({ ...row, status: 'pending', createdAt: Date.now() }))
  await db.collection('ads').insertMany(ads)
  return { success: true }
})
