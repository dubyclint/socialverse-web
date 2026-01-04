// ============================================================================
// FILE: /stores/verification.ts - NEW FILE
// ============================================================================
// Verification store for managing badge requests and verification
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BadgeRequest, VerificationStatus } from '~/types/verification'

export const useVerificationStore = defineStore('verification', () => {
  const verificationStatus = ref<VerificationStatus>('none')
  const badgeRequest = ref<BadgeRequest | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isSubmitting = ref(false)

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================
  
  const isPending = computed(() => {
    return verificationStatus.value === 'pending'
  })

  const isApproved = computed(() => {
    return verificationStatus.value === 'approved'
  })

  const isRejected = computed(() => {
    return verificationStatus.value === 'rejected'
  })

  const canSubmitRequest = computed(() => {
    return verificationStatus.value === 'none' || verificationStatus.value === 'rejected'
  })

  // ============================================================================
  // ACTIONS - FETCH STATUS
  // ============================================================================
  
  const fetchVerificationStatus = async () => {
    console.log('[Verification Store] Fetching verification status...')
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/verified/status')
      
      if (response?.status) {
        verificationStatus.value = response.status
        console.log('[Verification Store] ✅ Status fetched:', verificationStatus.value)
      }
    } catch (err: any) {
      console.error('[Verification Store] ❌ Failed to fetch status:', err.message)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================================
  // ACTIONS - SUBMIT REQUEST
  // ============================================================================
  
  const submitVerificationRequest = async (data: {
    name: string
    socialLink: string
    docUrl?: string
  }) => {
    console.log('[Verification Store] Submitting verification request...')
    isSubmitting.value = true
    error.value = null

    try {
      const response = await $fetch('/api/verified/request', {
        method: 'POST',
        body: data
      })
      
      if (response) {
        badgeRequest.value = response
        verificationStatus.value = 'pending'
        console.log('[Verification Store] ✅ Request submitted successfully')
      }
    } catch (err: any) {
      console.error('[Verification Store] ❌ Failed to submit request:', err.message)
      error.value = err.message
    } finally {
      isSubmitting.value = false
    }
  }

  // ============================================================================
  // ACTIONS - CLEAR
  // ============================================================================
  
  const clearError = () => {
    console.log('[Verification Store] Clearing error')
    error.value = null
  }

  const reset = () => {
    console.log('[Verification Store] Resetting verification store')
    verificationStatus.value = 'none'
    badgeRequest.value = null
    error.value = null
    isLoading.value = false
    isSubmitting.value = false
  }

  return {
    // State
    verificationStatus,
    badgeRequest,
    isLoading,
    error,
    isSubmitting,

    // Computed
    isPending,
    isApproved,
    isRejected,
    canSubmitRequest,

    // Methods
    fetchVerificationStatus,
    submitVerificationRequest,
    clearError,
    reset
  }
})
