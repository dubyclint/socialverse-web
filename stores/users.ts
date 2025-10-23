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
    filters: { page: 1, limit: 20 }
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

    activeUsers: (state): UserProfile[] => state.users.filter(u => u.status === 'active'),
    suspendedUsers: (state): UserProfile[] => state.users.filter(u => u.status === 'suspended'),
    getUserById: (state) => (id: string) => state.users.find(u => u.id === id),
    getManagerById: (state) => (id: string) => state.managers.find(m => m.id === id),
    totalPages: (state): number => Math.ceil(state.totalUsers / (state.filters.limit || 20))
  },

  actions: {
    async loadUsers(filters: UserFilters = {}) {
      const supabase = useSupabaseClient()
      try {
        this.loading = true
        this.error = null
        this.filters = { ...this.filters, ...filters }

        let query = supabase.from('profiles').select('*', { count: 'exact' })

        if (this.filters.search) {
          query = query.or(`full_name.ilike.%${this.filters.search}%,username.ilike.%${this.filters.search}%,email.ilike.%${this.filters.search}%`)
        }
        if (this.filters.role) query = query.eq('role', this.filters.role)
        if (this.filters.status) query = query.eq('status', this.filters.status)

        const from = ((this.filters.page || 1) - 1) * (this.filters.limit || 20)
        const to = from + (this.filters.limit || 20) - 1
        query = query.range(from, to).order('created_at', { ascending: false })

        const { data, error, count } = await query
        if (error) throw error

        this.users = (data || []) as UserProfile[]
        this.totalUsers = count || 0
      } catch (error: any) {
        console.error('Users load error:', error)
        this.error = error.message || 'Failed to load users'
      } finally {
        this.loading = false
      }
    },

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

        this.managers = (data || []) as UserProfile[]
        this.totalManagers = count || 0
      } catch (error: any) {
        console.error('Managers load error:', error)
        this.error = error.message || 'Failed to load managers'
      } finally {
        this.loading = false
      }
    },

    async getUserDetails(userId: string) {
      const supabase = useSupabaseClient()
      try {
        this.loading = true
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) throw error
        return data as UserProfile
      } catch (error: any) {
        console.error('User details error:', error)
        this.error = error.message || 'Failed to load user details'
        return null
      } finally {
        this.loading = false
      }
    },

    async updateUserStatus(userId: string, status: string, reason?: string) {
      const authStore = useAuthStore()
      const supabase = useSupabaseClient()
      
      try {
        this.loading = true
        const { data, error } = await supabase
          .from('profiles')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select()
          .single()

        if (error) throw error

        const userIndex = this.users.findIndex(u => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex] = { ...this.users[userIndex], ...data }
        }

        await authStore.logAuditAction(`user_${status}`, 'user', userId, { reason })
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

    async warnUser(userId: string, reason: string) {
      return await this.updateUserStatus(userId, 'warned', reason)
    },

    async suspendUser(userId: string, reason: string) {
      return await this.updateUserStatus(userId, 'suspended', reason)
    },

    async activateUser(userId: string) {
      return await this.updateUserStatus(userId, 'active')
    },

    async banUser(userId: string, reason: string) {
      const authStore = useAuthStore()
      if (!authStore.isAdmin) throw new Error('Only admins can ban users')
      return await this.updateUserStatus(userId, 'banned', reason)
    },

    async sendUserNotification(userId: string, type: string, reason?: string) {
      const supabase = useSupabaseClient()
      const authStore = useAuthStore()
      
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
          message: messages[type] + (reason ? ` Reason: ${reason}` : ''),
          created_by: authStore.user?.id
        })
      } catch (error: any) {
        console.error('Notification send error:', error)
      }
    },

    async searchUsers(query: string) {
      const supabase = useSupabaseClient()
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
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

    async getManagerActivity(managerId: string) {
      const supabase = useSupabaseClient()
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', managerId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

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
      } catch (error: any) {
        console.error('Manager activity error:', error)
        return { actionsThisMonth: 0, usersManaged: 0, reportsResolved: 0, recentActions: [] }
      }
    },

    updateFilters(filters: Partial<UserFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    resetFilters() {
      this.filters = { page: 1, limit: 20 }
    }
  }
})
