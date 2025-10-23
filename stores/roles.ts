import { defineStore } from 'pinia'

interface Role {
  id: string
  name: string
  permissions: string[]
  level: number
  created_at: string
  updated_at: string
}

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  created_at: string
}

interface RoleState {
  roles: Role[]
  permissions: Permission[]
  loading: boolean
  error: string | null
}

export const useRolesStore = defineStore('roles', {
  state: (): RoleState => ({
    roles: [],
    permissions: [],
    loading: false,
    error: null
  }),

  getters: {
    getRoleByName: (state) => (name: string): Role | undefined => {
      return state.roles.find(role => role.name === name)
    },

    getPermissionsByRole: (state) => (roleName: string): string[] => {
      const role = state.roles.find(r => r.name === roleName)
      return role?.permissions || []
    },

    getRoleLevel: (state) => (roleName: string): number => {
      const role = state.roles.find(r => r.name === roleName)
      return role?.level || 0
    },

    availableRoles: (state): Role[] => {
      return state.roles.sort((a, b) => a.level - b.level)
    },

    managerPermissions: (state): Permission[] => {
      const managerRole = state.roles.find(r => r.name === 'manager')
      if (!managerRole) return []
      return state.permissions.filter(p => managerRole.permissions.includes(p.name))
    }
  },

  actions: {
    async loadRoles() {
      const supabase = useSupabaseClient()
      try {
        this.loading = true
        this.error = null

        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .order('level', { ascending: true })

        if (error) throw error

        this.roles = (data || []) as Role[]
      } catch (error) {
        console.error('Roles load error:', error)
        this.error = (error as any).message || 'Failed to load roles'
      } finally {
        this.loading = false
      }
    },

    async loadPermissions() {
      const supabase = useSupabaseClient()
      try {
        this.loading = true
        this.error = null

        const { data, error } = await supabase
          .from('permissions')
          .select('*')
          .order('resource', { ascending: true })

        if (error) throw error

        this.permissions = (data || []) as Permission[]
      } catch (error) {
        console.error('Permissions load error:', error)
        this.error = (error as any).message || 'Failed to load permissions'
      } finally {
        this.loading = false
      }
    },

    async loadAll() {
      await Promise.all([this.loadRoles(), this.loadPermissions()])
    }
  }
})
