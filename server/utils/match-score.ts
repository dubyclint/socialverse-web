interface User {
  id: string;
  interests?: string[];
  location?: string;
  country?: string;
  currency?: string;
  usdtBalance?: number;
  rank?: string;
  isVerified?: boolean;
  successfulTrades?: number;
  pals?: string[];
  chatHistory?: string[];
  pocket?: string[];
  recentMatches?: string[];
  riskScore?: number;
}

export function computeMatchScore(userA: User, userB: User): number {
  let score = 0;

  // Shared interests bonus
  const sharedInterests = userA.interests?.filter(i => userB.interests?.includes(i)) || [];
  score += sharedInterests.length * 20;

  // Location bonuses
  if (userA.location === userB.location) score += 15;
  if (userA.country === userB.country) score += 10;
  if (userA.currency === userB.currency) score += 25;

  // Financial stability bonus
  if ((userB.usdtBalance || 0) >= 50) score += 10;

  // Rank bonus
  const rankMap: { [key: string]: number } = { 
    Homie: 1, 
    Pal: 2,
    Buddy: 3,
    Friend: 4,
    BestFriend: 5,
    Elite: 6
  };
  score += (rankMap[userB.rank || 'Homie']) * 10;

  // Trust and verification bonuses
  if (userB.isVerified) score += 25;
  score += (userB.successfulTrades || 0) * 5;

  // Social connections bonus
  const mutualPals = userA.pals?.filter(p => userB.pals?.includes(p)) || [];
  score += mutualPals.length * 10;

  // Interaction history bonuses
  if (userA.chatHistory?.includes(userB.id)) score += 10;
  if (userA.pocket?.includes(userB.id)) score += 5;

  // Penalties
  if (userA.recentMatches?.includes(userB.id)) score -= 20;
  if (userB.riskScore && userB.riskScore > 70) score -= 30;

  return Math.max(0, score); // Ensure non-negative score
}
