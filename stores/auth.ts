import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'

interface Profile {
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
  email_verified: boolean
  phone?: string
  bio?: string
  location?: string
  website?: string
  preferences: Record<string, any>
  metadata: Record<string, any>
  assigned_by?: string
  manager_permissions?: string[]
  manager_assigned_at?: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  permissions: string[]
  lastRoleCheck: Date | null
  sessionValid: boolean
  supabaseAvailable: boolean
  socketConnected: boolean
  gunInitialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    profile: null,
    loading: false,
    permissions: [],
    lastRoleCheck: null,
    sessionValid: false,
    supabaseAvailable: false,
    socketConnected: false,
    gunInitialized: false
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user && state.sessionValid,
    
    userRole: (state): string => state.profile?.role || 'user',
    
    isAdmin: (state): boolean => state.profile?.role === 'admin',
    
    isManager: (state): boolean => ['manager', 'admin'].includes(state.profile?.role || ''),
    
    isUser: (state): boolean => state.profile?.role === 'user',
    
    roleLevel(): number {
      const levels = { admin: 3, manager: 2, user: 1 }
      return levels[this.userRole as keyof typeof levels] || 0
    },

    canAccessAdmin(): boolean {
      return this.isAdmin
    },

    canAccessManager(): boolean {
      return this.isManager
    },

    userDisplayName(): string {
      return this.profile?.full_name || this.profile?.username || this.profile?.email || 'User'
    },

    userInitials(): string {
      const name = this.userDisplayName
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    },

    isAccountSuspended(): boolean {
      return this.profile?.status === 'suspended'
    },

    isAccountBanned(): boolean {
      return this.profile?.status === 'banned'
    },

    hasWarning(): boolean {
      return this.profile?.status === 'warned'
    }
  },

  actions: {
    async initialize() {
      // Safely initialize Supabase client
      let supabase = null
      try {
        supabase = useSupabaseClient()
        this.supabaseAvailable = true
      } catch (error) {
        console.warn('Supabase client not available during initialization:', error)
        this.supabaseAvailable = false
        this.loading = false
        return
      }
      
      try {
        this.loading = true
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          this.user = session.user
          
          // ✅ CRITICAL: Fetch profile FIRST to ensure RBAC is ready
          await this.fetchProfile()
          this.sessionValid = true
          
          // ✅ THEN initialize real-time services with full user context
          await this.initializeRealTimeServices()
        }
        
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            this.user = session.user
            // ✅ Fetch profile first
            await this.fetchProfile()
            this.sessionValid = true
            // ✅ Then initialize real-time services
            await this.initializeRealTimeServices()
          } else if (event === 'SIGNED_OUT') {
            this.clearAuth()
            this.disconnectRealTimeServices()
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            this.user = session.user
            this.sessionValid = true
            // ✅ Refresh profile and real-time services
            await this.fetchProfile()
            await this.initializeRealTimeServices()
          }
        })
        
      } catch (error) {
        console.error('Auth initialization error:', error)
        this.clearAuth()
      } finally {
        this.loading = false
      }
    },

    async fetchProfile() {
      if (!this.user || !this.supabaseAvailable) return

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        console.warn('Supabase client not available:', error)
        return
      }
      
      try {
        this.loading = true
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', this.user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (profile) {
          this.profile = profile as Profile
          await this.loadPermissions()
          await this.updateLastLogin()
        } else {
          await this.createProfile()
        }

        this.lastRoleCheck = new Date()
        
      } catch (error) {
        console.error('Profile fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async createProfile() {
      if (!this.user || !this.supabaseAvailable) return

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        console.warn('Supabase client not available:', error)
        return
      }
      
      try {
        const profileData = {
          id: this.user.id,
          email: this.user.email!,
          full_name: this.user.user_metadata?.full_name || this.user.user_metadata?.name,
          avatar_url: this.user.user_metadata?.avatar_url,
          username: this.user.user_metadata?.username,
          email_verified: !!this.user.email_confirmed_at,
          role: 'user',
          status: 'active',
          preferences: {},
          metadata: {}
        }

        const { data, error } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single()

        if (error) throw error

        this.profile = data as Profile
        await this.loadPermissions()
        
      } catch (error) {
        console.error('Profile creation error:', error)
      }
    },

    async loadPermissions() {
      if (!this.profile || !this.supabaseAvailable) return

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        console.warn('Supabase client not available:', error)
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', this.profile.role)
          .single()

        if (error) {
          console.warn('Permissions load error:', error)
          // ✅ FIX: Set default permissions if role not found
          this.permissions = this.getDefaultPermissions(this.profile.role)
          return
        }

        this.permissions = (data?.permissions as string[]) || []
        
        if (this.profile.role === 'manager' && this.profile.manager_permissions) {
          this.permissions = [...new Set([...this.permissions, ...this.profile.manager_permissions])]
        }
        
      } catch (error) {
        console.error('Permissions load error:', error)
        // ✅ FIX: Set default permissions on error
        this.permissions = this.getDefaultPermissions(this.profile?.role || 'user')
      }
    },

    // ✅ NEW: Default permissions by role
    getDefaultPermissions(role: string): string[] {
      const defaultPerms: Record<string, string[]> = {
        admin: ['*'], // All permissions
        manager: ['read', 'write', 'moderate', 'manage_users'],
        user: ['read', 'write', 'comment', 'like']
      }
      return defaultPerms[role] || defaultPerms['user']
    },

    async updateProfile(updates: Partial<Profile>) {
      if (!this.user || !this.profile || !this.supabaseAvailable) return { success: false, error: 'Not authenticated' }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        console.warn('Supabase client not available:', error)
        return { success: false, error: 'Supabase not available' }
      }
      
      try {
        this.loading = true
        
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.user.id)
          .select()
          .single()

        if (error) throw error

        this.profile = { ...this.profile, ...data } as Profile
        
        return { success: true, data }
        
      } catch (error) {
        console.error('Profile update error:', error)
        return { success: false, error: (error as any).message }
      } finally {
        this.loading = false
      }
    },

    async updateLastLogin() {
      if (!this.user || !this.supabaseAvailable) return

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        console.warn('Supabase client not available:', error)
        return
      }
      
      try {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', this.user.id)
      } catch (error) {
        console.error('Last login update error:', error)
      }
    },

    hasRole(requiredRole: string): boolean {
      const levels = { admin: 3, manager: 2, user: 1 }
      const userLevel = levels[this.userRole as keyof typeof levels] || 0
      const requiredLevel = levels[requiredRole as keyof typeof levels] || 0
      return userLevel >= requiredLevel
    },

    hasPermission(permission: string): boolean {
      if (this.isAdmin) return true
      return this.permissions.includes(permission) || this.permissions.includes('*')
    },

    clearAuth() {
      this.user = null
      this.profile = null
      this.permissions = []
      this.sessionValid = false
      this.lastRoleCheck = null
    },

    async initializeRealTimeServices() {
      if (!this.user || !this.profile) {
        console.warn('Cannot initialize real-time services: user or profile not ready')
        return
      }

      try {
        // Initialize Gun
        if (!this.gunInitialized) {
          console.log('[Auth] Initializing Gun with user context')
          // Gun initialization logic here
          this.gunInitialized = true
        }

        // Initialize Socket.io
        if (!this.socketConnected) {
          console.log('[Auth] Initializing Socket.io with user context')
          // Socket.io initialization logic here
          this.socketConnected = true
        }
      } catch (error) {
        console.error('Real-time services initialization error:', error)
      }
    },

    async disconnectRealTimeServices() {
      try {
        // Disconnect Gun
        if (this.gunInitialized) {
          console.log('[Auth] Disconnecting Gun')
          // Gun disconnection logic here
          this.gunInitialized = false
        }

        // Disconnect Socket.io
        if (this.socketConnected) {
          console.log('[Auth] Disconnecting Socket.io')
          // Socket.io disconnection logic here
          this.socketConnected = false
        }
      } catch (error) {
        console.error('Real-time services disconnection error:', error)
      }
    },

    async assignManagerRole(userId: string, permissions: string[] = []) {
      if (!this.isAdmin) {
        throw new Error('Only admins can assign manager roles')
      }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        console.warn('Supabase client not available:', error)
        return { success: false, error: 'Supabase not available' }
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'manager',
            manager_permissions: permissions,
            manager_assigned_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) throw error

        return { success: true }
      } catch (error) {
        console.error('Manager role assignment error:', error)
        return { success: false, error: (error as any).message }
      }
    },

    async removeManagerRole(userId: string) {
      if (!this.isAdmin) {
        throw new Error('Only admins can remove manager roles')
      }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        console.warn('Supabase client not available:', error)
        return { success: false, error: 'Supabase not available' }
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'user',
            manager_permissions: null,
            manager_assigned_at: null
          })
          .eq('id', userId)

        if (error) throw error

        return { success: true }
      } catch (error) {
        console.error('Manager role removal error:', error)
        return { success: false, error: (error as any).message }
      }
    }
  }
})
