import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { username } = await readBody(event)
    
    console.log('[CheckUsername] Input:', username)
    
    if (!username || typeof username !== 'string') {
      console.log('[CheckUsername] Invalid input')
      return { available: false, reason: 'Invalid username' }
    }
    
    const trimmedUsername = username.trim().toLowerCase()
    console.log('[CheckUsername] Trimmed:', trimmedUsername)
    
    // Validation
    if (trimmedUsername.length < 3) {
      return { available: false, reason: 'Username must be at least 3 characters' }
    }
    
    if (trimmedUsername.length > 30) {
      return { available: false, reason: 'Username must be less than 30 characters' }
    }
    
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      return { available: false, reason: 'Username can only contain letters, numbers, underscores, and hyphens' }
    }
    
    // Query database
    console.log('[CheckUsername] Querying database...')
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('username', trimmedUsername)
    
    console.log('[CheckUsername] Query result:', {
      count,
      error: error?.message,
      errorCode: error?.code,
      data
    })
    
    // If there's an error, log it but don't fail
    if (error) {
      console.error('[CheckUsername] Database error:', error)
      // Return available: true as fallback (let signup handle the duplicate check)
      return { 
        available: true,
        username: trimmedUsername,
        message: 'Username check unavailable, proceeding...'
      }
    }
    
    // Check if username is taken
    const isTaken = count !== null && count > 0
    console.log('[CheckUsername] Username taken:', isTaken)
    
    return {
      available: !isTaken,
      count: count || 0,
      username: trimmedUsername,
      message: isTaken ? 'Username already taken' : 'Username is available'
    }
    
  } catch (err) {
    console.error('[CheckUsername] Exception:', err)
    // On error, return available: true to let signup handle it
    return { 
      available: true,
      message: 'Username check unavailable'
    }
  }
})
