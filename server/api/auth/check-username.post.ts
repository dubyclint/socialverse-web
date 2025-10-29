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
    
    // Use rpc call or direct query - bypass RLS by using service role
    // First, try a simple count query
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('username', username)
    
    console.log('[CheckUsername] Query result:', { data, error, count })
    
    if (error) {
      console.error('[CheckUsername] Query error:', error.message, error.code)
      
      // If it's a RLS error, log it but still try to help
      if (error.code === 'PGRST116' || error.message.includes('no rows')) {
        console.log('[CheckUsername] No rows found - username is available')
        return { available: true }
      }
      
      // For other errors, assume available to not block signup
      console.warn('[CheckUsername] Assuming username available due to error')
      return { available: true }
    }
    
    // If count is 0 or data is empty, username is available
    const isTaken = count && count > 0
    
    console.log('[CheckUsername] Username taken:', isTaken, 'Count:', count)
    
    return { available: !isTaken }
  } catch (err: any) {
    console.error('[CheckUsername] Unexpected error:', err.message)
    // On error, assume available to not block signup
    return { available: true }
  }
})
