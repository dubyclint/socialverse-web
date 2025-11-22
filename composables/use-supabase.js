// FILE: /composables/useSupabase.js
// Supabase composable - Uses custom plugin

export const useSupabase = () => {
  try {
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
