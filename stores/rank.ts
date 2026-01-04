// ============================================================================
// FILE: /stores/rank.ts - SIMPLIFIED VERSION
// ============================================================================
// Rank store (simplified - gets data from profile store)
// ============================================================================

import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useProfileStore } from './profile'

export const useRankStore = defineStore('rank', () => {
  const profileStore = useProfileStore()

  // ============================================================================
  // COMPUTED PROPERTIES - GET FROM PROFILE STORE
  // ============================================================================
  
  const rank = computed(() => {
    return profileStore.rank
  })

  const rankPoints = computed(() => {
    return profileStore.rankPoints
  })

  const rankLevel = computed(() => {
    return profileStore.rankLevel
  })

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
    { name: 'Gold III', minPoints: 800, maxPoints: 899 },
    { name: 'Platinum I', minPoints: 900, maxPoints: 999 },
    { name: 'Platinum II', minPoints: 1000, maxPoints: 1099 },
    { name: 'Platinum III', minPoints: 1100, maxPoints: 1199 },
    { name: 'Diamond', minPoints: 1200, maxPoints: Infinity }
  ]

  const currentRankTier = computed(() => {
    return rankTiers.find(tier => 
      rankPoints.value >= tier.minPoints && rankPoints.value <= tier.maxPoints
    )
  })

  const nextRankTier = computed(() => {
    const currentIndex = rankTiers.findIndex(tier => tier.name === rank.value)
    return currentIndex < rankTiers.length - 1 ? rankTiers[currentIndex + 1] : null
  })

  const pointsToNextRank = computed(() => {
    if (!nextRankTier.value) return 0
    return nextRankTier.value.minPoints - rankPoints.value
  })

  const rankProgress = computed(() => {
    if (!currentRankTier.value) return 0
    const tierRange = currentRankTier.value.maxPoints - currentRankTier.value.minPoints
    const pointsInTier = rankPoints.value - currentRankTier.value.minPoints
    return Math.min(100, (pointsInTier / tierRange) * 100)
  })

  // ============================================================================
  // METHODS
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
    // Computed Properties
    rank,
    rankPoints,
    rankLevel,
    currentRankTier,
    nextRankTier,
    pointsToNextRank,
    rankProgress,

    // Methods
    getRankColor,
    getRankIcon
  }
})
