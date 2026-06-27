// ============================================================================
// FILE: /stores/interests.ts - NEW FILE
// ============================================================================
// Interests store for managing user interests
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Interest } from '~/types/interests'

export const useInterestsStore = defineStore('interests', () => {
  const allInterests = ref<Interest[]>([])
  const userInterests = ref<Interest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================
  
  const groupedInterests = computed(() => {
    const grouped: Record<string, Interest[]> = {}
    allInterests.value.forEach(interest => {
      const category = interest.category || 'Other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(interest)
    })
    return grouped
  })

  const userInterestIds = computed(() => {
    return userInterests.value.map(i => i.id)
  })

  const interestCount = computed(() => {
    return userInterests.value.length
  })

  // ============================================================================
  // ACTIONS - FETCH INTERESTS
  // ============================================================================
  
  const fetchAllInterests = async () => {
    console.log('[Interests Store] Fetching all interests...')
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/interests/list')
      
      if (response?.interests) {
        allInterests.value = response.interests
        console.log('[Interests Store] ✅ Interests fetched:', allInterests.value.length)
      }
    } catch (err: any) {
      console.error('[Interests Store] ❌ Failed to fetch interests:', err.message)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserInterests = async () => {
    console.log('[Interests Store] Fetching user interests...')
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/interests/user')
      
      if (response?.interests) {
        userInterests.value = response.interests
        console.log('[Interests Store] ✅ User interests fetched:', userInterests.value.length)
      }
    } catch (err: any) {
      console.error('[Interests Store] ❌ Failed to fetch user interests:', err.message)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // ACTIONS - MANAGE INTERESTS
  // ============================================================================
  
  const addInterest = async (interestId: string) => {
    console.log('[Interests Store] Adding interest:', interestId)

    try {
      await $fetch('/api/interests/add', {
        method: 'POST',
        body: { interestId }
      })
      
      console.log('[Interests Store] ✅ Interest added')
      await fetchUserInterests()
    } catch (err: any) {
      console.error('[Interests Store] ❌ Failed to add interest:', err.message)
      error.value = err.message
    }
  }

  const removeInterest = async (interestId: string) => {
    console.log('[Interests Store] Removing interest:', interestId)

    try {
      await $fetch('/api/interests/remove', {
        method: 'POST',
        body: { interestId }
      })
      
      console.log('[Interests Store] ✅ Interest removed')
      await fetchUserInterests()
    } catch (err: any) {
      console.error('[Interests Store] ❌ Failed to remove interest:', err.message)
      error.value = err.message
    }
  }

  const isInterestSelected = (interestId: string): boolean => {
    return userInterestIds.value.includes(interestId)
  }

  return {
    // State
    allInterests,
    userInterests,
    isLoading,
    error,

    // Computed
    groupedInterests,
    userInterestIds,
    interestCount,

    // Methods
    fetchAllInterests,
    fetchUserInterests,
    addInterest,
    removeInterest,
    isInterestSelected
  }
})
