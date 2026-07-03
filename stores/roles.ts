// stores/roles.ts (Fully Reconciled)
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { rolesService } from '~/services/rolesService'

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters remain here: They operate on local state, so they are efficient
  const getRoleByName = computed(() => (name: string) => roles.value.find(r => r.name === name))
  
  // Actions: Delegation to Services
  const loadRoles = async () => {
    loading.value = true
    try {
      roles.value = await rolesService.fetchAllRoles() || []
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const loadPermissions = async () => {
    loading.value = true
    try {
      permissions.value = await rolesService.fetchAllPermissions() || []
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return { roles, permissions, loading, error, getRoleByName, loadRoles, loadPermissions }
})
