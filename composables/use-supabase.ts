// FILE: /composables/use-supabase.ts (FIXED - COMPLETE VERSION)
// ============================================================================
// SUPABASE COMPOSABLE - FIXED: Proper exports and error handling
// ============================================================================
// ✅ CRITICAL FIX: Export useSupabaseClient function
// ✅ Proper error handling and logging
// ✅ Type-safe return values
// ✅ Comprehensive documentation
// ✅ Fallback handling for missing client
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Return type for useSupabase composable
 */
interface UseSupabaseReturn {
  client: SupabaseClient | null
}

/**
 * ✅ FIXED: useSupabase composable
 * Returns the Supabase client instance
 * 
 * @returns Object containing Supabase client or null
 * 
 * @example
 * const { client } = useSupabase()
 * if (client) {
 *   const { data } = await client.from('users').select('*')
 * }
 */
export const useSupabase = (): UseSupabaseReturn => {
  try {
    console.log('[useSupabase] Accessing Supabase client...')
    
    const { $supabase } = useNuxtApp()
    
    if (!$supabase) {
      console.warn('[useSupabase] ⚠️ Supabase client not available in Nuxt app')
      return { client: null }
    }
    
    console.log('[useSupabase] ✅ Supabase client available')
    return { client: $supabase }
  } catch (error: any) {
    console.warn('[useSupabase] ⚠️ Error accessing Supabase:', error.message)
    return { client: null }
  }
}

/**
 * ✅ CRITICAL FIX: useSupabaseClient composable
 * Returns the Supabase client instance directly
 * Throws error if client is not available
 * 
 * @returns Supabase client instance
 * @throws Error if Supabase client is not initialized
 * 
 * @example
 * const supabase = useSupabaseClient()
 * const { data } = await supabase.from('users').select('*')
 */
export const useSupabaseClient = (): SupabaseClient => {
  try {
    console.log('[useSupabaseClient] Accessing Supabase client...')
    
    const { $supabase } = useNuxtApp()
    
    if (!$supabase) {
      console.error('[useSupabaseClient] ❌ Supabase client not initialized')
      throw new Error('Supabase client not initialized. Make sure the Supabase plugin is loaded.')
    }
    
    console.log('[useSupabaseClient] ✅ Supabase client available')
    return $supabase
  } catch (error: any) {
    console.error('[useSupabaseClient] ❌ Error accessing Supabase:', error.message)
    throw error
  }
}

/**
 * ✅ FIXED: useSupabaseAuth composable
 * Returns Supabase auth methods
 * 
 * @returns Object containing auth methods
 * 
 * @example
 * const { getUser, getSession } = useSupabaseAuth()
 * const { data: { user } } = await getUser()
 */
export const useSupabaseAuth = () => {
  try {
    console.log('[useSupabaseAuth] Accessing Supabase auth...')
    
    const supabase = useSupabaseClient()
    
    return {
      /**
       * Get current user
       */
      async getUser() {
        try {
          console.log('[useSupabaseAuth] Getting current user...')
          const { data: { user }, error } = await supabase.auth.getUser()
          
          if (error) {
            console.error('[useSupabaseAuth] ❌ Error getting user:', error.message)
            throw error
          }
          
          if (user) {
            console.log('[useSupabaseAuth] ✅ User found:', user.email)
          } else {
            console.log('[useSupabaseAuth] ℹ️ No user logged in')
          }
          
          return { user, error: null }
        } catch (err: any) {
          console.error('[useSupabaseAuth] ❌ Failed to get user:', err.message)
          return { user: null, error: err }
        }
      },

      /**
       * Get current session
       */
      async getSession() {
        try {
          console.log('[useSupabaseAuth] Getting current session...')
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('[useSupabaseAuth] ❌ Error getting session:', error.message)
            throw error
          }
          
          if (session) {
            console.log('[useSupabaseAuth] ✅ Session found')
          } else {
            console.log('[useSupabaseAuth] ℹ️ No session available')
          }
          
          return { session, error: null }
        } catch (err: any) {
          console.error('[useSupabaseAuth] ❌ Failed to get session:', err.message)
          return { session: null, error: err }
        }
      },

      /**
       * Sign in with email and password
       */
      async signIn(email: string, password: string) {
        try {
          console.log('[useSupabaseAuth] Signing in user:', email)
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (error) {
            console.error('[useSupabaseAuth] ❌ Sign in failed:', error.message)
            throw error
          }
          
          console.log('[useSupabaseAuth] ✅ User signed in successfully')
          return { data, error: null }
        } catch (err: any) {
          console.error('[useSupabaseAuth] ❌ Sign in error:', err.message)
          return { data: null, error: err }
        }
      },

      /**
       * Sign up with email and password
       */
      async signUp(email: string, password: string) {
        try {
          console.log('[useSupabaseAuth] Signing up user:', email)
          const { data, error } = await supabase.auth.signUp({
            email,
            password
          })
          
          if (error) {
            console.error('[useSupabaseAuth] ❌ Sign up failed:', error.message)
            throw error
          }
          
          console.log('[useSupabaseAuth] ✅ User signed up successfully')
          return { data, error: null }
        } catch (err: any) {
          console.error('[useSupabaseAuth] ❌ Sign up error:', err.message)
          return { data: null, error: err }
        }
      },

      /**
       * Sign out current user
       */
      async signOut() {
        try {
          console.log('[useSupabaseAuth] Signing out user...')
          const { error } = await supabase.auth.signOut()
          
          if (error) {
            console.error('[useSupabaseAuth] ❌ Sign out failed:', error.message)
            throw error
          }
          
          console.log('[useSupabaseAuth] ✅ User signed out successfully')
          return { error: null }
        } catch (err: any) {
          console.error('[useSupabaseAuth] ❌ Sign out error:', err.message)
          return { error: err }
        }
      },

      /**
       * Listen to auth state changes
       */
      onAuthStateChange(callback: (event: string, session: any) => void) {
        try {
          console.log('[useSupabaseAuth] Setting up auth state listener...')
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              console.log('[useSupabaseAuth] Auth state changed:', event)
              callback(event, session)
            }
          )
          
          console.log('[useSupabaseAuth] ✅ Auth state listener set up')
          
          // Return unsubscribe function
          return () => {
            console.log('[useSupabaseAuth] Unsubscribing from auth state changes')
            subscription?.unsubscribe()
          }
        } catch (err: any) {
          console.error('[useSupabaseAuth] ❌ Error setting up listener:', err.message)
          return () => {}
        }
      }
    }
  } catch (error: any) {
    console.error('[useSupabaseAuth] ❌ Error initializing auth:', error.message)
    
    // Return stub methods that throw errors
    return {
      async getUser() {
        throw error
      },
      async getSession() {
        throw error
      },
      async signIn() {
        throw error
      },
      async signUp() {
        throw error
      },
      async signOut() {
        throw error
      },
      onAuthStateChange() {
        return () => {}
      }
    }
  }
}

/**
 * ✅ FIXED: useSupabaseDatabase composable
 * Returns Supabase database methods
 * 
 * @returns Object containing database methods
 * 
 * @example
 * const { query } = useSupabaseDatabase()
 * const { data } = await query('users').select('*')
 */
export const useSupabaseDatabase = () => {
  try {
    console.log('[useSupabaseDatabase] Accessing Supabase database...')
    
    const supabase = useSupabaseClient()
    
    return {
      /**
       * Query a table
       */
      query(table: string) {
        console.log('[useSupabaseDatabase] Querying table:', table)
        return supabase.from(table)
      },

      /**
       * Execute raw SQL query
       */
      async rpc(functionName: string, params?: any) {
        try {
          console.log('[useSupabaseDatabase] Calling RPC function:', functionName)
          const { data, error } = await supabase.rpc(functionName, params)
          
          if (error) {
            console.error('[useSupabaseDatabase] ❌ RPC error:', error.message)
            throw error
          }
          
          console.log('[useSupabaseDatabase] ✅ RPC call successful')
          return { data, error: null }
        } catch (err: any) {
          console.error('[useSupabaseDatabase] ❌ RPC failed:', err.message)
          return { data: null, error: err }
        }
      }
    }
  } catch (error: any) {
    console.error('[useSupabaseDatabase] ❌ Error initializing database:', error.message)
    
    // Return stub methods that throw errors
    return {
      query() {
        throw error
      },
      async rpc() {
        throw error
      }
    }
  }
}

/**
 * ✅ FIXED: useSupabaseStorage composable
 * Returns Supabase storage methods
 * 
 * @returns Object containing storage methods
 * 
 * @example
 * const { upload, download } = useSupabaseStorage()
 * await upload('avatars', 'user-123.jpg', file)
 */
export const useSupabaseStorage = () => {
  try {
    console.log('[useSupabaseStorage] Accessing Supabase storage...')
    
    const supabase = useSupabaseClient()
    
    return {
      /**
       * Upload file to storage
       */
      async upload(bucket: string, path: string, file: File) {
        try {
          console.log('[useSupabaseStorage] Uploading file to bucket:', bucket, 'path:', path)
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file)
          
          if (error) {
            console.error('[useSupabaseStorage] ❌ Upload error:', error.message)
            throw error
          }
          
          console.log('[useSupabaseStorage] ✅ File uploaded successfully')
          return { data, error: null }
        } catch (err: any) {
          console.error('[useSupabaseStorage] ❌ Upload failed:', err.message)
          return { data: null, error: err }
        }
      },

      /**
       * Download file from storage
       */
      async download(bucket: string, path: string) {
        try {
          console.log('[useSupabaseStorage] Downloading file from bucket:', bucket, 'path:', path)
          const { data, error } = await supabase.storage
            .from(bucket)
            .download(path)
          
          if (error) {
            console.error('[useSupabaseStorage] ❌ Download error:', error.message)
            throw error
          }
          
          console.log('[useSupabaseStorage] ✅ File downloaded successfully')
          return { data, error: null }
        } catch (err: any) {
          console.error('[useSupabaseStorage] ❌ Download failed:', err.message)
          return { data: null, error: err }
        }
      },

      /**
       * Get public URL for file
       */
      getPublicUrl(bucket: string, path: string) {
        try {
          console.log('[useSupabaseStorage] Getting public URL for bucket:', bucket, 'path:', path)
          const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)
          
          console.log('[useSupabaseStorage] ✅ Public URL generated')
          return { url: data.publicUrl, error: null }
        } catch (err: any) {
          console.error('[useSupabaseStorage] ❌ Error getting public URL:', err.message)
          return { url: null, error: err }
        }
      },

      /**
       * Delete file from storage
       */
      async delete(bucket: string, path: string) {
        try {
          console.log('[useSupabaseStorage] Deleting file from bucket:', bucket, 'path:', path)
          const { data, error } = await supabase.storage
            .from(bucket)
            .remove([path])
          
          if (error) {
            console.error('[useSupabaseStorage] ❌ Delete error:', error.message)
            throw error
          }
          
          console.log('[useSupabaseStorage] ✅ File deleted successfully')
          return { data, error: null }
        } catch (err: any) {
          console.error('[useSupabaseStorage] ❌ Delete failed:', err.message)
          return { data: null, error: err }
        }
      }
    }
  } catch (error: any) {
    console.error('[useSupabaseStorage] ❌ Error initializing storage:', error.message)
    
    // Return stub methods that throw errors
    return {
      async upload() {
        throw error
      },
      async download() {
        throw error
      },
      getPublicUrl() {
        throw error
      },
      async delete() {
        throw error
      }
    }
  }
    }
