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
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    profile: null,
    loading: false,
    permissions: [],
    lastRoleCheck: null,
    sessionValid: false
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
    // Initialize auth state
    async initialize() {
      const supabase = useSupabaseClient()
      
      try {
        this.loading = true
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session?.user) {
          this.user = session.user
          await this.fetchProfile()
          this.sessionValid = true
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            this.user = session.user
            await this.fetchProfile()
            this.sessionValid = true
          } else if (event === 'SIGNED_OUT') {
            this.clearAuth()
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            this.user = session.user
            this.sessionValid = true
          }
        })
        
      } catch (error) {
        console.error('Auth initialization error:', error)
        this.clearAuth()
      } finally {
        this.loading = false
      }
    },

    // Fetch user profile with role and permissions
    async fetchProfile() {
      if (!this.user) return

      const supabase = useSupabaseClient()
      
      try {
        this.loading = true
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            *,
            assigned_by_profile:assigned_by(full_name, email)
          `)
          .eq('id', this.user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (profile) {
          this.profile = profile
          await this.loadPermissions()
          
          // Update last login
          await this.updateLastLogin()
        } else {
          // Create profile if it doesn't exist
          await this.createProfile()
        }

        this.lastRoleCheck = new Date()
        
      } catch (error) {
        console.error('Profile fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    // Create user profile
    async createProfile() {
      if (!this.user) return

      const supabase = useSupabaseClient()
      
      try {
        const profileData = {
          id: this.user.id,
          email: this.user.email!,
          full_name: this.user.user_metadata?.full_name || this.user.user_metadata?.name,
          avatar_url: this.user.user_metadata?.avatar_url,
          username: this.user.user_metadata?.username,
          email_verified: !!this.user.email_confirmed_at,
          role: 'user',
          status: 'active'
        }

        const { data, error } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single()

        if (error) throw error

        this.profile = data
        await this.loadPermissions()
        
      } catch (error) {
        console.error('Profile creation error:', error)
      }
    },

    // Load user permissions based on role
    async loadPermissions() {
      if (!this.profile) return

      const supabase = useSupabaseClient()
      
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', this.profile.role)
          .single()

        if (error) throw error

        this.permissions = data?.permissions || []
        
        // Add manager-specific permissions if applicable
        if (this.profile.role === 'manager' && this.profile.manager_permissions) {
          this.permissions = [...new Set([...this.permissions, ...this.profile.manager_permissions])]
        }
        
      } catch (error) {
        console.error('Permissions load error:', error)
        this.permissions = []
      }
    },

    // Update user profile
    async updateProfile(updates: Partial<Profile>) {
      if (!this.user || !this.profile) return { success: false, error: 'Not authenticated' }

      const supabase = useSupabaseClient()
      
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

        this.profile = { ...this.profile, ...data }
        
        return { success: true, data }
        
      } catch (error) {
        console.error('Profile update error:', error)
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Update last login timestamp
    async updateLastLogin() {
      if (!this.user) return

      const supabase = useSupabaseClient()
      
      try {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', this.user.id)
      } catch (error) {
        console.error('Last login update error:', error)
      }
    },

    // Role and permission checking methods
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

    // Manager role assignment (admin only)
    async assignManagerRole(userId: string, permissions: string[] = []) {
      if (!this.isAdmin) {
        throw new Error('Only admins can assign manager roles')
      }

      const supabase = useSupabaseClient()
      
      try {
        const { data, error } = await supabase.rpc('assign_manager_role', {
          target_user_id: userId,
          assigner_id: this.user!.id,
          manager_perms: permissions
        })

        if (error) throw error

        await this.logAuditAction('manager_assigned', 'user', userId, {
          permissions,
          assigned_by: this.user!.id
        })

        return { success: true }
        
      } catch (error) {
        console.error('Manager assignment error:', error)
        return { success: false, error: error.message }
      }
    },

    // Remove manager role (admin only)
    async removeManagerRole(userId: string) {
      if (!this.isAdmin) {
        throw new Error('Only admins can remove manager roles')
      }

      const supabase = useSupabaseClient()
      
      try {
        const { data, error } = await supabase.rpc('remove_manager_role', {
          target_user_id: userId,
          remover_id: this.user!.id
        })

        if (error) throw error

        await this.logAuditAction('manager_removed', 'user', userId, {
          removed_by: this.user!.id
        })

        return { success: true }
        
      } catch (error) {
        console.error('Manager removal error:', error)
        return { success: false, error: error.message }
      }
    },

    // Audit logging
    async logAuditAction(action: string, resourceType: string, resourceId: string, details: any = {}) {
      if (!this.user) return

      const supabase = useSupabaseClient()
      
      try {
        await supabase
          .from('audit_logs')
          .insert({
            user_id: this.user.id,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details,
            ip_address: await this.getClientIP(),
            user_agent: navigator.userAgent
          })
      } catch (error) {
        console.error('Audit log error:', error)
      }
    },

    // Get client IP address
    async getClientIP(): Promise<string> {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        return data.ip
      } catch {
        return 'unknown'
      }
    },

    // Refresh role check (for security)
    async refreshRoleCheck() {
      const now = new Date()
      const lastCheck = this.lastRoleCheck
      
      // Refresh if last check was more than 5 minutes ago
      if (!lastCheck || (now.getTime() - lastCheck.getTime()) > 5 * 60 * 1000) {
        await this.fetchProfile()
      }
    },

    // Sign out
    async signOut() {
      const supabase = useSupabaseClient()
      
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        this.clearAuth()
        
        // Redirect to login
        await navigateTo('/auth/login')
        
      } catch (error) {
        console.error('Sign out error:', error)
      }
    },

    // Clear auth state
    clearAuth() {
      this.user = null
      this.profile = null
      this.permissions = []
      this.lastRoleCheck = null
      this.sessionValid = false
      this.loading = false
    },

    // Check if user needs to verify email
    needsEmailVerification(): boolean {
      return this.user && !this.user.email_confirmed_at
    },

    // Send email verification
    async sendEmailVerification() {
      if (!this.user?.email) return { success: false, error: 'No email found' }

      const supabase = useSupabaseClient()
      
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: this.user.email
        })

        if (error) throw error

        return { success: true }
        
      } catch (error) {
        console.error('Email verification error:', error)
        return { success: false, error: error.message }
      }
    },

    // Update password
    async updatePassword(newPassword: string) {
      const supabase = useSupabaseClient()
      
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (error) throw error

        await this.logAuditAction('password_updated', 'user', this.user!.id)

        return { success: true }
        
      } catch (error) {
        console.error('Password update error:', error)
        return { success: false, error: error.message }
      }
    },

    // Delete account
    async deleteAccount() {
      if (!this.user) return { success: false, error: 'Not authenticated' }

      const supabase = useSupabaseClient()
      
      try {
        // Log the account deletion
        await this.logAuditAction('account_deleted', 'user', this.user.id)

        // Delete user profile (cascade will handle related data)
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', this.user.id)

        if (profileError) throw profileError

        // Sign out
        await this.signOut()

        return { success: true }
        
      } catch (error) {
        console.error('Account deletion error:', error)
        return { success: false, error: error.message }
      }
    }
  }
})
