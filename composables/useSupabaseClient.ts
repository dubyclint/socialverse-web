// ============================================================================
// FILE: /composables/useSupabaseClient.ts - FIXED
// ============================================================================
// Explicit wrapper exposing the core Supabase Client from the App Context
// ============================================================================

import { useNuxtApp } from '#app'

export const useSupabaseClient = () => {
  const nuxtApp = useNuxtApp()
  
  // Verify that the Nuxt App Context has loaded the Supabase injection layer
  if (!nuxtApp.$supabase) {
    console.error('[Engine Exception] ❌ Core Supabase client instance was not found on the runtime App Context.')
    throw new Error('Supabase runtime instance is uninitialized or blocked by context lifecycle.')
  }
  
  // Return the underlying operational client engine instance directly
  return nuxtApp.$supabase.client
}
