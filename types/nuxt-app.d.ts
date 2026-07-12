import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// @nuxtjs/supabase injects `$supabase` ({ client }); the app plugin re-provides
// the individual client/auth/db helpers. Type them so consumers stay strict.
declare module '#app' {
  interface NuxtApp {
    $supabase?: { client: SupabaseClient<Database> }
    $supabaseClient?: SupabaseClient<Database> | null
    $supabaseAuth?: SupabaseClient<Database>['auth'] | null
    $supabaseDb?: SupabaseClient<Database> | null
  }
}

export {}
