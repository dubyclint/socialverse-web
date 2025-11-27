// FILE: /lib/supabase-factory.ts
// Supabase client factory - Can be used outside Vue components

import { createClient } from '@supabase/supabase-js'

let supabaseClient: any = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = 'https://cvzrhucbvezqwbesthek.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNenJodWNidmVcXdiZXN0aGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzgzMjYsImV4cCI6MjA3NDkNDMyNnk5QEwTbECqNxwt_HaUjUGDlYsHWuPrQVjY4I'

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
