// server/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

// Create a Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseKey)

// Export serverSupabaseClient function for compatibility
export const serverSupabaseClient = () => {
  return supabase
}

// Export for compatibility with existing imports
export { serverSupabaseClient as default }
