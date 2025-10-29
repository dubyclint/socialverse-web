import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { username } = await readBody(event)
    
    console.log('[CheckUsername] Checking username:', username)
    
    if (!username || username.length < 3) {
      console.log('[CheckUsername] Username too short')
      return { available: false }
    }
    
    // Query the profiles table to check if username exists
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('username', username.toLowerCase())
    
    console.log('[CheckUsername] Query result:', { 
      count, 
      error: error?.message, 
      errorCode: error?.code 
    })
    
    if (error) {
      console.error('[CheckUsername] Query error:', error.message)
      // If query fails, assume username is available (don't block signup)
      return { available: true }
    }
    
    // Username is taken if count > 0
    const isTaken = (count && count > 0) || (data && data.length > 0)
    
    console.log('[CheckUsername] Result - Username taken:', isTaken)
    
    return { available: !isTaken }
  } catch (err: any) {
    console.error('[CheckUsername] Unexpected error:', err.message)
    return { available: true }
  }
})

