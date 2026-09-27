export async function checkPremiumAccess(user: any, feature: string): Promise<boolean> {
  const rules = await db.collection('premiumAccessRules').find({ active: true }).toArray()

  for (const rule of rules) {
    const match =
      (rule.target === 'country' && rule.value === user.country) ||
      (rule.target === 'region' && rule.value === user.region) ||
      (rule.target === 'geo' && user.geo === rule.value) ||
      (rule.target === 'all')

    if (match && rule.features && rule.features[feature]) {
      return true
    }
  }

  return false
}
