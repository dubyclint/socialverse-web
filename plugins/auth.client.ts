// ============================================================================
// FILE 5: /plugins/auth.client.ts - COMPLETE FIXED VERSION
// ============================================================================
// FIXES:
// ✅ Verify profile data is merged correctly
// ✅ Ensure fallback works if profile missing
// ✅ Better error handling
// ✅ Improved logging
// ✅ Profile data fetching on session restore
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

    console.log('[Auth Plugin] ============ INITIALIZATION START ============')

    try {
      // ============================================================================
      // GET REQUIRED DEPENDENCIES
      // ============================================================================
      const authStore = useAuthStore()
      const { $supabase, $supabaseReady } = nuxtApp

      console.log('[Auth Plugin] Dependencies obtained')
      console.log('[Auth Plugin] Supabase available:', !!$supabase)
      console.log('[Auth Plugin] Supabase ready:', !!$supabaseReady)

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
      console.log('[Auth Plugin] Getting current session...')
      
      const { data: { session }, error } = await $supabase.auth.getSession()

      if (error) {
        console.error('[Auth Plugin] ❌ Session error:', error.message)
        return
      }

      console.log('[Auth Plugin] Session retrieved:', !!session)

      // ============================================================================
      // RESTORE SESSION IF EXISTS
      // ============================================================================
      if (session?.user) {
        console.log('[Auth Plugin] ✅ User session found:', session.user.id)
        console.log('[Auth Plugin] User email:', session.user.email)
        console.log('[Auth Plugin] User metadata:', {
          username: session.user.user_metadata?.username,
          full_name: session.user.user_metadata?.full_name
        })
        
        // ============================================================================
        // STEP 1: Fetch profile from profiles table
        // ============================================================================
        console.log('[Auth Plugin] STEP 1: Fetching profile from profiles table...')
        
        const { data: profile, error: profileError } = await $supabase
          .from('profiles')
          .select('id, username, full_name, email, avatar_url, bio, location, verified')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.warn('[Auth Plugin] ⚠️ Profile fetch error:', {
            message: profileError.message,
            code: profileError.code
          })
          
          // ============================================================================
          // FALLBACK 1: Profile doesn't exist - try to create it
          // ============================================================================
          if (profileError.code === 'PGRST116') {
            console.log('[Auth Plugin] Profile not found (PGRST116), attempting to create...')
            
            const username = session.user.user_metadata?.username || 
                           session.user.email?.split('@')[0] || 
                           'user'
            const fullName = session.user.user_metadata?.full_name || username
            
            console.log('[Auth Plugin] Creating profile with:', {
              username,
              fullName,
              email: session.user.email
            })
            
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
              console.warn('[Auth Plugin] ⚠️ Failed to create profile:', {
                message: createError.message,
                code: createError.code
              })
              console.log('[Auth Plugin] Using auth user metadata as fallback')
              
              // ============================================================================
              // FALLBACK 2: Profile creation failed - use auth metadata
              // ============================================================================
              const completeUser = {
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  username: session.user.user_metadata?.username || username,
                  full_name: session.user.user_metadata?.full_name || fullName,
                  avatar_url: session.user.user_metadata?.avatar_url || null
                }
              }
              
              console.log('[Auth Plugin] ✅ Setting user with fallback data:', {
                id: completeUser.id,
                email: completeUser.email,
                username: completeUser.user_metadata.username
              })
              
              authStore.setUser(completeUser)
              if (session.access_token) {
                authStore.setToken(session.access_token)
              }
              
              console.log('[Auth Plugin] ✅ Session restored with fallback data')
              console.log('[Auth Plugin] ============ INITIALIZATION END ============')
              return
            }
            
            console.log('[Auth Plugin] ✅ Profile created successfully')
            console.log('[Auth Plugin] New profile:', {
              id: newProfile.id,
              username: newProfile.username,
              full_name: newProfile.full_name
            })
            
            // ============================================================================
            // STEP 2: Merge newly created profile data with auth user
            // ============================================================================
            console.log('[Auth Plugin] STEP 2: Merging profile data with auth user...')
            
            const completeUser = {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                username: newProfile.username,
                full_name: newProfile.full_name,
                avatar_url: newProfile.avatar_url
              }
            }
            
            console.log('[Auth Plugin] ✅ Complete user object created:', {
              id: completeUser.id,
              email: completeUser.email,
              username: completeUser.user_metadata.username,
              full_name: completeUser.user_metadata.full_name
            })
            
            authStore.setUser(completeUser)
            if (session.access_token) {
              authStore.setToken(session.access_token)
            }
            
            console.log('[Auth Plugin] ✅ Session restored with newly created profile')
            console.log('[Auth Plugin] ============ INITIALIZATION END ============')
            return
          }
          
          // ============================================================================
          // FALLBACK 3: Other profile fetch errors - use auth metadata
          // ============================================================================
          console.warn('[Auth Plugin] ⚠️ Other profile error, using auth user metadata as fallback')
          
          const completeUser = {
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              username: session.user.user_metadata?.username || 'user',
              full_name: session.user.user_metadata?.full_name || 'User',
              avatar_url: session.user.user_metadata?.avatar_url || null
            }
          }
          
          console.log('[Auth Plugin] ✅ Setting user with fallback data:', {
            id: completeUser.id,
            email: completeUser.email,
            username: completeUser.user_metadata.username
          })
          
          authStore.setUser(completeUser)
          if (session.access_token) {
            authStore.setToken(session.access_token)
          }
          
          console.log('[Auth Plugin] ✅ Session restored with fallback data')
          console.log('[Auth Plugin] ============ INITIALIZATION END ============')
          return
        }

        if (!profile) {
          console.warn('[Auth Plugin] ⚠️ Profile is null')
          
          // ============================================================================
          // FALLBACK 4: Profile query returned null - use auth metadata
          // ============================================================================
          const completeUser = {
            ...session.user,
            user_metadata: {
              ...session.user.user_metadata,
              username: session.user.user_metadata?.username || 'user',
              full_name: session.user.user_metadata?.full_name || 'User',
              avatar_url: session.user.user_metadata?.avatar_url || null
            }
          }
          
          console.log('[Auth Plugin] ✅ Setting user with fallback data:', {
            id: completeUser.id,
            email: completeUser.email,
            username: completeUser.user_metadata.username
          })
          
          authStore.setUser(completeUser)
          if (session.access_token) {
            authStore.setToken(session.access_token)
          }
          
          console.log('[Auth Plugin] ✅ Session restored with fallback data')
          console.log('[Auth Plugin] ============ INITIALIZATION END ============')
          return
        }

        console.log('[Auth Plugin] ✅ Profile fetched successfully')
        console.log('[Auth Plugin] Profile data:', {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url
        })
        
        // ============================================================================
        // STEP 3: Merge profile data with auth user
        // ============================================================================
        console.log('[Auth Plugin] STEP 3: Merging profile data with auth user...')
        
        const completeUser = {
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url
          }
        }
        
        console.log('[Auth Plugin] ✅ Complete user object created:', {
          id: completeUser.id,
          email: completeUser.email,
          username: completeUser.user_metadata.username,
          full_name: completeUser.user_metadata.full_name,
          avatar_url: completeUser.user_metadata.avatar_url
        })
        
        // Set user in auth store
        authStore.setUser(completeUser)
        
        // Set token if available
        if (session.access_token) {
          console.log('[Auth Plugin] Setting access token...')
          authStore.setToken(session.access_token)
          console.log('[Auth Plugin] ✅ Access token set')
        }
        
        console.log('[Auth Plugin] ✅ Session restored successfully with profile data')
        console.log('[Auth Plugin] ============ INITIALIZATION END ============')
      } else {
        console.log('[Auth Plugin] No active session found')
        console.log('[Auth Plugin] ============ INITIALIZATION END ============')
      }

      // ============================================================================
      // LISTEN FOR AUTH STATE CHANGES
      // ============================================================================
      console.log('[Auth Plugin] Setting up auth state change listener...')
      
      $supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth Plugin] ============ AUTH STATE CHANGED ============')
        console.log('[Auth Plugin] Event:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth Plugin] User signed in:', session.user.id)
          
          // ============================================================================
          // FETCH PROFILE FOR NEWLY SIGNED IN USER
          // ============================================================================
          console.log('[Auth Plugin] Fetching profile for newly signed in user...')
          
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
            console.log('[Auth Plugin] ✅ User set with fallback data')
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
            console.log('[Auth Plugin] ✅ Token set for signed in user')
          }
          
          console.log('[Auth Plugin] ============ AUTH STATE CHANGED END ============')
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth Plugin] User signed out')
          authStore.clearAuth()
          console.log('[Auth Plugin] ✅ Auth cleared')
          console.log('[Auth Plugin] ============ AUTH STATE CHANGED END ============')
        } else if (event === 'TOKEN_REFRESHED' && session?.access_token) {
          console.log('[Auth Plugin] Token refreshed')
          authStore.setToken(session.access_token)
          console.log('[Auth Plugin] ✅ Token updated')
          
          // ============================================================================
          // REFRESH PROFILE DATA ON TOKEN REFRESH
          // ============================================================================
          if (session.user) {
            console.log('[Auth Plugin] Refreshing profile data on token refresh...')
            
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
            } else if (profileError) {
              console.warn('[Auth Plugin] ⚠️ Failed to refresh profile on token refresh:', profileError.message)
            }
          }
          
          console.log('[Auth Plugin] ============ AUTH STATE CHANGED END ============')
        } else {
          console.log('[Auth Plugin] Other auth event:', event)
          console.log('[Auth Plugin] ============ AUTH STATE CHANGED END ============')
        }
      })

      console.log('[Auth Plugin] ✅ Auth state change listener set up')
      console.log('[Auth Plugin] ✅ Plugin initialization complete')

    } catch (err: any) {
      console.error('[Auth Plugin] ❌ Initialization error:', err.message)
      console.error('[Auth Plugin] Error stack:', err.stack)
      // Don't throw - allow app to continue without auth
    }
  }
})
