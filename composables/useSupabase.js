// FILE: /composables/useSupabase.js
// Supabase client composable - FIXED VERSION
// This composable should NOT be called during app initialization

let supabaseClientCache: any = null

export const useSupabase = () => {
  // Return cached client if available
  if (supabaseClientCache) {
    return supabaseClientCache
  }

  // Only try to get client on client side
  if (process.client) {
    try {
      // Try to access useSupabaseClient from global scope
      if (typeof useSupabaseClient !== 'undefined') {
        supabaseClientCache = useSupabaseClient()
        return supabaseClientCache
      }
    } catch (error) {
      console.warn('[useSupabase] useSupabaseClient not available:', error.message)
    }
  }

  // Return null if not available
  return null
}
