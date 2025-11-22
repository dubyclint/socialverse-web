// FILE: /lib/supabase-factory.ts
// Supabase client factory - Can be used outside Vue components

import { createClient } from '@supabase/supabase-js'

let supabaseClient: any = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl
    const supabaseKey = config.public.supabaseKey

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Supabase Factory] Missing Supabase credentials')
      return null
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey)
    console.log('[Supabase Factory] Client created')
  }

  return supabaseClient
}

export const useSupabaseFactory = () => {
  return getSupabaseClient()
}
