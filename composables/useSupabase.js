// FILE: /composables/useSupabase.js
// Supabase client composable - Safe wrapper

export const useSupabase = () => {
  try {
    // Get the Supabase client from the plugin
    const { $supabase } = useNuxtApp()
    
    if (!$supabase) {
      console.warn('[useSupabase] Supabase client not available')
      return null
    }
    
    return $supabase
  } catch (error) {
    console.warn('[useSupabase] Error accessing Supabase:', error.message)
    return null
  }
}
