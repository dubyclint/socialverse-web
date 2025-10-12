import { defineStore } from 'pinia'

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  level: number
  created_at: string
  updated_at: string
}

interface Permission {
  id: string
  name: string
  description: string
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
      
      return state.permissions.filter(p => 
        managerRole.permissions.includes(p.name)
      )
    }
  },

  actions: {
    // Load all roles
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

        this.roles = data || []
        
      } catch (error) {
        console.error('Roles load error:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    // Load all permissions
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

        this.permissions = data || []
        
      } catch (error) {
        console.error('Permissions load error:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    // Initialize roles and permissions
    async initialize() {
      await Promise.all([
        this.loadRoles(),
        this.loadPermissions()
      ])
    },

    // Update role permissions (admin only)
    async updateRolePermissions(roleName: string, permissions: string[]) {
      const authStore = useAuthStore()
      
      if (!authStore.isAdmin) {
        throw new Error('Only admins can update role permissions')
      }

      const supabase = useSupabaseClient()
      
      try {
        this.loading = true
        this.error = null

        const { data, error } = await supabase
          .from('roles')
          .update({ 
            permissions,
            updated_at: new Date().toISOString()
          })
          .eq('name', roleName)
          .select()
          .single()

        if (error) throw error

        // Update local state
        const roleIndex = this.roles.findIndex(r => r.name === roleName)
        if (roleIndex !== -1) {
          this.roles[roleIndex] = data
        }

        // Log the action
        await authStore.logAuditAction('role_permissions_updated', 'role', data.id, {
          role_name: roleName,
          permissions
        })

        return { success: true }
        
      } catch (error) {
        console.error('Role permissions update error:', error)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Check if role has permission
    roleHasPermission(roleName: string, permission: string): boolean {
      const role = this.getRoleByName(roleName)
      if (!role) return false
      
      return role.permissions.includes(permission) || role.permissions.includes('admin.all')
    },

    // Get permissions by resource
    getPermissionsByResource(resource: string): Permission[] {
      return this.permissions.filter(p => p.resource === resource)
    },

    // Get all available resources
    getAvailableResources(): string[] {
      const resources = new Set(this.permissions.map(p => p.resource))
      return Array.from(resources).sort()
    }
  }
})
