// stores/profile.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile, ProfileUpdateInput, ProfileCompleteInput } from '~/types/profile'

export const useProfileStore = defineStore('profile', () => {
  // ... (Keep your state and computed properties as they are)

  // Private Helper for Auth Ceremony
  const _getAuth = async () => (await import('~/stores/auth')).useAuthStore()
  
  const withAuth = async <T>(action: (auth: any, headers: any) => Promise<T>): Promise<T | null> => {
    try {
      const auth = await _getAuth()
      if (!auth.token || !auth.userId) throw new Error('Authentication required')
      const headers = { Authorization: `Bearer ${auth.token}` }
      return await action(auth, headers)
    } catch (err: any) {
      error.value = err.message
      return null
    }
  }

  // ... (Include your normalizeProfile, broadcastProfileUpdate, etc)
 // --- Settings Specific Methods ---
  const updateStreamConfig = async (data: { title: string; quality: string }) => {
    return await withAuth(async (auth, headers) => {
      const client = useSupabaseClient()
      const { data: updated, error: err } = await client
        .from('profiles')
        .update({ default_stream_title: data.title, stream_quality: data.quality })
        .eq('id', auth.userId)
        .select()
        .single()

      if (err) throw err
      const normalized = normalizeProfile(updated)
      if (normalized) profile.value = normalized
      return normalized
    })
  }

  const rotateStreamKey = async () => {
    const newKey = `live_sk_${crypto.randomUUID().replace(/-/g, '')}`
    const result = await withAuth(async (auth) => {
      const { error: err } = await useSupabaseClient()
        .from('profiles')
        .update({ stream_key: newKey })
        .eq('id', auth.userId)

      if (err) throw err
      if (profile.value) profile.value.stream_key = newKey
      return newKey
    })
    return result || ''
  }

  // --- Standardized API Methods (Example Refactor) ---
  const updateProfile = async (updates: ProfileUpdateInput) => {
    return await withAuth(async (_, headers) => {
      const res = await $fetch('/api/profile/update', { method: 'POST', headers, body: updates })
      const normalized = normalizeProfile(res)
      if (normalized) profile.value = normalized
      return normalized
    })
  }

  return {
    profile,
    // ... all other states/computed
    fetchProfile,
    updateProfile,
    updateStreamConfig,
    rotateStreamKey,
    completeProfile,
    uploadAvatar,
    hydrateFromStorage
  }
})
                                        
