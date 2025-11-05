// FILE: /plugins/supabase.client.ts
// ✅ FIXED - Exports composables like @nuxtjs/supabase

import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  let supabaseClient: any = null
  const user = ref(null)

  try {
    const supabaseUrl = config.public.supabaseUrl
    const supabaseKey = config.public.supabaseKey

    if (supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey)
      console.log('[Supabase] Client initialized successfully')
      
      // Auto-load user on plugin init
      supabaseClient.auth.getUser().then((data: any) => {
        user.value = data.data?.user || null
      }).catch((err: any) => {
        console.warn('[Supabase] Failed to load user:', err.message)
      })
    } else {
      console.warn('[Supabase] Missing credentials, Supabase disabled')
    }
  } catch (error) {
    console.error('[Supabase] Initialization error:', error)
  }

  // ✅ Export composables that match @nuxtjs/supabase API
  return {
    provide: {
      supabase: supabaseClient,
    }
  }
})

// ✅ Export composables for use in components
export const useSupabaseClient = () => {
  const { $supabase } = useNuxtApp()
  return $supabase
}

export const useSupabaseUser = () => {
  const { $supabase } = useNuxtApp()
  const user = ref(null)
  
  if ($supabase) {
    $supabase.auth.getUser().then((data: any) => {
      user.value = data.data?.user || null
    })
  }
  
  return user
}

