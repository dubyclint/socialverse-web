export async function checkUserOverride(userId: string, overrideType: string, key: string): Promise<any> {
  const override = await db.collection('userOverrides').findOne({
    userId,
    overrideType,
    key
  })

  return override?.value ?? null
}
