import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Profile, ProfileUpdateInput, ProfileCompleteInput } from '~/types/profile'

const unwrap = <T>(res: any): T => (res?.data ?? res) as T

const broadcastProfileUpdate = (profile: Profile) => {
  if (process.client && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('profile_sync_events')
      channel.postMessage({ type: 'PROFILE_UPDATED', payload: profile })
      channel.close()
    } catch (e) {
      console.error('[Profile Store] Broadcast error:', e)
    }
  }
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const profileMissing = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isHydrated = ref(false)

  const isUploadingAvatar = ref(false)
  const uploadAvatarProgress = ref(0)
  const uploadAvatarError = ref<string | null>(null)

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================
  const username = computed(() => profile.value?.username || '')
  const displayName = computed(() => profile.value?.display_name || profile.value?.full_name || '')
  const avatar = computed(() => profile.value?.avatar_url || '/default-avatar.svg')
  const bio = computed(() => profile.value?.bio || '')
  const location = computed(() => profile.value?.location || '')
  const website = computed(() => profile.value?.website || '')
  const interests = computed(() => profile.value?.interests || [])
  const colors = computed(() => profile.value?.colors || {})
  const items = computed(() => profile.value?.items || [])

  const rank = computed(() => profile.value?.rank || 'Bronze I')
  const rankPoints = computed(() => profile.value?.rank_points || 0)
  const rankLevel = computed(() => profile.value?.rank_level || 1)

  const isVerified = computed(() => !!profile.value?.is_verified)
  const verifiedBadgeType = computed(() => profile.value?.verified_badge_type || null)
  const verificationStatus = computed(() => profile.value?.verification_status || 'none')
  const badgeCount = computed(() => profile.value?.badge_count || 0)
  const verifiedAt = computed(() => profile.value?.verified_at || null)

  const isProfileComplete = computed(() => !!profile.value?.profile_completed && (!!profile.value?.full_name || !!profile.value?.display_name))
  const hasAvatar = computed(() => !!profile.value?.avatar_url)

  // ============================================================================
  // HELPERS
  // ============================================================================
  const storageKeyForUser = (uid: string) => `profile_data:${uid}`

  const normalizeProfile = (raw: any): Profile | null => {
    if (!raw) return null
    const rawId = raw.id || raw.user_id
    return {
      ...raw,
      id: rawId,
      user_id: rawId,
      full_name: raw.full_name || raw.display_name || '',
      display_name: raw.display_name || raw.full_name || ''
    } as Profile
  }

  // ✅ SAFELY EXTRACTED: Pinia lazy dynamic evaluation
  const getAuthStore = async () => {
    try {
      const { useAuthStore } = await import('~/stores/auth')
      return useAuthStore()
    } catch (err) {
      console.error('[Profile Store] Failed to import auth store:', err)
      return null
    }
  }

  const ensureOwnedByAuthUser = async (candidate: Profile | null): Promise<boolean> => {
    try {
      const authStore = await getAuthStore()
      if (!authStore) return false
      
      const authUserId = authStore.userId || authStore.user?.id
      if (!candidate || !authUserId) return false
      return String(candidate.id) === String(authUserId) || String(candidate.user_id) === String(authUserId)
    } catch (err) {
      console.warn('[Profile Store] ensureOwnedByAuthUser error:', err)
      return false
    }
  }

  const authHeaders = async () => {
    try {
      const authStore = await getAuthStore()
      if (!authStore) return undefined
      return authStore.token ? { Authorization: `Bearer ${authStore.token}` } : undefined
    } catch (err) {
      console.warn('[Profile Store] authHeaders error:', err)
      return undefined
    }
  }

  const setLoading = (v: boolean) => (isLoading.value = v)
  const setError = (e: string | null) => (error.value = e)

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const setProfile = async (newProfile: Profile | null) => {
    try {
      if (!newProfile) {
        profile.value = null
        profileMissing.value = true
        return
      }

      const normalized = normalizeProfile(newProfile)
      if (!normalized) return

      const authStore = await getAuthStore()
      if (!authStore) {
        console.warn('[Profile Store] setProfile blocked: auth store unavailable')
        return
      }

      const authUserId = authStore.userId || authStore.user?.id
      if (!authUserId) {
        console.warn('[Profile Store] setProfile blocked: auth user missing')
        return
      }

      const owner = normalized.id || normalized.user_id
      if (!owner || String(owner) !== String(authUserId)) {
        console.warn('[Profile Store] setProfile blocked: profile owner mismatch', { authUserId, owner })
        return
      }

      // Perform the mutations inside the tick cleanly
      profile.value = normalized
      profileMissing.value = false

      if (process.client) {
        try {
          localStorage.setItem(storageKeyForUser(String(authUserId)), JSON.stringify(normalized))
        } catch (err) {
          console.error('[Profile Store] Failed to store profile:', err)
        }
      }

      if (normalized.profile_completed) {
        broadcastProfileUpdate(normalized)
      }
    } catch (err) {
      console.error('[Profile Store] setProfile error:', err)
    }
  }

  const clearProfile = () => {
    profile.value = null
    profileMissing.value = false
    isLoading.value = false
    error.value = null
    isUploadingAvatar.value = false
    uploadAvatarProgress.value = 0
    uploadAvatarError.value = null
    isHydrated.value = true
  }

  const clearAllProfileCache = () => {
    if (!process.client) return
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('profile_data:')) keysToRemove.push(key)
      }
      keysToRemove.push('profile_data')
      keysToRemove.forEach((k) => localStorage.removeItem(k))
    } catch (err) {
      console.error('[Profile Store] Failed clearing profile cache:', err)
    }
  }

  // ============================================================================
  // API METHODS
  // ============================================================================
  const fetchProfile = async () => {
    try {
      const authStore = await getAuthStore()
      if (!authStore) {
        setError('Auth store unavailable')
        return null
      }

      const authUserId = authStore.userId || authStore.user?.id
      if (!authStore.token || !authUserId) {
        setError('Authentication required')
        return null
      }

      setLoading(true)
      setError(null)
      
      const headers = await authHeaders()
      const res = await $fetch('/api/profile/me', { headers })
      const normalized = normalizeProfile(unwrap<Profile>(res))
      
      if (!normalized) {
        profile.value = null
        profileMissing.value = true
        return null
      }

      const owner = normalized.id || normalized.user_id
      if (!owner || String(owner) !== String(authUserId)) {
        setError('Profile ownership mismatch')
        profile.value = null
        return null
      }

      await setProfile(normalized)
      return normalized
    } catch (err: any) {
      const statusCode = err?.statusCode || err?.response?.status

      if (statusCode === 404) {
        profile.value = null
        profileMissing.value = true
        return null
      }

      setError(err?.statusMessage || err?.data?.message || err?.message || 'Failed to fetch profile')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: ProfileUpdateInput) => {
    try {
      const authStore = await getAuthStore()
      if (!authStore) {
        setError('Auth store unavailable')
        return null
      }

      if (!authStore.token || !authStore.userId) {
        setError('Authentication required')
        return null
      }

      setLoading(true)
      setError(null)
      
      const headers = await authHeaders()
      const res = await $fetch('/api/profile/update', {
        method: 'POST',
        headers,
        body: updates
      })

      const normalized = normalizeProfile(unwrap<Profile>(res))
      if (normalized) await setProfile(normalized)
      return normalized
    } catch (err: any) {
      setError(err?.statusMessage || err?.data?.message || err?.message || 'Failed to update profile')
      return null
    } finally {
      setLoading(false)
    }
  }

  const completeProfile = async (payload: ProfileCompleteInput) => {
    try {
      const authStore = await getAuthStore()
      if (!authStore) {
        setError('Auth store unavailable')
        return null
      }

      if (!authStore.token || !authStore.userId) {
        setError('Authentication required')
        return null
      }

      setLoading(true)
      setError(null)
      
      const headers = await authHeaders()
      const res = await $fetch('/api/profile/complete', {
        method: 'POST',
        headers,
        body: payload
      })

      const normalized = normalizeProfile(unwrap<Profile>(res))
      if (normalized) await setProfile(normalized)
      return normalized
    } catch (err: any) {
      setError(err?.statusMessage || err?.data?.message || err?.message || 'Failed to complete profile')
      return null
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      const authStore = await getAuthStore()
      if (!authStore) {
        setError('Auth store unavailable')
        return null
      }

      if (!authStore.token || !authStore.userId) {
        setError('Authentication required')
        return null
      }

      isUploadingAvatar.value = true
      uploadAvatarError.value = null
      uploadAvatarProgress.value = 10

      const formData = new FormData()
      formData.append('file', file)

      const headers = await authHeaders()
      const res = await $fetch('/api/profile/avatar-upload', {
        method: 'POST',
        headers,
        body: formData
      })

      uploadAvatarProgress.value = 80
      const data = unwrap<{ avatar_url: string }>(res)

      if (!data?.avatar_url) {
        throw new Error('Avatar upload returned no avatar_url')
      }

      if (profile.value) {
        await setProfile({
          ...profile.value,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString()
        })
      }

      uploadAvatarProgress.value = 100
      return data
    } catch (err: any) {
      uploadAvatarError.value = err?.statusMessage || err?.data?.message || err?.message || 'Failed to upload avatar'
      return null
    } finally {
      isUploadingAvatar.value = false
    }
  }

  const addInterest = async (interest: string) => {
    try {
      const authStore = await getAuthStore()
      if (!authStore) {
        setError('Auth store unavailable')
        return null
      }

      if (!authStore.token || !authStore.userId) {
        setError('Authentication required')
        return null
      }

      setLoading(true)
      setError(null)
      
      const headers = await authHeaders()
      const res = await $fetch('/api/interests/add', {
        method: 'POST',
        headers,
        body: { interest }
      })

      const normalized = normalizeProfile(unwrap<Profile>(res))
      if (normalized) await setProfile(normalized)
      return normalized
    } catch (err: any) {
      setError(err?.statusMessage || err?.data?.message || err?.message || 'Failed to add interest')
      return null
    } finally {
      setLoading(false)
    }
  }

  const removeInterest = async (interest: string) => {
    try {
      const authStore = await getAuthStore()
      if (!authStore) {
        setError('Auth store unavailable')
        return null
      }

      if (!authStore.token || !authStore.userId) {
        setError('Authentication required')
        return null
      }

      setLoading(true)
      setError(null)
      
      const headers = await authHeaders()
      const res = await $fetch('/api/interests/remove', {
        method: 'POST',
        headers,
        body: { interest }
      })

      const normalized = normalizeProfile(unwrap<Profile>(res))
      if (normalized) await setProfile(normalized)
      return normalized
    } catch (err: any) {
      setError(err?.statusMessage || err?.data?.message || err?.message || 'Failed to remove interest')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function hydrateFromStorage() {
    if (!process.client || isHydrated.value) return

    try {
      const authStore = await getAuthStore()
      if (!authStore) {
        profile.value = null
        profileMissing.value = true
        isHydrated.value = true
        return
      }

      const authUserId = authStore.userId || authStore.user?.id

      if (!authUserId) {
        profile.value = null
        profileMissing.value = true
        isHydrated.value = true
        return
      }

      const scopedKey = storageKeyForUser(String(authUserId))
      const storedProfile = localStorage.getItem(scopedKey)

      if (localStorage.getItem('profile_data')) {
        localStorage.removeItem('profile_data')
      }

      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile)
          const normalized = normalizeProfile(parsed)

          if (normalized && await ensureOwnedByAuthUser(normalized)) {
            profile.value = normalized
            profileMissing.value = false
          } else {
            localStorage.removeItem(scopedKey)
            profile.value = null
            profileMissing.value = true
          }
        } catch {
          localStorage.removeItem(scopedKey)
          profile.value = null
          profileMissing.value = true
        }
      } else {
        profileMissing.value = true
      }

      isHydrated.value = true
    } catch (err) {
      console.error('[Profile Store] Hydration error:', err)
      isHydrated.value = true
    }
  }

  return {
    profile,
    profileMissing,
    isLoading,
    error,
    isHydrated,
    isUploadingAvatar,
    uploadAvatarProgress,
    uploadAvatarError,

    username,
    displayName,
    avatar,
    bio,
    location,
    website,
    interests,
    colors,
    items,
    rank,
    rankPoints,
    rankLevel,
    isVerified,
    verifiedBadgeType,
    verificationStatus,
    badgeCount,
    verifiedAt,
    isProfileComplete,
    hasAvatar,

    setProfile,
    clearProfile,
    clearAllProfileCache,
    fetchProfile,
    updateProfile,
    completeProfile,
    uploadAvatar,
    addInterest,
    removeInterest,
    hydrateFromStorage,
    setLoading,
    setError
  }
})
