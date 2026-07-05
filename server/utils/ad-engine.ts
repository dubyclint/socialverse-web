// server/utils/ad-engine.ts
export const getDiscoveryContent = async (userId: string) => {
  // Layer 1: Internal Content (Interest-based)
  const internal = await getSuggestedFriends(userId)
  if (internal.length > 0) return { type: 'social', data: internal }

  // Layer 2: Social Recommendation (Contact-based)
  const social = await getContactRecommendations(userId)
  if (social.length > 0) return { type: 'network', data: social }

  // Layer 3: External Fallback (Meta/Google)
  const external = await fetchExternalAd(userId)
  return { type: 'external', data: external }
}
