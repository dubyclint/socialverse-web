// FILE: /plugins/supabase-wrapper.client.ts
// Global Supabase wrapper - Prevents "useSupabaseClient is not defined" errors

export default defineNuxtPlugin((nuxtApp) => {
  // Create a safe wrapper for useSupabaseClient
  const useSupabaseClientSafe = () => {
    try {
      // Try to get from Nuxt app context first
      const { $supabase } = nuxtApp
      if ($supabase) {
        return $supabase
      }
      
      // Fallback: return null
      return null
    } catch (error) {
      console.warn('[Supabase Wrapper] Error accessing Supabase:', error.message)
      return null
    }
  }

  // Create a safe wrapper for useSupabaseUser
  const useSupabaseUserSafe = () => {
    return { value: null }
  }

  // Make these available globally
  if (typeof window !== 'undefined') {
    (window as any).useSupabaseClient = useSupabaseClientSafe
    (window as any).useSupabaseUser = useSupabaseUserSafe
  }

  return {
    provide: {
      useSupabaseClient: useSupabaseClientSafe,
      useSupabaseUser: useSupabaseUserSafe,
    }
  }
})
