import type { SupabaseClient } from '@supabase/supabase-js'

// @nuxtjs/supabase injects `$supabase` ({ client }); the app plugin re-provides
// the individual client/auth/db helpers. Type them so consumers stay typed.
declare module '#app' {
  interface NuxtApp {
    $supabase?: { client: SupabaseClient }
    $supabaseClient?: SupabaseClient | null
    $supabaseAuth?: SupabaseClient['auth'] | null
    $supabaseDb?: SupabaseClient | null
  }
}

export {}
