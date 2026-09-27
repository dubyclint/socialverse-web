import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Interest } from '~/types/interests'
import { interestsService } from '~/services/interestsService'

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Request failed')

export const useInterestsStore = defineStore('interests', () => {
  const allInterests = ref<Interest[]>([])
  const userInterests = ref<Interest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const groupedInterests = computed(() => {
    return allInterests.value.reduce((acc, interest) => {
      const cat = interest.category || 'Other'
      acc[cat] = [...(acc[cat] || []), interest]
      return acc
    }, {} as Record<string, Interest[]>)
  })

  const fetchUserInterests = async () => {
    try {
      userInterests.value = await interestsService.fetchUserInterests()
    } catch (err) {
      error.value = messageOf(err)
    }
  }

  const fetchAllInterests = async () => {
    isLoading.value = true
    try {
      allInterests.value = await interestsService.fetchAll()
    } catch (err) {
      error.value = messageOf(err)
    } finally {
      isLoading.value = false
    }
  }

  const addInterest = async (interestId: string) => {
    try {
      await interestsService.add(interestId)
      await fetchUserInterests()
    } catch (err) {
      error.value = messageOf(err)
    }
  }

  const removeInterest = async (interestId: string) => {
    try {
      await interestsService.remove(interestId)
      userInterests.value = userInterests.value.filter(interest => interest.id !== interestId)
    } catch (err) {
      error.value = messageOf(err)
    }
  }

  return {
    allInterests,
    userInterests,
    isLoading,
    error,
    groupedInterests,
    fetchAllInterests,
    fetchUserInterests,
    addInterest,
    removeInterest
  }
})
