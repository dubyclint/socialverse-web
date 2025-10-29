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
    
    // Query with RLS disabled (using service role would be better, but we'll use regular client)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username', { count: 'exact' })
      .eq('username', username)
      .limit(1)
    
    console.log('[CheckUsername] Query result:', { data, error })
    
    if (error) {
      console.error('[CheckUsername] Query error:', error)
      // If there's an error, assume username is available (don't block signup)
      return { available: true }
    }
    
    // If data exists and has items, username is taken
    const isTaken = data && data.length > 0
    
    console.log('[CheckUsername] Username taken:', isTaken)
    
    return { available: !isTaken }
  } catch (err) {
    console.error('[CheckUsername] Unexpected error:', err)
    // On error, assume available to not block signup
    return { available: true }
  }
})

