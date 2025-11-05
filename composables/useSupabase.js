// FILE: /composables/useSupabase.js
// Supabase client composable - SAFE VERSION
// Handles cases where useSupabaseClient is not yet available

export const useSupabase = () => {
  // Check if we're on client side
  if (!process.client) {
    return null
  }

  try {
    // useSupabaseClient should be auto-imported by @nuxtjs/supabase
    // If it's not available, this will throw an error which we catch
    return useSupabaseClient()
  } catch (error) {
    console.warn('[useSupabase] useSupabaseClient not available yet:', error.message)
    return null
  }
}
