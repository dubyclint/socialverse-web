import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()

const supabaseUrl = config.public.supabaseUrl as string
const supabaseAnonKey = config.public.supabaseAnonKey as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
