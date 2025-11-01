// FILE: /stores/interests.ts - CREATE
// Interests store
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Interest } from '~/types/interests'

export const useInterestsStore = defineStore('interests', () => {
  const availableInterests = ref<Interest[]>([])
  const userInterests = ref<Interest[]>([])

  const availableGrouped = computed(() => {
    return availableInterests.value.reduce((acc: any, interest: Interest) => {
      const cat = interest.category || 'Other'
      if (!acc[cat]) {
        acc[cat] = []
      }
      acc[cat].push(interest)
      return acc
    }, {})
  })

  const userInterestIds = computed(() => {
    return userInterests.value.map(i => i.id)
  })

  const setAvailableInterests = (interests: Interest[]) => {
    availableInterests.value = interests
  }

  const setUserInterests = (interests: Interest[]) => {
    userInterests.value = interests
  }

  const addUserInterest = (interest: Interest) => {
    if (!userInterestIds.value.includes(interest.id)) {
      userInterests.value.push(interest)
    }
  }

  const removeUserInterest = (interestId: string) => {
    userInterests.value = userInterests.value.filter(i => i.id !== interestId)
  }

  const clearInterests = () => {
    availableInterests.value = []
    userInterests.value = []
  }

  return {
    availableInterests,
    userInterests,
    availableGrouped,
    userInterestIds,
    setAvailableInterests,
    setUserInterests,
    addUserInterest,
    removeUserInterest,
    clearInterests
  }
})
