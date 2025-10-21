// ✅ FIXED - Removed PostgreSQL Pool, using Supabase instead
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
