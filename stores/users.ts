import { defineStore } from 'pinia'

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
  posts_count?: number
  reports_count?: number
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

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: [],
    managers: [],
    totalUsers: 0,
    totalManagers: 0,
    loading: false,
    error: null,
    filters: {
      page: 1,
      limit: 20
    }
  }),

  getters: {
    filteredUsers: (state): UserProfile[] => {
      let filtered = state.users

      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        filtered = filtered.filter(user => 
          user.full_name?.toLowerCase().includes(search) ||
          user.username?.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        )
      }

      if (state.filters.role) {
        filtered = filtered.filter(user => user.role === state.filters.role)
      }

      if (state.filters.status) {
        filtered = filtered.filter(user => user.status === state.filters.status)
      }

      return filtered
    },

    activeUsers: (state): UserProfile[] => {
      return state.users.filter(user => user.status === 'active')
    },

    suspendedUsers: (state): UserProfile[] => {
      return state.users.filter(user => user.status === 'suspended')
    },

    getUserById: (state) => (id: string): UserProfile | undefined => {
      return state.users.find(user => user.id === id)
    },

    getManagerById: (state) => (id: string): UserProfile | undefined => {
      return state.managers.find(manager => manager.id === id)
    },

    totalPages: (state): number => {
      return Math.ceil(state.totalUsers / (state.filters.limit || 20))
    }
  },

  actions: {
    // Load users with filters
    async loadUsers(filters: UserFilters = {}) {
      const supabase = useSupabaseClient()
      
      try {
        this.loading = true
        this.error = null
        this.filters = { ...this.filters, ...filters }

        // Build query without complex relations
        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' })

        // Apply filters
        if (this.filters.search) {
          query = query.or(`full_name.ilike.%${this.filters.search}%,username.ilike.%${this.filters.search}%,email.ilike.%${this.filters.search}%`)
        }

        if (this.filters.role) {
          query = query.eq('role', this.filters.role)
        }

        if (this.filters.status) {
          query = query.eq('status', this.filters.status)
        }

        // Pagination
        const from = ((this.filters.page || 1) - 1) * (this.filters.limit || 20)
        const to = from + (this.filters.limit || 20) - 1
        query = query.range(from, to)

        // Order by created_at
        query = query.order('created_at', { ascending: false })

        const { data, error, count } = await query

        if (error) throw error

        // Map data to UserProfile
        this.users = (data || []).map((user: any) => ({
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
          assigned_by: user.assigned_by,
          manager_permissions: user.manager_permissions,
          manager_assigned_at: user.manager_assigned_at,
          posts_count: 0,
          reports_count: 0
        }))

        this.totalUsers = count || 0
        
      } catch (error: any) {
        console.error('Users load error:', error)
        this.error = error.message || 'Failed to load users'
      } finally {
        this.loading = false
      }
    },

    // Load managers
    async loadManagers() {
      const supabase = useSupabaseClient()
      
      try {
        this.loading = true
        this.error = null

        const { data, error, count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('role', 'manager')
          .order('manager_assigned_at', { ascending: false })

        if (error) throw error

        this.managers = (data || []).map((manager: any) => ({
          id: manager.id,
          email: manager.email,
          username: manager.username,
          full_name: manager.full_name,
          avatar_url: manager.avatar_url,
          role: manager.role,
          status: manager.status,
          created_at: manager.created_at,
          updated_at: manager.updated_at,
          last_login: manager.last_login,
          assigned_by: manager.assigned_by,
          manager_permissions: manager.manager_permissions,
          manager_assigned_at: manager.manager_assigned_at,
          posts_count: 0,
          reports_count: 0
        }))

        this.totalManagers = count || 0
        
      } catch (error: any) {
        console.error('Managers load error:', error)
        this.error = error.message || 'Failed to load managers'
      } finally {
        this.loading = false
      }
    },

    // Get user details
    async getUserDetails(userId: string) {
      const supabase = useSupabaseClient()
      
      try {
        this.loading = true
        this.error = null

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error

        return {
          id: data.id,
          email: data.email,
          username: data.username,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          role: data.role,
          status: data.status,
          created_at: data.created_at,
          updated_at: data.updated_at,
          last_login: data.last_login,
          assigned_by: data.assigned_by,
          manager_permissions: data.manager_permissions,
          manager_assigned_at: data.manager_assigned_at,
          posts_count: 0,
          comments_count: 0,
          reports_made_count: 0,
          reports_against_count: 0,
          recent_actions: []
        }
        
      } catch (error: any) {
        console.error('User details error:', error)
        this.error = error.message || 'Failed to load user details'
        return null
      } finally {
        this.loading = false
      }
    },

    // Update user status (manager/admin only)
    async updateUserStatus(userId: string, status: string, reason?: string) {
      const authStore = useAuthStore()
      
      if (!authStore.hasPermission('users.moderate')) {
        throw new Error('Insufficient permissions to moderate users')
      }

      const supabase = useSupabaseClient()
      
      try {
        this.loading = true
        this.error = null

        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()

        if (error) throw error

        // Update local state
        const userIndex = this.users.findIndex(u => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex] = { 
            ...this.users[userIndex], 
            status: data.status,
            updated_at: data.updated_at
          }
        }

        // Log the action
        await authStore.logAuditAction(`user_${status}`, 'user', userId, {
          reason,
          previous_status: this.users[userIndex]?.status
        })

        // Send notification to user
        await this.sendUserNotification(userId, status, reason)

        return { success: true }
        
      } catch (error: any) {
        console.error('User status update error:', error)
        this.error = error.message || 'Failed to update user status'
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Send warning to user
    async warnUser(userId: string, reason: string) {
      return await this.updateUserStatus(userId, 'warned', reason)
    },

    // Suspend user
    async suspendUser(userId: string, reason: string) {
      return await this.updateUserStatus(userId, 'suspended', reason)
    },

    // Activate user
    async activateUser(userId: string) {
      return await this.updateUserStatus(userId, 'active')
    },

    // Ban user (admin only)
    async banUser(userId: string, reason: string) {
      const authStore = useAuthStore()
      
      if (!authStore.isAdmin) {
        throw new Error('Only admins can ban users')
      }

      return await this.updateUserStatus(userId, 'banned', reason)
    },

    // Send notification to user
    async sendUserNotification(userId: string, type: string, reason?: string) {
      const supabase = useSupabaseClient()
      const authStore = useAuthStore()
      
      const messages: Record<string, string> = {
        warned: 'Your account has received a warning from our moderation team.',
        suspended: 'Your account has been temporarily suspended.',
        banned: 'Your account has been permanently banned.',
        active: 'Your account has been reactivated.'
      }

      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'moderation',
            title: `Account ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            message: messages[type] + (reason ? ` Reason: ${reason}` : ''),
            data: { type, reason },
            created_by: authStore.user?.id
          } as any)
      } catch (error: any) {
        console.error('Notification send error:', error)
      }
    },

    // Search users (for manager assignment)
    async searchUsers(query: string) {
      const supabase = useSupabaseClient()
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, username, full_name, avatar_url, role, status')
          .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
          .eq('role', 'user')
          .eq('status', 'active')
          .limit(10)

        if (error) throw error

        return data || []
        
      } catch (error: any) {
        console.error('User search error:', error)
        return []
      }
    },

    // Get manager activity
    async getManagerActivity(managerId: string) {
      const supabase = useSupabaseClient()
      
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', managerId)
          .in('action', ['user_suspended', 'user_warned', 'user_activated', 'content_moderated', 'report_resolved'])
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        // Calculate stats
        const now = new Date()
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const actionsThisMonth = data?.filter(action => 
          new Date(action.created_at) >= thisMonth
        ).length || 0

        const usersManaged = new Set(
          data?.map((action: any) => action.user_id)
        ).size

        const reportsResolved = data?.filter((action: any) => 
          action.action === 'report_resolved'
        ).length || 0

        return {
          actionsThisMonth,
          usersManaged,
          reportsResolved,
          recentActions: data?.slice(0, 20) || []
        }
        
      } catch (error: any) {
        console.error('Manager activity error:', error)
        return {
          actionsThisMonth: 0,
          usersManaged: 0,
          reportsResolved: 0,
          recentActions: []
        }
      }
    },

    // Update filters
    updateFilters(filters: Partial<UserFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    // Reset filters
    resetFilters() {
      this.filters = {
        page: 1,
        limit: 20
      }
    }
  }
})
