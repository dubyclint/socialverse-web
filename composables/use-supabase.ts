// composables/use-supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js'

interface UseSupabaseReturn {
  client: SupabaseClient | null
}

export const useSupabase = (): UseSupabaseReturn => {
  try {
    const { $supabase } = useNuxtApp()
    if (!$supabase) {
      console.warn('[useSupabase] Supabase client not available')
      return { client: null }
    }
    return { client: $supabase }
  } catch (error: any) {
    console.warn('[useSupabase] Error accessing Supabase:', error.message)
    return { client: null }
  }
}
