// composables/useSharedState.ts
import { computed, reactive } from 'vue'

// ============================================
// Shared State Objects
// ============================================

// Profile State
const profileState = reactive({
  userId: null as string | null,
  username: '',
  email: '',
  avatar: '',
  bio: '',
  followers: 0,
  following: 0,
  verified: false,
  premiumStatus: false,
  createdAt: null as Date | null,
  updatedAt: null as Date | null,
})

// Rank State
const rankState = reactive({
  rankPoints: 0,
  rankLevel: 1,
  rankTitle: 'Novice',
  nextLevelPoints: 100,
  progressPercentage: 0,
  badges: [] as string[],
  achievements: [] as any[],
})

// Roles & Permissions State
const rolesState = reactive({
  roles: [] as any[],
  permissions: [] as any[],
  userRole: null as string | null,
  userPermissions: [] as string[],
  loading: false,
  error: null as string | null,
})

// Settings State
const settingsState = reactive({
  theme: 'light' as 'light' | 'dark',
  language: 'en',
  notifications: true,
  emailNotifications: true,
  privacyLevel: 'public' as 'public' | 'private' | 'friends',
})

// ============================================
// Main Composable
// ============================================

export const useSharedState = () => {
  // ============================================
  // Profile Getters & Setters
  // ============================================

  const setProfile = (data: Partial<typeof profileState>) => {
    Object.assign(profileState, data)
  }

  const getProfile = () => profileState

  const updateProfileField = (key: keyof typeof profileState, value: any) => {
    ;(profileState as any)[key] = value
  }

  const clearProfile = () => {
    Object.assign(profileState, {
      userId: null,
      username: '',
      email: '',
      avatar: '',
      bio: '',
      followers: 0,
      following: 0,
      verified: false,
      premiumStatus: false,
      createdAt: null,
      updatedAt: null,
    })
  }

  // ============================================
  // Rank Getters & Setters
  // ============================================

  const setRank = (data: Partial<typeof rankState>) => {
    Object.assign(rankState, data)
  }

  const getRank = () => rankState

  const updateRankField = (key: keyof typeof rankState, value: any) => {
    ;(rankState as any)[key] = value
  }

  const incrementRankPoints = (points: number) => {
    rankState.rankPoints += points
    updateRankProgress()
  }

  const updateRankProgress = () => {
    if (rankState.nextLevelPoints > 0) {
      rankState.progressPercentage = Math.min(
        (rankState.rankPoints / rankState.nextLevelPoints) * 100,
        100
      )
    }
  }

  const addBadge = (badge: string) => {
    if (!rankState.badges.includes(badge)) {
      rankState.badges.push(badge)
    }
  }

  const addAchievement = (achievement: any) => {
    rankState.achievements.push(achievement)
  }

  // ============================================
  // Roles & Permissions Getters & Setters
  // ============================================

  const setRoles = (roles: any[]) => {
    rolesState.roles = roles
  }

  const setPermissions = (permissions: any[]) => {
    rolesState.permissions = permissions
  }

  const setUserRole = (role: string) => {
    rolesState.userRole = role
  }

  const setUserPermissions = (permissions: string[]) => {
    rolesState.userPermissions = permissions
  }

  const getRoles = () => rolesState.roles

  const getPermissions = () => rolesState.permissions

  const getUserRole = () => rolesState.userRole

  const getUserPermissions = () => rolesState.userPermissions

  const hasPermission = (permission: string): boolean => {
    return rolesState.userPermissions.includes(permission)
  }

  const hasRole = (role: string): boolean => {
    return rolesState.userRole === role
  }

  const getRoleByName = (name: string) => {
    return rolesState.roles.find((r) => r.name === name)
  }

  const getPermissionsByRole = (roleName: string) => {
    const role = rolesState.roles.find((r) => r.name === roleName)
    return role ? rolesState.permissions.filter((p) => role.permissions.includes(p.name)) : []
  }

  const setRolesLoading = (loading: boolean) => {
    rolesState.loading = loading
  }

  const setRolesError = (error: string | null) => {
    rolesState.error = error
  }

  // ============================================
  // Settings Getters & Setters
  // ============================================

  const setSettings = (data: Partial<typeof settingsState>) => {
    Object.assign(settingsState, data)
  }

  const getSettings = () => settingsState

  const updateSetting = (key: keyof typeof settingsState, value: any) => {
    ;(settingsState as any)[key] = value
  }

  const toggleTheme = () => {
    settingsState.theme = settingsState.theme === 'light' ? 'dark' : 'light'
  }

  // ============================================
  // Computed Properties
  // ============================================

  const isProfileComplete = computed(() => {
    return (
      profileState.userId &&
      profileState.username &&
      profileState.email &&
      profileState.avatar
    )
  })

  const isUserPremium = computed(() => profileState.premiumStatus)

  const userDisplayName = computed(() => profileState.username || 'Anonymous')

  const rankLevelLabel = computed(() => {
    const levels: Record<number, string> = {
      1: 'Novice',
      2: 'Apprentice',
      3: 'Journeyman',
      4: 'Expert',
      5: 'Master',
      6: 'Legend',
    }
    return levels[rankState.rankLevel] || 'Unknown'
  })

  const canManageUsers = computed(() => {
    return rolesState.userPermissions.includes('manage_users')
  })

  const canModerateContent = computed(() => {
    return rolesState.userPermissions.includes('moderate_content')
  })

  // ============================================
  // Reset All State
  // ============================================

  const resetAllState = () => {
    clearProfile()
    Object.assign(rankState, {
      rankPoints: 0,
      rankLevel: 1,
      rankTitle: 'Novice',
      nextLevelPoints: 100,
      progressPercentage: 0,
      badges: [],
      achievements: [],
    })
    Object.assign(rolesState, {
      roles: [],
      permissions: [],
      userRole: null,
      userPermissions: [],
      loading: false,
      error: null,
    })
  }

  // ============================================
  // Return All Methods & State
  // ============================================

  return {
    // Profile
    profileState,
    setProfile,
    getProfile,
    updateProfileField,
    clearProfile,

    // Rank
    rankState,
    setRank,
    getRank,
    updateRankField,
    incrementRankPoints,
    updateRankProgress,
    addBadge,
    addAchievement,

    // Roles & Permissions
    rolesState,
    setRoles,
    setPermissions,
    setUserRole,
    setUserPermissions,
    getRoles,
    getPermissions,
    getUserRole,
    getUserPermissions,
    hasPermission,
    hasRole,
    getRoleByName,
    getPermissionsByRole,
    setRolesLoading,
    setRolesError,

    // Settings
    settingsState,
    setSettings,
    getSettings,
    updateSetting,
    toggleTheme,

    // Computed
    isProfileComplete,
    isUserPremium,
    userDisplayName,
    rankLevelLabel,
    canManageUsers,
    canModerateContent,

    // Reset
    resetAllState,
  }
}
