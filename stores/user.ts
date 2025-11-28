// FILE: /stores/user.ts (Key changes only)
// ✅ FIXED - Proper null checking and error handling
// Addresses: Issue #3 (Pinia initialization), Issue #1 (Missing env vars)

import { defineStore } from 'pinia'
import { ref, computed, watch, readonly } from 'vue'
import { getSupabaseClient, isSupabaseReady } from '~/lib/supabase-factory'

// ... (keep existing interfaces)

export const useUserStore = defineStore('user', () => {
  // ... (keep existing state)

  /**
   * Initialize session with proper error handling
   * Addresses: Issue #3 (Pinia initialization)
   */
  const initializeSession = async () => {
    try {
      // Check if Supabase is ready (Addresses Issue #1)
      if (!isSupabaseReady()) {
        console.warn('[User Store] Supabase not ready, skipping session initialization')
        return
      }

      const supabase = getSupabaseClient()
      
      // Safety check - should not happen if isSupabaseReady() is true
      if (!supabase) {
        throw new Error('Supabase client is null')
      }

      console.log('[User Store] Initializing session...')
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }

      if (session?.user) {
        console.log('[User Store] ✅ Session found for user:', session.user.email)
        // Set user data
        currentUser.value = session.user
        isAuthenticated.value = true
      } else {
        console.log('[User Store] No active session')
        isAuthenticated.value = false
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[User Store] Session initialization failed:', err.message)
      isAuthenticated.value = false
      throw err
    }
  }

  /**
   * Fetch user profile with safety checks
   * Addresses: Issue #1 (Missing env vars)
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      // Check if Supabase is ready
      if (!isSupabaseReady()) {
        console.warn('[User Store] Supabase not ready, cannot fetch profile')
        return null
      }

      const supabase = getSupabaseClient()
      
      if (!supabase) {
        throw new Error('Supabase client is null')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      return data as UserProfile
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[User Store] Failed to fetch profile:', err.message)
      throw err
    }
  }

  // ... (keep existing methods, add safety checks to all Supabase calls)

  return {
    // State
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    
    // Methods
    initializeSession,
    fetchUserProfile,
    // ... (other methods)
  }
})
