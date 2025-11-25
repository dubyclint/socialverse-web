// server/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

// Create a Supabase client for server-side operations
export const serverSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseKey)
}

// Export for compatibility with existing imports
export { serverSupabaseClient as default }
