// ============================================================================
// FILE: /stores/roles.ts - RECONCILED CLEAN ESM ARCHITECTURE
// ============================================================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSupabaseClient } from '~/lib/supabase-factory'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface Role {
  id: string
  name: string
  permissions: string[]
  level: number
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  created_at: string
}

export const useRolesStore = defineStore('roles', () => {
  // ============================================================================
  // STATE
  // ============================================================================
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============================================================================
  // GETTERS (COMPUTED PROPERTIES)
  // ============================================================================
  const getRoleByName = computed(() => (name: string): Role | undefined => {
    return roles.value.find(role => role.name === name)
  })

  const getPermissionsByRole = computed(() => (roleName: string): string[] => {
    const role = roles.value.find(r => r.name === roleName)
    return role?.permissions || []
  })

  const getRoleLevel = computed(() => (roleName: string): number => {
    const role = roles.value.find(r => r.name === roleName)
    return role?.level || 0
  })

  const availableRoles = computed((): Role[] => {
    return [...roles.value].sort((a, b) => a.level - b.level)
  })

  const managerPermissions = computed((): Permission[] => {
    const managerRole = roles.value.find(r => r.name === 'manager')
    if (!managerRole) return []
    return permissions.value.filter(p => managerRole.permissions.includes(p.name))
  })

  // ============================================================================
  // ACTIONS (METHODS)
  // ============================================================================
  const loadRoles = async () => {
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      error.value = 'Supabase client not available'
      console.error('[Roles Store] Supabase client not available')
      return
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: dbError } = await supabase
        .from('roles')
        .select('*')
        .order('level', { ascending: true })

      if (dbError) throw dbError

      roles.value = (data || []) as Role[]
      console.log('[Roles Store] Roles loaded successfully:', roles.value.length)
    } catch (err: any) {
      console.error('[Roles Store] Load error:', err)
      error.value = err.message || 'Failed to load roles'
    } finally {
      loading.value = false
    }
  }

  const loadPermissions = async () => {
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      error.value = 'Supabase client not available'
      console.error('[Roles Store] Supabase client not available')
      return
    }

    try {
      loading.value = true
      error.value = null

      const { data, error: dbError } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })

      if (dbError) throw dbError

      permissions.value = (data || []) as Permission[]
      console.log('[Roles Store] Permissions loaded successfully:', permissions.value.length)
    } catch (err: any) {
      console.error('[Roles Store] Permissions load error:', err)
      error.value = err.message || 'Failed to load permissions'
    } finally {
      loading.value = false
    }
  }

  const loadAll = async () => {
    await Promise.all([loadRoles(), loadPermissions()])
  }

  return {
    // State refs
    roles,
    permissions,
    loading,
    error,

    // Getters
    getRoleByName,
    getPermissionsByRole,
    getRoleLevel,
    availableRoles,
    managerPermissions,

    // Actions
    loadRoles,
    loadPermissions,
    loadAll
  }
})
