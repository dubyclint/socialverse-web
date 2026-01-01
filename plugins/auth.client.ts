// FILE: /plugins/auth.client.ts - FIXED VERSION WITH PROFILE DATA FETCHING
// ============================================================================
// AUTH PLUGIN - FIXED: Fetches profile data after session restoration
// ✅ FIXED: Added dependency on supabase-client plugin
// ✅ FIXED: Fetches profile from profiles table to get complete user data
// ✅ FIXED: Merges profile data with auth user data
// ✅ FIXED: Better error handling and null checks
// ============================================================================

export default defineNuxtPlugin({
  name: 'auth-plugin',
  dependsOn: ['supabase-client'], // ✅ Wait for Supabase to initialize first
  
  async setup(nuxtApp) {
    // ============================================================================
    // ONLY RUN ON CLIENT-SIDE
    // ============================================================================
    if (!process.client) {
      console.log('[Auth Plugin] Running on server - skipping')
      return
    }

    console.log('[Auth Plugin] Starting initialization...')

    try {
      // ============================================================================
      // GET REQUIRED DEPENDENCIES
      // ============================================================================
      const authStore = useAuthStore()
      const { $supabase, $supabaseReady } = nuxtApp

      // ============================================================================
      // CHECK SUPABASE AVAILABILITY
      // ============================================================================
      if (!$supabase || !$supabaseReady) {
        console.warn('[Auth Plugin] ⚠️ Supabase client not available - skipping auth initialization')
        return
      }

      console.log('[Auth Plugin] ✅ Supabase client available')

      // ============================================================================
      // GET CURRENT SESSION
      // ============================================================================
      const { data: { session }, error } = await $supabase.auth.getSession()

      if (error) {
        console.error('[Auth Plugin] ❌ Session error:', error.message)
        return
      }

      // ============================================================================
      // RESTORE SESSION IF EXISTS
      // ============================================================================
      if (session?.user) {
        console.log('[Auth Plugin] ✅ User session found:', session.user.id)
        console.log('[Auth Plugin] User email:', session.user.email)
        
        // ============================================================================
        // STEP 1: Fetch profile from profiles table
        // ============================================================================
        console.log('[Auth Plugin] Fetching profile from profiles table...')
        
        const { data: profile, error: profileError } = await $supabase
          .from('profiles')
          .select('id, username, full_name, email, avatar_url, bio, location, verified')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.warn('[Auth Plugin] ⚠️ Profile fetch error:', profileError.message)
          
          // If profile doesn't exist, try to create it
          if (profileError.code === 'PGRST116') {
            console.log('[Auth Plugin] Profile not found, attempting to create...')
            
            const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user'
            const fullName = session.user.user_metadata?.full_name || username
            
            const { data: newProfile, error: createError } = await $supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username: username.toLowerCase(),
                username_lower: username.toLowerCase(),
                full_name: fullName,
                email: session.user.email,
                avatar_url: null,
                bio: '',
                location: '',
                verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()
            
            if (createError) {
              console.warn('[Auth Plugin] ⚠️ Failed to create profile:', createError.message)
              // Don't fail - use auth user metadata as fallback
              console.log('[Auth Plugin] Using auth user metadata as fallback')
              
              const completeUser = {
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  username: session.user.user_metadata?.username || username,
                  full_name: session.user.user_metadata?.full_name || fullName,
                  avatar_url: session.user.user_metadata?.avatar_url || null
                }
              }
              
              authStore.setUser(completeUser)
              if (session.access_token) {
                authStore.setToken(session.access_token)
              }
              
              console.log('[Auth Plugin] ✅ Session restored with fallback data')
              return
            }
            
            console.log('[Auth Plugin] ✅ Profile created successfully')
            
            // ============================================================================
            // STEP 2: Merge profile data with auth user
            // ============================================================================
            const completeUser = {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                username: newProfile.username,
                full_name: newProfile.full_name,
                avatar_url: newProfile.avatar_url
              }
            }
            
            authStore.setUser(completeUser)
            if (session.access_token) {
              authStore.setToken(session.access_token)
            }
            
            console.log('[Auth Plugin] ✅ Session restored with newly created profile')
            return
          }
          
          // For other errors, use auth user metadata as fallback
          console.warn('[Auth Plugin] Using auth user metadata as fallback')
          
          const completeUser = {
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              username: session.user.user_metadata?.username || 'user',
              full_name: session.user.user_metadata?.full_name || 'User',
              avatar_url: session.user.user_metadata?.avatar_url || null
            }
          }
          
          authStore.setUser(completeUser)
          if (session.access_token) {
            authStore.setToken(session.access_token)
          }
          
          console.log('[Auth Plugin] ✅ Session restored with fallback data')
          return
        }

        if (!profile) {
          console.warn('[Auth Plugin] ⚠️ Profile is null')
          
          // Use auth user metadata as fallback
          const completeUser = {
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              username: session.user.user_metadata?.username || 'user',
              full_name: session.user.user_metadata?.full_name || 'User',
              avatar_url: session.user.user_metadata?.avatar_url || null
            }
          }
          
          authStore.setUser(completeUser)
          if (session.access_token) {
            authStore.setToken(session.access_token)
          }
          
          console.log('[Auth Plugin] ✅ Session restored with fallback data')
          return
        }

        console.log('[Auth Plugin] ✅ Profile fetched successfully')
        console.log('[Auth Plugin] Profile username:', profile.username)
        
        // ============================================================================
        // STEP 3: Merge profile data with auth user
        // ============================================================================
        const completeUser = {
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          }
        }
        
        console.log('[Auth Plugin] Complete user object:', {
          id: completeUser.id,
          email: completeUser.email,
          username: completeUser.user_metadata?.username,
          full_name: completeUser.user_metadata?.full_name
        })
        
        // Set user in auth store
        authStore.setUser(completeUser)
        
        // Set token if available
        if (session.access_token) {
          authStore.setToken(session.access_token)
        }
        
        console.log('[Auth Plugin] ✅ Session restored successfully with profile data')
      } else {
        console.log('[Auth Plugin] No active session found')
      }

      // ============================================================================
      // LISTEN FOR AUTH STATE CHANGES
      // ============================================================================
      console.log('[Auth Plugin] Setting up auth state change listener...')
      
      $supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth Plugin] Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth Plugin] User signed in:', session.user.id)
          
          // Fetch profile for newly signed in user
          const { data: profile, error: profileError } = await $supabase
            .from('profiles')
            .select('id, username, full_name, email, avatar_url, bio, location, verified')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            console.warn('[Auth Plugin] ⚠️ Profile fetch error on sign in:', profileError.message)
            // Use auth user metadata as fallback
            const completeUser = {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                username: session.user.user_metadata?.username || 'user',
                full_name: session.user.user_metadata?.full_name || 'User',
                avatar_url: session.user.user_metadata?.avatar_url || null
              }
            }
            authStore.setUser(completeUser)
          } else if (profile) {
            // Merge profile data with auth user
            const completeUser = {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url
              }
            }
            authStore.setUser(completeUser)
            console.log('[Auth Plugin] ✅ User signed in with profile data')
          }
          
          if (session.access_token) {
            authStore.setToken(session.access_token)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth Plugin] User signed out')
          authStore.clearAuth()
        } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          console.log('[Auth Plugin] Token refreshed')
          authStore.setToken(session.access_token)
          
          // Also refresh profile data on token refresh
          if (session.user) {
            const { data: profile, error: profileError } = await $supabase
              .from('profiles')
              .select('id, username, full_name, email, avatar_url, bio, location, verified')
              .eq('id', session.user.id)
              .single()
            
            if (!profileError && profile) {
              const completeUser = {
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  username: profile.username,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url
                }
              }
              authStore.setUser(completeUser)
              console.log('[Auth Plugin] ✅ Profile data refreshed on token refresh')
            }
          }
        }
      })

      console.log('[Auth Plugin] ✅ Initialization complete')

    } catch (err: any) {
      console.error('[Auth Plugin] ❌ Initialization error:', err.message)
      // Don't throw - allow app to continue without auth
    }
  }
})
