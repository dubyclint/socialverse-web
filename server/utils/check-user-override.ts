export async function checkUserOverride(userId, overrideType, key) {
  const override = await db.collection('userOverrides').findOne({
    userId,
    overrideType,
    key
  })

  return override?.value ?? null
}
