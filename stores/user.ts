// FILE: /stores/user.ts - MERGED STORE (Individual User + User Management)
// ✅ FIXED - Properly handles useSupabaseUser() and getSupabaseClient()
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed, watch, readonly } from 'vue'
import { getSupabaseClient } from '~/lib/supabase-factory'

// ============ INTERFACES ============
interface UserProfile {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  role: 'user' | 'manager' | 'admin'
  status: 'active' | 'suspended' | 'banned' | 'warned'
  created_at: string
  updated_at: string
  last_login?: string
  assigned_by?: string
  manager_permissions?: string[]
  manager_assigned_at?: string
  phone?: string
  bio?: string
  location?: string
  website?: string
  preferences?: Record<string, any>
  metadata?: Record<string, any>
  email_verified?: boolean
}

interface UserFilters {
  search?: string
  role?: string
  status?: string
  page?: number
  limit?: number
}

interface UsersState {
  users: UserProfile[]
  managers: UserProfile[]
  totalUsers: number
  totalManagers: number
  loading: boolean
  error: string | null
  filters: UserFilters
}

// ============ INDIVIDUAL USER STORE ============
export const useUserStore = defineStore('user', () => {
  // ✅ FIXED: Don't call useSupabaseUser() at store initialization
  // Instead, we'll get the user from Supabase auth when needed
  const supabase = getSupabaseClient()
  
  const profile = ref<any>(null)
  const permissions = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUser = ref<any>(null)
  
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isAuthenticated = computed(() => !!currentUser.value?.id)
  
  // ✅ NEW: Get current user from Supabase auth
  const getCurrentUser = async () => {
    if (!supabase) {
      console.error('[User Store] Supabase client not available')
      return null
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      currentUser.value = user
      return user
    } catch (err: any) {
      console.error('[User Store] Failed to get current user:', err)
      currentUser.value = null
      return null
    }
  }
  
  const initializeSession = async () => {
    try {
      loading.value = true
      error.value = null
      
      if (!supabase) {
        console.error('[User Store] Supabase client not available')
        error.value = 'Supabase client not available'
        return
      }
      
      // ✅ FIXED: Get current user from auth
      const user = await getCurrentUser()
      
      if (user?.id) {
        await fetchProfile(user.id)
        // ✅ Load permissions after profile
        await loadPermissions()
        // ✅ Initialize real-time services
        await initializeRealTimeServices()
      }
    } catch (err: any) {
      console.error('[User Store] Session initialization error:', err)
      error.value = err.message || 'Failed to initialize session'
    } finally {
      loading.value = false
    }
  }
  
  const fetchProfile = async (userId?: string) => {
    const targetUserId = userId || currentUser.value?.id
    
    // CRITICAL: Validate user ID exists and is not undefined
    if (!targetUserId) {
      console.warn('[User Store] User ID is not available for profile fetch')
      profile.value = null
      return
    }
    
    if (!supabase) {
      console.error('[User Store] Supabase client not available')
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
      console.log('[User Store] Profile fetched successfully')
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
  
  // ✅ Load permissions based on user role
  const loadPermissions = async () => {
    if (!profile.value || !supabase) return

    try {
      const { data, error: fetchError } = await supabase
        .from('roles')
        .select('permissions')
        .eq('name', profile.value.role)
        .single()

      if (fetchError) {
        console.warn('[User Store] Permissions load error:', fetchError)
        permissions.value = getDefaultPermissions(profile.value.role)
        return
      }

      permissions.value = (data?.permissions as string[]) || []
      
      if (profile.value.role === 'manager' && profile.value.manager_permissions) {
        permissions.value = [...new Set([...permissions.value, ...profile.value.manager_permissions])]
      }
      
      console.log('[User Store] Permissions loaded:', permissions.value)
    } catch (err: any) {
      console.error('[User Store] Permissions load error:', err)
      permissions.value = getDefaultPermissions(profile.value?.role || 'user')
    }
  }

  // ✅ Default permissions by role
  const getDefaultPermissions = (role: string): string[] => {
    const defaultPerms: Record<string, string[]> = {
      admin: ['*'],
      manager: ['read', 'write', 'moderate', 'manage_users'],
      user: ['read', 'write', 'comment', 'like']
    }
    return defaultPerms[role] || defaultPerms['user']
  }

  // ✅ Initialize real-time services
  const initializeRealTimeServices = async () => {
    if (!currentUser.value?.id || !profile.value) {
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
    const userId = currentUser.value?.id
    
    if (!userId) {
      error.value = 'User ID is required to update profile'
      throw new Error('User ID is required')
    }
    
    if (!supabase) {
      error.value = 'Supabase client not available'
      throw new Error('Supabase client not available')
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
      // Reload permissions after profile update
      await loadPermissions()
      
      console.log('[User Store] Profile updated successfully')
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
    currentUser.value = null
    error.value = null
  }
  
  // ============ USER MANAGEMENT FUNCTIONS (from useUsersStore) ============
  
  // State for user management
  const users = ref<UserProfile[]>([])
  const managers = ref<UserProfile[]>([])
  const totalUsers = ref(0)
  const totalManagers = ref(0)
  const filters = ref<UserFilters>({ page: 1, limit: 20 })
  
  // Getters for user management
  const filteredUsers = computed(() => {
    let filtered = users.value
    
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(search) ||
        u.username?.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      )
    }
    if (filters.value.role) {
      filtered = filtered.filter(u => u.role === filters.value.role)
    }
    if (filters.value.status) {
      filtered = filtered.filter(u => u.status === filters.value.status)
    }
    return filtered
  })
  
  const activeUsers = computed(() => users.value.filter(u => u.status === 'active'))
  const suspendedUsers = computed(() => users.value.filter(u => u.status === 'suspended'))
  
  const getUserById = (id: string) => users.value.find(u => u.id === id)
  const getManagerById = (id: string) => managers.value.find(m => m.id === id)
  
  const totalPages = computed(() => Math.ceil(totalUsers.value / (filters.value.limit || 20)))
  
  // Actions for user management
  const loadUsers = async (filterParams: UserFilters = {}) => {
    if (!supabase) {
      error.value = 'Supabase client not available'
      console.error('[User Store] Supabase client not available')
      return
    }

    try {
      loading.value = true
      error.value = null
      filters.value = { ...filters.value, ...filterParams }

      let query = supabase.from('profiles').select('*', { count: 'exact' })

      if (filters.value.search) {
        query = query.or(`full_name.ilike.%${filters.value.search}%,username.ilike.%${filters.value.search}%,email.ilike.%${filters.value.search}%`)
      }
      if (filters.value.role) query = query.eq('role', filters.value.role)
      if (filters.value.status) query = query.eq('status', filters.value.status)

      const from = ((filters.value.page || 1) - 1) * (filters.value.limit || 20)
      const to = from + (filters.value.limit || 20) - 1
      query = query.range(from, to).order('created_at', { ascending: false })

      const { data, error: queryError, count } = await query
      if (queryError) throw queryError

      users.value = (data || []) as UserProfile[]
      totalUsers.value = count || 0
      
      console.log('[User Store] Users loaded:', users.value.length)
    } catch (err: any) {
      console.error('[User Store] Users load error:', err)
      error.value = (err as any).message || 'Failed to load users'
    } finally {
      loading.value = false
    }
  }

  const loadManagers = async () => {
    if (!supabase) {
      error.value = 'Supabase client not available'
      console.error('[User Store] Supabase client not available')
      return
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: queryError, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'manager')
        .order('manager_assigned_at', { ascending: false })

      if (queryError) throw queryError

      managers.value = (data || []) as UserProfile[]
      totalManagers.value = count || 0
      
      console.log('[User Store] Managers loaded:', managers.value.length)
    } catch (err: any) {
      console.error('[User Store] Managers load error:', err)
      error.value = (err as any).message || 'Failed to load managers'
    } finally {
      loading.value = false
    }
  }

  const getUserDetails = async (userId: string) => {
    if (!supabase) {
      error.value = 'Supabase client not available'
      console.error('[User Store] Supabase client not available')
      return null
    }

    try {
      loading.value = true
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (queryError) throw queryError
      return data as UserProfile
    } catch (err: any) {
      console.error('[User Store] User details error:', err)
      error.value = (err as any).message || 'Failed to load user details'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateUserStatus = async (userId: string, status: string, reason?: string) => {
    const authStore = useAuthStore()
    
    if (!supabase) {
      error.value = 'Supabase client not available'
      console.error('[User Store] Supabase client not available')
      return { success: false, error: 'Supabase client not available' }
    }

    try {
      loading.value = true
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users.value[userIndex] = { ...users.value[userIndex], ...data } as UserProfile
      }

      await authStore.logAuditAction(`user_${status}`, 'user', userId, { reason })
      await sendUserNotification(userId, status, reason)

      return { success: true }
    } catch (err: any) {
      console.error('[User Store] User status update error:', err)
      error.value = (err as any).message || 'Failed to update user status'
      return { success: false, error: (err as any).message }
    } finally {
      loading.value = false
    }
  }

  const warnUser = async (userId: string, reason: string) => {
    return await updateUserStatus(userId, 'warned', reason)
  }

  const suspendUser = async (userId: string, reason: string) => {
    return await updateUserStatus(userId, 'suspended', reason)
  }

  const activateUser = async (userId: string) => {
    return await updateUserStatus(userId, 'active')
  }

  const banUser = async (userId: string, reason: string) => {
    const authStore = useAuthStore()
    if (!authStore.isAdmin) throw new Error('Only admins can ban users')
    return await updateUserStatus(userId, 'banned', reason)
  }

  const sendUserNotification = async (userId: string, type: string, reason?: string) => {
    if (!supabase) {
      console.error('[User Store] Supabase client not available')
      return
    }

    const messages: Record<string, string> = {
      warned: 'Your account has received a warning.',
      suspended: 'Your account has been temporarily suspended.',
      banned: 'Your account has been permanently banned.',
      active: 'Your account has been reactivated.'
    }

    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'moderation',
        title: `Account ${type}`,
        message: messages[type] + (reason ? ` Reason: ${reason}` : '')
      })
      
      console.log('[User Store] Notification sent to user:', userId)
    } catch (err: any) {
      console.error('[User Store] Notification send error:', err)
    }
  }

  const searchUsers = async (query: string) => {
    if (!supabase) {
      console.error('[User Store] Supabase client not available')
      return []
    }

    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('role', 'user')
        .eq('status', 'active')
        .limit(10)

      if (queryError) throw queryError
      return data || []
    } catch (err: any) {
      console.error('[User Store] User search error:', err)
      return []
    }
  }

  const getManagerActivity = async (managerId: string) => {
    if (!supabase) {
      console.error('[User Store] Supabase client not available')
      return { actionsThisMonth: 0, usersManaged: 0, reportsResolved: 0, recentActions: [] }
    }

    try {
      const { data, error: queryError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', managerId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (queryError) throw queryError

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const actionsThisMonth = data?.filter(action => 
        new Date(action.created_at) >= thisMonth
      ).length || 0

      return {
        actionsThisMonth,
        usersManaged: 0,
        reportsResolved: 0,
        recentActions: data?.slice(0, 20) || []
      }
    } catch (err: any) {
      console.error('[User Store] Manager activity error:', err)
      return { actionsThisMonth: 0, usersManaged: 0, reportsResolved: 0, recentActions: [] }
    }
  }

  const updateFilters = (newFilters: Partial<UserFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = { page: 1, limit: 20 }
  }
  
  return {
    // Individual user properties
    currentUser: readonly(currentUser),
    profile: readonly(profile),
    permissions: readonly(permissions),
    loading: readonly(loading),
    error: readonly(error),
    isAdmin,
    isAuthenticated,
    
    // Individual user methods
    getCurrentUser,
    initializeSession,
    fetchProfile,
    loadPermissions,
    updateProfile,
    clearProfile,
    initializeRealTimeServices,
    
    // User management properties
    users: readonly(users),
    managers: readonly(managers),
    totalUsers: readonly(totalUsers),
    totalManagers: readonly(totalManagers),
    filters: readonly(filters),
    filteredUsers,
    activeUsers,
    suspendedUsers,
    totalPages,
    
    // User management methods
    loadUsers,
    loadManagers,
    getUserDetails,
    getUserById,
    getManagerById,
    updateUserStatus,
    warnUser,
    suspendUser,
    activateUser,
    banUser,
    sendUserNotification,
    searchUsers,
    getManagerActivity,
    updateFilters,
    resetFilters
  }
})

// ============ BACKWARD COMPATIBILITY ============
// Export useUsersStore as an alias to useUserStore for backward compatibility
export const useUsersStore = useUserStore
