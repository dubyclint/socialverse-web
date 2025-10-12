// stores/auth.ts - Enhanced Role-Based Store
export const useAuthStore = defineStore('auth', () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  
  // State
  const profile = ref(null)
  const loading = ref(false)
  const permissions = ref([])
  const lastRoleCheck = ref(null)
  
  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => profile.value?.role || 'user')
  const isAdmin = computed(() => userRole.value === 'admin')
  const isManager = computed(() => ['manager', 'admin'].includes(userRole.value))
  const isUser = computed(() => userRole.value === 'user')
  
  // Role hierarchy levels
  const roleLevel = computed(() => {
    const levels = { admin: 3, manager: 2, user: 1 }
    return levels[userRole.value] || 0
  })
  
  // Actions
  const fetchProfile = async () => {
    if (!user.value) return
    
    try {
      loading.value = true
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role_id,
            roles (
              name,
              permissions
            )
          )
        `)
        .eq('id', user.value.id)
        .single()
        
      if (error && error.code !== 'PGRST116') throw error
      
      profile.value = data
      
      // Extract permissions from roles
      if (data?.user_roles) {
        const allPermissions = data.user_roles.flatMap(ur => 
          ur.roles?.permissions || []
        )
        permissions.value = [...new Set(allPermissions)]
      }
      
      lastRoleCheck.value = new Date()
    } catch (err) {
      console.error('Profile fetch error:', err)
    } finally {
      loading.value = false
    }
  }
  
  const updateProfile = async (updates: any) => {
    if (!user.value) return
    
    try {
      loading.value = true
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.value.id,
          email: user.value.email,
          ...updates,
          updated_at: new Date().toISOString()
        })
        
      if (error) throw error
      
      // Refresh profile
      await fetchProfile()
      
      return { success: true }
    } catch (err) {
      console.error('Profile update error:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }
  
  const hasRole = (requiredRole: string): boolean => {
    const levels = { admin: 3, manager: 2, user: 1 }
    const userLevel = levels[userRole.value] || 0
    const requiredLevel = levels[requiredRole] || 0
    return userLevel >= requiredLevel
  }
  
  const hasPermission = (permission: string): boolean => {
    if (isAdmin.value) return true
    return permissions.value.includes(permission)
  }
  
  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => hasPermission(permission))
  }
  
  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => hasPermission(permission))
  }
  
  const canAccessRoute = (path: string): boolean => {
    if (path.startsWith('/admin')) return isAdmin.value
    if (path.startsWith('/manager')) return isManager.value
    return true
  }
  
  const assignRole = async (userId: string, newRole: string) => {
    if (!isAdmin.value) {
      throw new Error('Only admins can assign roles')
    }
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)
        
      if (error) throw error
      
      // Log the role change
      await logAuditAction('role_assigned', 'user', userId, {
        new_role: newRole,
        assigned_by: user.value.id
      })
      
      return { success: true }
    } catch (err) {
      console.error('Role assignment error:', err)
      return { success: false, error: err.message }
    }
  }
  
  const logAuditAction = async (action: string, resourceType: string, resourceId: string, details: any = {}) => {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.value?.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        })
    } catch (err) {
      console.error('Audit log error:', err)
    }
  }
  
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return 'unknown'
    }
  }
  
  const refreshRoleCheck = async () => {
    const now = new Date()
    const lastCheck = lastRoleCheck.value
    
    // Refresh if last check was more than 5 minutes ago
    if (!lastCheck || (now.getTime() - lastCheck.getTime()) > 5 * 60 * 1000) {
      await fetchProfile()
    }
  }
  
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      profile.value = null
      permissions.value = []
      lastRoleCheck.value = null
    } catch (err) {
      console.error('Logout error:', err)
    }
  }
  
  // Watch for user changes
  watch(user, async (newUser) => {
    if (newUser) {
      await fetchProfile()
    } else {
      profile.value = null
      permissions.value = []
      lastRoleCheck.value = null
    }
  }, { immediate: true })
  
  return {
    // State
    profile: readonly(profile),
    loading: readonly(loading),
    permissions: readonly(permissions),
    
    // Computed
    isAuthenticated,
    userRole,
    isAdmin,
    isManager,
    isUser,
    roleLevel,
    
    // Actions
    fetchProfile,
    updateProfile,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    assignRole,
    logAuditAction,
    refreshRoleCheck,
    logout
  }
})
