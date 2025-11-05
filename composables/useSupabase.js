// FILE: /composables/useSupabase.js
// Supabase client composable - Safe version

export const useSupabase = () => {
  try {
    // useSupabaseClient is auto-imported by @nuxtjs/supabase
    // Only call it when actually needed (not at setup time)
    return useSupabaseClient()
  } catch (error) {
    console.error('[useSupabase] Error:', error.message)
    return null
  }
}
