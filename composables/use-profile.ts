// ============================================================================
// FILE: /composables/use-profile.ts
// Description: User Profile Orchestration Engine - Handles queries, uploads,
//              and data normalizations with dynamic runtime store lazy loading.
// ============================================================================
import { useNuxtApp } from '#app'
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type {
  Profile,
  ProfileUpdateInput,
  ProfileCompleteInput,
  Interest,
  ApiResponse
} from '~/types/profile'

const unwrap = <T>(res: any): T => {
  return (res?.data ?? res) as T
}

export const useProfile = () => {
  const route = useRoute()
  const router = useRouter()

  // API State
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Local Component View States
  const displayProfile = ref<any>({})
  const activeTab = ref('posts')
  const isFollowing = ref(false)
  const verificationBadges = ref<any[]>([])
  const userPosts = ref<any[]>([])
  const mediaPosts = ref<any[]>([])
  const likedPosts = ref<any[]>([])

  // Modal Control Triggers
  const showEditProfile = ref(false)
  const showGeneralSettings = ref(false)
  const showAvatarUpload = ref(false)
  const showCreatePost = ref(false)

  // ============================================================================
  // LAZY STORE RESOLVERS (Safely breaks the module-level dependency graph)
  // ============================================================================
  let _cachedProfileStore: any = null
  let _cachedAuthStore: any = null

  const getProfileStore = async () => {
    if (_cachedProfileStore) return _cachedProfileStore
    const { useProfileStore } = await import('~/stores/profile')
    _cachedProfileStore = useProfileStore()
    return _cachedProfileStore
  }

  const getAuthStore = async () => {
    if (_cachedAuthStore) return _cachedAuthStore
    const { useAuthStore } = await import('~/stores/auth')
    _cachedAuthStore = useAuthStore()
    return _cachedAuthStore
  }

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================
  const currentProfile = computed(() => _cachedProfileStore?.profile || null)
  const isLoading = computed(() => loading.value)
  const errorMessage = computed(() => error.value)
  const isOwnProfile = computed(() => route?.path === '/profile')

  const tabs = computed(() => {
    const base = [
      { id: 'posts', label: 'Posts', icon: 'grid' },
      { id: 'media', label: 'Media', icon: 'image' }
    ]
    if (isOwnProfile.value) base.push({ id: 'likes', label: 'Likes', icon: 'heart' })
    return base
  })

  // ============================================================================
  // HELPERS & ACTIONS
  // ============================================================================
  
  /**
   * Helper to append bearer authorizations dynamically from token state
   */
  const getAuthHeaders = () => {
    return _cachedAuthStore?.token ? { Authorization: `Bearer ${_cachedAuthStore.token}` } : undefined
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return String(num || 0)
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getBadgeIcon = (type: string) => {
    const icons: Record<string, string> = { verified: 'check-circle', premium: 'star', developer: 'code' }
    return icons[type] || 'check'
  }

  const toggleFollow = async () => { isFollowing.value = !isFollowing.value }
  const openVerificationDetails = (_badge: any) => {}
  const openMediaModal = (_post: any) => {}

  /**
   * Canonical API Orchestration for matching authenticated profile metrics
   */
  const fetchProfileData = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const profileStore = await getProfileStore()
      const authStore = await getAuthStore()

      const res = await $fetch<ApiResponse<Profile> | Profile>('/api/profile/me', {
        headers: getAuthHeaders()
      })

      const profile = unwrap<Profile>(res)
      if (!profile?.user_id && !profile?.id) {
        await router.replace('/profile/complete')
        return
      }

      profileStore.setProfile(profile)
      
      // Reconciled Field Name Mismatch Runtime Safety
      displayProfile.value = {
        ...profile,
        full_name: profile.full_name || profile.display_name || '',
        display_name: profile.display_name || profile.full_name || '',
        avatar_url: profile.avatar_url || '/default-avatar.svg'
      }
    } catch (err: any) {
      const status = err?.status || err?.response?.status || err?.statusCode
      if (status === 404) {
        await router.replace('/profile/complete')
        return
      }
      if (status === 401) {
        await router.replace('/auth/login')
        return
      }
      error.value = err?.statusMessage || err?.message || 'Failed to load profile'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch target user profiles safely by unique identifier maps
   */
  const fetchProfileById = async (id: string): Promise<Profile | null> => {
    loading.value = true
    error.value = null
    try {
      if (!id?.trim()) throw new Error('Profile id is required')
      await getAuthStore() // Hydrate credentials context beforehand

      const res = await $fetch<ApiResponse<Profile> | Profile>(`/api/profile/${encodeURIComponent(id.trim())}`, {
        headers: getAuthHeaders()
      })
      return unwrap<Profile>(res)
    } catch (err: any) {
      error.value = err?.statusMessage || err?.message || 'Failed to fetch profile'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Commit customized transformations onto back-end profile records
   */
  const updateProfile = async (updates: ProfileUpdateInput): Promise<Profile | null> => {
    loading.value = true
    error.value = null
    try {
      if (updates.full_name !== undefined && !updates.full_name.trim()) throw new Error('Full name cannot be empty')
      
      const profileStore = await getProfileStore()
      await getAuthStore()

      const res = await $fetch<ApiResponse<Profile> | Profile>('/api/profile/update', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: updates
      })
      const updated = unwrap<Profile>(res)
      profileStore.setProfile(updated)

      // PROACTIVE NORMALIZATION: Keep localized display reference normalized inside mutation callbacks
      displayProfile.value = {
        ...updated,
        full_name: updated.full_name || updated.display_name || '',
        display_name: updated.display_name || updated.full_name || '',
        avatar_url: updated.avatar_url || '/default-avatar.svg'
      }

      return updated
    } catch (err: any) {
      error.value = err?.statusMessage || err?.message || 'Failed to update profile'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Finish setting up registration records for fresh member sessions
   */
  const completeProfile = async (payload: ProfileCompleteInput): Promise<Profile | null> => {
    loading.value = true
    error.value = null
    try {
      if (!payload.full_name?.trim()) throw new Error('Full name is required')
      
      const profileStore = await getProfileStore()
      await getAuthStore()

      const res = await $fetch<ApiResponse<Profile> | Profile>('/api/profile/complete', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: payload
      })
      const completed = unwrap<Profile>(res)
      profileStore.setProfile(completed)

      displayProfile.value = {
        ...completed,
        full_name: completed.full_name || completed.display_name || '',
        display_name: completed.display_name || completed.full_name || '',
        avatar_url: completed.avatar_url || '/default-avatar.svg'
      }

      return completed
    } catch (err: any) {
      error.value = err?.statusMessage || err?.message || 'Failed to complete profile'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload image graphics targets into target cloud storage spaces
   */
  const uploadAvatar = async (file: File): Promise<{ avatar_url: string } | null> => {
    loading.value = true
    error.value = null
    try {
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowed.includes(file.type)) throw new Error('Invalid file type')
      if (file.size > 5 * 1024 * 1024) throw new Error('File size exceeds 5MB')

      const profileStore = await getProfileStore()
      await getAuthStore()

      const formData = new FormData()
      formData.append('file', file)

      const res = await $fetch<ApiResponse<{ avatar_url: string }> | { avatar_url: string }>(
        '/api/profile/avatar-upload',
        { method: 'POST', headers: getAuthHeaders(), body: formData }
      )

      const data = unwrap<{ avatar_url: string }>(res)
      if (profileStore.profile && data?.avatar_url) {
        const structuralUpdate = { ...profileStore.profile, avatar_url: data.avatar_url }
        profileStore.setProfile(structuralUpdate)

        displayProfile.value = {
          ...displayProfile.value,
          ...structuralUpdate,
          full_name: displayProfile.value.full_name || displayProfile.value.display_name || '',
          display_name: displayProfile.value.display_name || displayProfile.value.full_name || '',
          avatar_url: data.avatar_url
        }
      }
      return data
    } catch (err: any) {
      error.value = err?.statusMessage || err?.message || 'Failed to upload avatar'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch active tag classifications
   */
  const fetchInterests = async (): Promise<Interest[]> => {
    loading.value = true
    error.value = null
    try {
      await getAuthStore()
      const res = await $fetch<ApiResponse<{ interests: Interest[] }> | Interest[]>('/api/profile/interests', {
        headers: getAuthHeaders()
      })
      const data: any = unwrap<any>(res)
      return Array.isArray(data) ? data : data?.interests || []
    } catch (err: any) {
      error.value = err?.statusMessage || err?.message || 'Failed to fetch interests'
      return []
    } finally {
      loading.value = false
    }
  }

  // Pre-load data maps on client cycles gently
  if (process.client) {
    getProfileStore().catch(() => console.warn('[Profile Composable] Initial sync deferred.'))
    getAuthStore().catch(() => console.warn('[Profile Composable] Identity sync deferred.'))
  }

  return {
    loading,
    error,
    currentProfile,
    isLoading,
    errorMessage,
    displayProfile,
    activeTab,
    isFollowing,
    verificationBadges,
    userPosts,
    mediaPosts,
    likedPosts,
    showEditProfile,
    showGeneralSettings,
    showAvatarUpload,
    showCreatePost,
    isOwnProfile,
    tabs,
    formatNumber,
    formatDate,
    getBadgeIcon,
    toggleFollow,
    openVerificationDetails,
    openMediaModal,
    fetchProfileData,
    fetchProfileById,
    updateProfile,
    completeProfile,
    uploadAvatar,
    fetchInterests
  }
}
