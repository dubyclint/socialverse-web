// stores/roles.ts - FINAL RECONCILED
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { rolesService } from '~/services/rolesService'
import type { Role, Permission } from '~/types/roles' // Ensure these are imported

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getRoleByName = computed(() => (name: string) => roles.value.find(r => r.name === name))
  
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
