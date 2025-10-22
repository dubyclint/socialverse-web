import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export const initializeDatabase = async () => {
  try {
    // Test connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      throw error
    }
    
    console.log('✅ Supabase database initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
}

export default initializeDatabase
