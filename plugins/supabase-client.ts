// FILE: /plugins/supabase-client.ts - FIXED WITH REDIRECT URL
// ============================================================================
// SUPABASE CLIENT PLUGIN - FIXED: Proper redirect URL configuration
// ✅ FIXED: Added redirect URL for email verification
// ✅ FIXED: Detect session in URL from hash
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin({
  name: 'supabase-client',
  
  async setup(nuxtApp) {
    try {
      const config = useRuntimeConfig()
      
      const supabaseUrl = config.public.supabaseUrl
      const supabaseKey = config.public.supabaseKey
      const siteUrl = config.public.siteUrl || 'https://socialverse-web.zeabur.app'

      if (!supabaseUrl || !supabaseKey) {
        console.warn('[Supabase Plugin] ⚠️ Missing Supabase credentials')
        return {
          provide: {
            supabase: null,
            supabaseReady: false,
          },
        }
      }

      console.log('[Supabase Plugin] Initializing with site URL:', siteUrl)

      // ✅ FIX: Configure Supabase with proper redirect URL
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: process.client,
          autoRefreshToken: process.client,
          detectSessionInUrl: process.client,
          
          // ✅ CRITICAL: Set redirect URL for email verification
          redirectTo: `${siteUrl}/auth/verify-email`,
          
          // ✅ Storage configuration
          storage: process.client ? window.localStorage : undefined,
          storageKey: 'sb-auth-token',
          
          // ✅ Flow type
          flowType: 'pkce',
        },
      })

      console.log('[Supabase Plugin] ✅ Initialized with redirect URL:', `${siteUrl}/auth/verify-email`)

      return {
        provide: {
          supabase,
          supabaseReady: true,
        },
      }
    } catch (error) {
      console.error('[Supabase Plugin] ❌ Error:', error)
      return {
        provide: {
          supabase: null,
          supabaseReady: false,
        },
      }
    }
  }
})
