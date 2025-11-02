// FILE: /stores/auth.ts - COMPLETE WORKING VERSION
// Authentication store with Pinia
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // Initialize from localStorage
  const token = ref<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  )
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isEmailVerified = computed(() => user.value?.profile?.email_verified || false)
  const isProfileCompleted = computed(() => user.value?.profile?.profile_completed || false)

  const setToken = (newToken: string) => {
    token.value = newToken
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', newToken)
    }
  }

  const setUser = (newUser: User) => {
    user.value = newUser
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  const updateUser = (updates: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...updates }
    }
  }

  return {
    token,
    user,
    isLoading,
    isAuthenticated,
    isEmailVerified,
    isProfileCompleted,
    setToken,
    setUser,
    clearAuth,
    updateUser
  }
})

