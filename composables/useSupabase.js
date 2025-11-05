// FILE: /composables/useSupabase.js - FIXED VERSION
// This composable wraps useSupabaseClient from @nuxtjs/supabase
// It should only be used on the client side

export const useSupabase = () => {
  // Check if we're on the server side
  if (process.server) {
    console.warn('[useSupabase] This composable should only be used on the client side')
    return null
  }
  
  // This will work on the client side because @nuxtjs/supabase auto-imports it
  try {
    return useSupabaseClient()
  } catch (error) {
    console.error('[useSupabase] Error getting Supabase client:', error)
    return null
  }
}
