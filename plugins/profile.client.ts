// ============================================================================
// FILE 6: /plugins/profile.client.ts - COMPLETE PROFILE INITIALIZATION PLUGIN
// ============================================================================
// FIXES:
// ✅ Initialize profile store on app load
// ✅ Fetch profile data after auth is ready
// ✅ Listen for profile changes
// ✅ Update profile store when auth changes
// ============================================================================

export default defineNuxtPlugin({
  name: 'profile-plugin',
  dependsOn: ['auth-plugin'], // ✅ Wait for auth plugin to initialize first

  async setup(nuxtApp) {
    // ============================================================================
    // ONLY RUN ON CLIENT-SIDE
    // ============================================================================
    if (!process.client) {
      console.log('[Profile Plugin] Running on server - skipping')
      return
    }

    console.log('[Profile Plugin] ============ INITIALIZATION START ============')

    try {
      // ============================================================================
      // GET REQUIRED STORES
      // ============================================================================
      const authStore = useAuthStore()
      const profileStore = useProfileStore()

      console.log('[Profile Plugin] Stores obtained')
      console.log('[Profile Plugin] Auth store hydrated:', authStore.isHydrated)
      console.log('[Profile Plugin] Profile store hydrated:', profileStore.isHydrated)

      // ============================================================================
      // WAIT FOR AUTH STORE TO BE READY
      // ============================================================================
      console.log('[Profile Plugin] Waiting for auth store to be ready...')

      let attempts = 0
      const maxAttempts = 100 // 10 seconds with 100ms intervals

      while (!authStore.isHydrated && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (!authStore.isHydrated) {
        console.warn('[Profile Plugin] ⚠️ Auth store hydration timeout')
      } else {
        console.log('[Profile Plugin] ✅ Auth store ready after', attempts * 100, 'ms')
      }

      // ============================================================================
      // STEP 1: Initialize profile store from storage
      // ============================================================================
      console.log('[Profile Plugin] STEP 1: Hydrating profile store from storage...')

      if (!profileStore.isHydrated) {
        await profileStore.hydrateFromStorage()
        console.log('[Profile Plugin] ✅ Profile store hydrated')
      } else {
        console.log('[Profile Plugin] Profile store already hydrated')
      }

      // ============================================================================
      // STEP 2: If user is authenticated, initialize profile
      // ============================================================================
      console.log('[Profile Plugin] STEP 2: Checking authentication status...')

      if (authStore.isAuthenticated && authStore.user?.id) {
        console.log('[Profile Plugin] User is authenticated:', authStore.user.id)
        console.log('[Profile Plugin] Initializing profile for user...')

        await profileStore.initializeProfile(authStore.user.id)
        console.log('[Profile Plugin] ✅ Profile initialized')
      } else {
        console.log('[Profile Plugin] User is not authenticated')
      }

      // ============================================================================
      // STEP 3: Setup watchers for auth changes
      // ============================================================================
      console.log('[Profile Plugin] STEP 3: Setting up auth change watchers...')

      setupAuthChangeWatchers(authStore, profileStore)
      console.log('[Profile Plugin] ✅ Auth change watchers set up')

      // ============================================================================
      // STEP 4: Setup watchers for profile changes
      // ============================================================================
      console.log('[Profile Plugin] STEP 4: Setting up profile change watchers...')

      setupProfileChangeWatchers(profileStore)
      console.log('[Profile Plugin] ✅ Profile change watchers set up')

      console.log('[Profile Plugin] ✅ Plugin initialization complete')
      console.log('[Profile Plugin] ============ INITIALIZATION END ============')

    } catch (err: any) {
      console.error('[Profile Plugin] ============ INITIALIZATION ERROR ============')
      console.error('[Profile Plugin] Error:', err.message)
      console.error('[Profile Plugin] Stack:', err.stack)
      console.error('[Profile Plugin] ============ END ERROR ============')
      // Don't throw - allow app to continue without profile
    }
  }
})

// ============================================================================
// SETUP AUTH CHANGE WATCHERS
// ============================================================================
function setupAuthChangeWatchers(authStore: any, profileStore: any) {
  console.log('[Profile Plugin] Setting up auth change watchers...')

  // ============================================================================
  // WATCH: Authentication status changes
  // ============================================================================
  const unsubscribeAuth = watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      console.log('[Profile Plugin] ============ AUTH STATUS CHANGED ============')
      console.log('[Profile Plugin] Is authenticated:', isAuthenticated)

      if (isAuthenticated && authStore.user?.id) {
        console.log('[Profile Plugin] User authenticated, initializing profile...')
        await profileStore.initializeProfile(authStore.user.id)
        console.log('[Profile Plugin] ✅ Profile initialized on auth change')
      } else {
        console.log('[Profile Plugin] User not authenticated, clearing profile...')
        profileStore.clearProfile()
        console.log('[Profile Plugin] ✅ Profile cleared on logout')
      }

      console.log('[Profile Plugin] ============ AUTH STATUS CHANGED END ============')
    }
  )

  // ============================================================================
  // WATCH: User ID changes
  // ============================================================================
  const unsubscribeUserId = watch(
    () => authStore.user?.id,
    async (userId) => {
      console.log('[Profile Plugin] ============ USER ID CHANGED ============')
      console.log('[Profile Plugin] New user ID:', userId)

      if (userId) {
        console.log('[Profile Plugin] User ID changed, initializing profile for new user...')
        await profileStore.initializeProfile(userId)
        console.log('[Profile Plugin] ✅ Profile initialized for new user')
      } else {
        console.log('[Profile Plugin] User ID cleared, clearing profile...')
        profileStore.clearProfile()
        console.log('[Profile Plugin] ✅ Profile cleared')
      }

      console.log('[Profile Plugin] ============ USER ID CHANGED END ============')
    }
  )

  // ============================================================================
  // WATCH: User metadata changes
  // ============================================================================
  const unsubscribeMetadata = watch(
    () => authStore.user?.user_metadata,
    (newMetadata) => {
      console.log('[Profile Plugin] ============ USER METADATA CHANGED ============')
      console.log('[Profile Plugin] New metadata:', {
        username: newMetadata?.username,
        full_name: newMetadata?.full_name,
        avatar_url: newMetadata?.avatar_url
      })

      if (newMetadata && profileStore.profile) {
        console.log('[Profile Plugin] Syncing profile with new metadata...')

        // Update profile with new metadata
        const updatedProfile = {
          ...profileStore.profile,
          username: newMetadata.username || profileStore.profile.username,
          full_name: newMetadata.full_name || profileStore.profile.full_name,
          avatar_url: newMetadata.avatar_url || profileStore.profile.avatar_url,
          bio: newMetadata.bio || profileStore.profile.bio,
          location: newMetadata.location || profileStore.profile.location,
          website: newMetadata.website || profileStore.profile.website
        }

        profileStore.setProfile(updatedProfile)
        console.log('[Profile Plugin] ✅ Profile synced with new metadata')
      }

      console.log('[Profile Plugin] ============ USER METADATA CHANGED END ============')
    },
    { deep: true }
  )

  console.log('[Profile Plugin] ✅ Auth change watchers set up')

  // Return unsubscribe functions (optional cleanup)
  return {
    unsubscribeAuth,
    unsubscribeUserId,
    unsubscribeMetadata
  }
}

// ============================================================================
// SETUP PROFILE CHANGE WATCHERS
// ============================================================================
function setupProfileChangeWatchers(profileStore: any) {
  console.log('[Profile Plugin] Setting up profile change watchers...')

  // ============================================================================
  // WATCH: Profile data changes
  // ============================================================================
  const unsubscribeProfile = watch(
    () => profileStore.profile,
    (newProfile) => {
      console.log('[Profile Plugin] ============ PROFILE DATA CHANGED ============')

      if (newProfile) {
        console.log('[Profile Plugin] Profile updated:', {
          id: newProfile.id,
          username: newProfile.username,
          full_name: newProfile.full_name
        })

        // Persist to localStorage
        if (process.client) {
          try {
            localStorage.setItem('profile_data', JSON.stringify(newProfile))
            console.log('[Profile Plugin] ✅ Profile persisted to localStorage')
          } catch (err) {
            console.error('[Profile Plugin] ❌ Failed to persist profile:', err)
          }
        }
      } else {
        console.log('[Profile Plugin] Profile cleared')

        // Clear from localStorage
        if (process.client) {
          try {
            localStorage.removeItem('profile_data')
            console.log('[Profile Plugin] ✅ Profile removed from localStorage')
          } catch (err) {
            console.error('[Profile Plugin] ❌ Failed to clear profile:', err)
          }
        }
      }

      console.log('[Profile Plugin] ============ PROFILE DATA CHANGED END ============')
    },
    { deep: true }
  )

  // ============================================================================
  // WATCH: Profile loading state
  // ============================================================================
  const unsubscribeLoading = watch(
    () => profileStore.isLoading,
    (isLoading) => {
      console.log('[Profile Plugin] Profile loading state changed:', isLoading)
    }
  )

  // ============================================================================
  // WATCH: Profile error state
  // ============================================================================
  const unsubscribeError = watch(
    () => profileStore.error,
    (error) => {
      if (error) {
        console.error('[Profile Plugin] Profile error:', error)
      } else {
        console.log('[Profile Plugin] Profile error cleared')
      }
    }
  )

  console.log('[Profile Plugin] ✅ Profile change watchers set up')

  // Return unsubscribe functions (optional cleanup)
  return {
    unsubscribeProfile,
    unsubscribeLoading,
    unsubscribeError
  }
}
