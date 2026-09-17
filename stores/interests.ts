// stores/interests.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Interest } from '~/types/interests'
import { interestsService } from '~/services/interestsService'

export const useInterestsStore = defineStore('interests', () => {
  const allInterests = ref<Interest[]>([])
  const userInterests = ref<Interest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters remain in the store as they act on local reactive state
  const groupedInterests = computed(() => {
    return allInterests.value.reduce((acc, interest) => {
      const cat = interest.category || 'Other'
      acc[cat] = [...(acc[cat] || []), interest]
      return acc
    }, {} as Record<string, Interest[]>)
  })

  // Actions delegate to Service
  const fetchAllInterests = async () => {
    isLoading.value = true
    try {
      const res = await interestsService.fetchAll()
      allInterests.value = res?.interests || []
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const addInterest = async (interestId: string) => {
    try {
      await interestsService.add(interestId)
      // TODO: ensure fetchUserInterests exists or re-fetch logic is implemented
      // await fetchUserInterests() // Re-fetch or locally update
    } catch (err: any) {
      error.value = err.message
    }
  }

  // ... other methods follow the same pattern
  return { allInterests, userInterests, isLoading, groupedInterests, fetchAllInterests, addInterest }
})
