import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { username } = await readBody(event)
    
    console.log('[CheckUsername] Checking username:', username)
    
    if (!username || username.length < 3) {
      console.log('[CheckUsername] Username too short')
      return { available: false, reason: 'Username must be at least 3 characters' }
    }
    
    // Validate username format (alphanumeric, underscore, hyphen only)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      console.log('[CheckUsername] Invalid username format')
      return { available: false, reason: 'Username can only contain letters, numbers, underscores, and hyphens' }
    }
    
    // Query the profiles table to check if username exists
    // Convert to lowercase for case-insensitive comparison
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('username', username)  // Use ilike for case-insensitive search
    
    console.log('[CheckUsername] Query result:', { 
      count, 
      dataLength: data?.length,
      error: error?.message, 
      errorCode: error?.code 
    })
    
    if (error) {
      console.error('[CheckUsername] Query error:', error.message)
      // If query fails, return error instead of assuming available
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`
      })
    }
    
    // Check if username is taken
    const isTaken = count !== null && count > 0
    
    console.log('[CheckUsername] Result - Username taken:', isTaken, '| Count:', count)
    
    return { 
      available: !isTaken,
      count: count || 0
    }
  } catch (err: any) {
    console.error('[CheckUsername] Unexpected error:', err.message)
    throw createError({
      statusCode: 500,
      statusMessage: `Username check failed: ${err.message}`
    })
  }
})

