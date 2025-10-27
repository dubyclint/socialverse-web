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
    socketConnected: false
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
          await this.fetchProfile()
          this.sessionValid = true
          // ✅ NEW: Connect socket.io after auth is ready
          await this.connectSocket()
        }
        
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            this.user = session.user
            await this.fetchProfile()
            this.sessionValid = true
            // ✅ NEW: Connect socket.io on sign in
            await this.connectSocket()
          } else if (event === 'SIGNED_OUT') {
            this.clearAuth()
            // ✅ NEW: Disconnect socket.io on sign out
            this.disconnectSocket()
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            this.user = session.user
            this.sessionValid = true
            // ✅ NEW: Reconnect socket.io with new token
            await this.connectSocket()
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

        if (error) throw error

        this.permissions = (data?.permissions as string[]) || []
        
        if (this.profile.role === 'manager' && this.profile.manager_permissions) {
          this.permissions = [...new Set([...this.permissions, ...this.profile.manager_permissions])]
        }
        
      } catch (error) {
        console.error('Permissions load error:', error)
        this.permissions = []
      }
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
      return this.permissions.includes(permission)
    },

    hasAnyPermission(permissionList: string[]): boolean {
      return permissionList.some(permission => this.hasPermission(permission))
    },

    hasAllPermissions(permissionList: string[]): boolean {
      return permissionList.every(permission => this.hasPermission(permission))
    },

    canAccessRoute(path: string): boolean {
      if (path.startsWith('/admin')) return this.isAdmin
      if (path.startsWith('/manager')) return this.isManager
      return true
    },

    // ✅ NEW: Socket.IO Connection Management
    async connectSocket() {
      try {
        if (!process.client) return
        
        // Get socket instance from global
        const socket = window.$socket
        if (!socket) {
          console.warn('[Auth Store] Socket.IO not available')
          return
        }

        // Get JWT token from Supabase session
        let supabase = null
        try {
          supabase = useSupabaseClient()
        } catch (error) {
          console.warn('[Auth Store] Supabase client not available:', error)
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session?.access_token) {
          console.warn('[Auth Store] No session token available')
          return
        }

        // Update socket auth with JWT token
        socket.auth = {
          token: session.access_token
        }

        // Disconnect and reconnect to send new auth
        if (socket.connected) {
          socket.disconnect()
        }

        socket.connect()
        this.socketConnected = true
        console.log('[Auth Store] Socket.IO connected with authentication')

      } catch (error) {
        console.error('[Auth Store] Socket connection error:', error)
        this.socketConnected = false
      }
    },

    // ✅ NEW: Socket.IO Disconnection
    disconnectSocket() {
      try {
        if (!process.client) return

        const socket = window.$socket
        if (socket && socket.connected) {
          socket.disconnect()
          this.socketConnected = false
          console.log('[Auth Store] Socket.IO disconnected')
        }
      } catch (error) {
        console.error('[Auth Store] Socket disconnection error:', error)
      }
    },

    async assignManagerRole(userId: string, permissions: string[] = []) {
      if (!this.isAdmin || !this.supabaseAvailable) {
        throw new Error('Only admins can assign manager roles')
      }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        throw new Error('Supabase not available')
      }
      
      try {
        const { error } = await supabase.rpc('assign_manager_role', {
          target_user_id: userId,
          assigner_id: this.user!.id,
          manager_perms: permissions
        })

        if (error) throw error

        await this.logAuditAction('assign_manager_role', 'user', userId, {
          permissions,
          assigned_by: this.user!.id
        })

        return { success: true }
        
      } catch (error) {
        console.error('Manager assignment error:', error)
        return { success: false, error: (error as any).message }
      }
    },

    async removeManagerRole(userId: string) {
      if (!this.isAdmin || !this.supabaseAvailable) {
        throw new Error('Only admins can remove manager roles')
      }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        throw new Error('Supabase not available')
      }
      
      try {
        const { error } = await supabase.rpc('remove_manager_role', {
          target_user_id: userId,
          remover_id: this.user!.id
        })

        if (error) throw error

        await this.logAuditAction('remove_manager_role', 'user', userId, {
          removed_by: this.user!.id
        })

        return { success: true }
        
      } catch (error) {
        console.error('Manager removal error:', error)
        return { success: false, error: (error as any).message }
      }
    },

    async logAuditAction(action: string, resourceType: string, resourceId: string, details: any = {}) {
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
          .from('audit_logs')
          .insert({
            user_id: this.user.id,
            action,
            resource: resourceType,
            details
          })
      } catch (error) {
        console.error('Audit log error:', error)
      }
    },

    async getClientIP(): Promise<string> {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        return data.ip
      } catch {
        return 'unknown'
      }
    },

    async refreshRoleCheck() {
      const now = new Date()
      const lastCheck = this.lastRoleCheck
      
      if (!lastCheck || (now.getTime() - lastCheck.getTime()) > 5 * 60 * 1000) {
        await this.fetchProfile()
      }
    },

    async signOut() {
      if (!this.supabaseAvailable) {
        this.clearAuth()
        await navigateTo('/auth/login')
        return
      }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        console.warn('Supabase client not available:', error)
        this.clearAuth()
        return
      }
      
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        this.clearAuth()
        await navigateTo('/auth/login')
        
      } catch (error) {
        console.error('Sign out error:', error)
        this.clearAuth()
      }
    },

    clearAuth() {
      this.user = null
      this.profile = null
      this.permissions = []
      this.lastRoleCheck = null
      this.sessionValid = false
      this.loading = false
      this.socketConnected = false
      // ✅ NEW: Disconnect socket on auth clear
      this.disconnectSocket()
    },

    needsEmailVerification(): boolean {
      return !!(this.user && !this.user.email_confirmed_at)
    },

    async sendEmailVerification() {
      if (!this.user?.email || !this.supabaseAvailable) return { success: false, error: 'No email found' }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        return { success: false, error: 'Supabase not available' }
      }
      
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: this.user.email
        })

        if (error) throw error

        return { success: true }
        
      } catch (error) {
        console.error('Email verification error:', error)
        return { success: false, error: (error as any).message }
      }
    },

    async updatePassword(newPassword: string) {
      if (!this.supabaseAvailable) return { success: false, error: 'Supabase not available' }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        return { success: false, error: 'Supabase not available' }
      }
      
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (error) throw error

        await this.logAuditAction('password_updated', 'user', this.user!.id)

        return { success: true }
        
      } catch (error) {
        console.error('Password update error:', error)
        return { success: false, error: (error as any).message }
      }
    },

    async deleteAccount() {
      if (!this.user || !this.supabaseAvailable) return { success: false, error: 'Not authenticated' }

      let supabase = null
      try {
        supabase = useSupabaseClient()
      } catch (error) {
        return { success: false, error: 'Supabase not available' }
      }
      
      try {
        await this.logAuditAction('account_deleted', 'user', this.user.id)

        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', this.user.id)

        if (profileError) throw profileError

        await this.signOut()

        return { success: true }
        
      } catch (error) {
        console.error('Account deletion error:', error)
        return { success: false, error: (error as any).message }
      }
    }
  }
})
