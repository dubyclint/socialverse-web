// stores/user.ts - UPDATED VERSION WITH PERMISSIONS AND REAL-TIME SERVICES
import { defineStore } from 'pinia'
import { ref, computed, watch, readonly } from 'vue'

export const useUserStore = defineStore('user', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  const profile = ref<any>(null)
  const permissions = ref<string[]>([])
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
        // ✅ NEW: Load permissions after profile
        await loadPermissions()
        // ✅ NEW: Initialize real-time services
        await initializeRealTimeServices()
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
  
  // ✅ NEW: Load permissions based on user role
  const loadPermissions = async () => {
    if (!profile.value) return

    try {
      const { data, error: fetchError } = await supabase
        .from('roles')
        .select('permissions')
        .eq('name', profile.value.role)
        .single()

      if (fetchError) {
        console.warn('Permissions load error:', fetchError)
        permissions.value = getDefaultPermissions(profile.value.role)
        return
      }

      permissions.value = (data?.permissions as string[]) || []
      
      if (profile.value.role === 'manager' && profile.value.manager_permissions) {
        permissions.value = [...new Set([...permissions.value, ...profile.value.manager_permissions])]
      }
    } catch (err: any) {
      console.error('Permissions load error:', err)
      permissions.value = getDefaultPermissions(profile.value?.role || 'user')
    }
  }

  // ✅ NEW: Default permissions by role
  const getDefaultPermissions = (role: string): string[] => {
    const defaultPerms: Record<string, string[]> = {
      admin: ['*'],
      manager: ['read', 'write', 'moderate', 'manage_users'],
      user: ['read', 'write', 'comment', 'like']
    }
    return defaultPerms[role] || defaultPerms['user']
  }

  // ✅ NEW: Initialize real-time services
  const initializeRealTimeServices = async () => {
    if (!user.value?.id || !profile.value) {
      console.warn('[User Store] Cannot initialize real-time services: user or profile not ready')
      return
    }

    try {
      const nuxtApp = useNuxtApp()
      
      if (nuxtApp.$initializeGun) {
        console.log('[User Store] Initializing Gun with user context')
        nuxtApp.$initializeGun()
      }

      if (nuxtApp.$initializeSocket) {
        console.log('[User Store] Initializing Socket.io with user context')
        nuxtApp.$initializeSocket()
      }
    } catch (err: any) {
      console.error('[User Store] Real-time services initialization error:', err)
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
      // ✅ NEW: Reload permissions after profile update
      await loadPermissions()
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
    permissions.value = []
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
    permissions: readonly(permissions),
    loading: readonly(loading),
    error: readonly(error),
    isAdmin,
    isAuthenticated,
    initializeSession,
    fetchProfile,
    loadPermissions,
    updateProfile,
    clearProfile,
    initializeRealTimeServices
  }
})
