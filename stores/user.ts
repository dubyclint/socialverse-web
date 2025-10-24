// stores/user.ts - FIXED VERSION
import { defineStore } from 'pinia'
import { ref, computed, watch, readonly } from 'vue'

export const useUserStore = defineStore('user', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  const profile = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isAuthenticated = computed(() => !!user.value?.id)
  
  const initializeSession = async () => {
    try {
      loading.value = true
      error.value = null
      
      // Fetch current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.id) {
        await fetchProfile(session.user.id)
      }
    } catch (err: any) {
      console.error('Session initialization error:', err)
      error.value = err.message || 'Failed to initialize session'
    } finally {
      loading.value = false
    }
  }
  
  const fetchProfile = async (userId?: string) => {
    const targetUserId = userId || user.value?.id
    
    // CRITICAL: Validate user ID exists and is not undefined
    if (!targetUserId) {
      console.warn('[User Store] User ID is not available for profile fetch')
      profile.value = null
      return
    }
    
    try {
      loading.value = true
      error.value = null
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()
      
      // Handle "no rows" error gracefully
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No profile exists yet, create empty profile object
          console.log('[User Store] No profile found, creating default profile')
          profile.value = {
            id: targetUserId,
            display_name: '',
            avatar_url: null,
            bio: '',
            role: 'user',
            created_at: new Date().toISOString()
          }
          return
        }
        throw fetchError
      }
      
      profile.value = data
    } catch (err: any) {
      console.error('[User Store] Profile fetch error:', err)
      error.value = err.message || 'Failed to fetch profile'
      // Set default profile on error
      profile.value = {
        id: targetUserId,
        display_name: '',
        avatar_url: null,
        bio: '',
        role: 'user'
      }
    } finally {
      loading.value = false
    }
  }
  
  const updateProfile = async (updates: any) => {
    const userId = user.value?.id
    
    if (!userId) {
      error.value = 'User ID is required to update profile'
      throw new Error('User ID is required')
    }
    
    try {
      loading.value = true
      error.value = null
      
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        })
      
      if (updateError) throw updateError
      
      // Refresh profile after update
      await fetchProfile(userId)
    } catch (err: any) {
      console.error('[User Store] Profile update error:', err)
      error.value = err.message || 'Failed to update profile'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const clearProfile = () => {
    profile.value = null
    error.value = null
  }
  
  // Watch for user changes and fetch profile
  watch(
    () => user.value?.id,
    (newUserId) => {
      if (newUserId) {
        fetchProfile(newUserId)
      } else {
        clearProfile()
      }
    },
    { immediate: true }
  )
  
  return {
    user: readonly(user),
    profile: readonly(profile),
    loading: readonly(loading),
    error: readonly(error),
    isAdmin,
    isAuthenticated,
    initializeSession,
    fetchProfile,
    updateProfile,
    clearProfile
  }
})
        


