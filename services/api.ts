// ============================================================================
// FILE: /services/api.ts - CENTRALIZED NETWORK ORCHESTRATOR
// ============================================================================
import { ofetch } from 'ofetch'

// Create a configured fetch instance
export const api = ofetch.create({
  baseURL: '/api',
  async onRequest({ options }) {
    // 1. Get the auth store dynamically to avoid circular dependencies
    const { useAuthStore } = await import('~/stores/auth')
    const auth = useAuthStore()

    // 2. Inject Authorization headers if token exists
    if (auth.token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${auth.token}`
      }
    }
  },
  onResponseError({ response }) {
    // 3. Centralized Error Handling
    if (response.status === 401) {
      console.warn('[API Service] Unauthorized - Redirecting or clearing session...')
      // Trigger a redirect or call your auth logout method here
    }
    
    if (response.status >= 500) {
      console.error('[API Service] Server error:', response._data?.message || 'Internal Server Error')
    }
  }
})

/**
 * Helper to unwrap standard backend responses
 */
export const unwrap = <T>(res: any): T => (res?.data ?? res) as T

import { api, unwrap } from './api'
import type { Profile } from '~/types/profile'

export const profileService = {
  async getMe(): Promise<Profile> {
    const res = await api('/profile/me')
    return unwrap<Profile>(res)
  },

  async update(payload: any): Promise<Profile> {
    const res = await api('/profile/update', { 
      method: 'POST', 
      body: payload 
    })
    return unwrap<Profile>(res)
  }
}
