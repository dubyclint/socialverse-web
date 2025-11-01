// FILE: /stores/auth.ts - UPDATE
// Authentication store
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isEmailVerified = computed(() => user.value?.profile?.email_verified || false)
  const isProfileCompleted = computed(() => user.value?.profile?.profile_completed || false)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
  }

  const setUser = (newUser: User) => {
    user.value = newUser
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
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
    clearAuth
  }
})
