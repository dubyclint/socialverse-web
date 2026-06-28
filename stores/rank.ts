// ============================================================================
// FILE: /stores/rank.ts - FIXED: No Circular Dependencies
// ============================================================================
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useSharedState } from '~/composables/useSharedState'

export const useRankStore = defineStore('rank', () => {
  const { rankState } = useSharedState()

  // ============================================================================
  // RANK TIER INFORMATION
  // ============================================================================
  const rankTiers = [
    { name: 'Bronze I', minPoints: 0, maxPoints: 99 },
    { name: 'Bronze II', minPoints: 100, maxPoints: 199 },
    { name: 'Bronze III', minPoints: 200, maxPoints: 299 },
    { name: 'Silver I', minPoints: 300, maxPoints: 399 },
    { name: 'Silver II', minPoints: 400, maxPoints: 499 },
    { name: 'Silver III', minPoints: 500, maxPoints: 599 },
    { name: 'Gold I', minPoints: 600, maxPoints: 699 },
    { name: 'Gold II', minPoints: 700, maxPoints: 799 },
    { name: 'Gold III', minPoints: 800, maxPoints: 889 },
    { name: 'Platinum I', minPoints: 900, maxPoints: 999 },
    { name: 'Platinum II', minPoints: 1000, maxPoints: 1099 },
    { name: 'Platinum III', minPoints: 1100, maxPoints: 1199 },
    { name: 'Diamond', minPoints: 1200, maxPoints: Infinity }
  ]

  // ============================================================================
  // REACTIVE COMPUTED PROPERTIES (from shared state)
  // ============================================================================
  const rankPoints = computed(() => rankState.rankPoints ?? 0)
  const rankLevel = computed(() => rankState.rankLevel ?? 1)
  const activeRank = computed(() => rankState.rankTitle ?? 'Bronze I')

  // ============================================================================
  // DERIVED COMPUTATIONS
  // ============================================================================
  const currentRankTier = computed(() => {
    return rankTiers.find(tier => 
      rankPoints.value >= tier.minPoints && rankPoints.value <= tier.maxPoints
    ) || rankTiers[0]
  })

  const nextRankTier = computed(() => {
    const currentIndex = rankTiers.findIndex(tier => tier.name === activeRank.value)
    return currentIndex !== -1 && currentIndex < rankTiers.length - 1 
      ? rankTiers[currentIndex + 1] 
      : null
  })

  const pointsToNextRank = computed(() => {
    if (!nextRankTier.value) return 0
    return nextRankTier.value.minPoints - rankPoints.value
  })

  const rankProgress = computed(() => {
    if (!currentRankTier.value) return 0
    const tierRange = currentRankTier.value.maxPoints - currentRankTier.value.minPoints
    const pointsInTier = rankPoints.value - currentRankTier.value.minPoints
    if (tierRange === 0 || isNaN(pointsInTier)) return 0
    return Math.max(0, Math.min(100, (pointsInTier / tierRange) * 100))
  })

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  const getRankColor = (rankName: string): string => {
    if (rankName.includes('Bronze')) return '#CD7F32'
    if (rankName.includes('Silver')) return '#C0C0C0'
    if (rankName.includes('Gold')) return '#FFD700'
    if (rankName.includes('Platinum')) return '#E5E4E2'
    if (rankName.includes('Diamond')) return '#B9F2FF'
    return '#808080'
  }

  const getRankIcon = (rankName: string): string => {
    if (rankName.includes('Bronze')) return '🥉'
    if (rankName.includes('Silver')) return '🥈'
    if (rankName.includes('Gold')) return '🥇'
    if (rankName.includes('Platinum')) return '💎'
    if (rankName.includes('Diamond')) return '✨'
    return '⭐'
  }

  return {
    rank: activeRank,
    rankPoints,
    rankLevel,
    currentRankTier,
    nextRankTier,
    pointsToNextRank,
    rankProgress,
    getRankColor,
    getRankIcon
  }
})
