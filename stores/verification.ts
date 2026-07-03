// stores/verification.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { verificationService } from '~/services/verificationService'

export const useVerificationStore = defineStore('verification', () => {
  const verificationStatus = ref<VerificationStatus>('none')
  const badgeRequest = ref<BadgeRequest | null>(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  const isPending = computed(() => verificationStatus.value === 'pending')
  const isApproved = computed(() => verificationStatus.value === 'approved')
  const isRejected = computed(() => verificationStatus.value === 'rejected')
  const canSubmitRequest = computed(() => ['none', 'rejected'].includes(verificationStatus.value))

  const fetchVerificationStatus = async () => {
    isLoading.value = true
    try {
      const response = await verificationService.getStatus()
      if (response?.status) verificationStatus.value = response.status
    } catch (err: any) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const submitVerificationRequest = async (data: any) => {
    isSubmitting.value = true
    try {
      const response = await verificationService.submitRequest(data)
      if (response) {
        badgeRequest.value = response
        verificationStatus.value = 'pending'
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      isSubmitting.value = false
    }
  }

  return { 
    verificationStatus, badgeRequest, isLoading, isSubmitting, error, 
    isPending, isApproved, isRejected, canSubmitRequest, 
    fetchVerificationStatus, submitVerificationRequest 
  }
})
