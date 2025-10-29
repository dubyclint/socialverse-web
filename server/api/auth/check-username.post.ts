import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { username } = await readBody(event)
    
    console.log('[CheckUsername] Checking username:', username)
    
    // Validate input
    if (!username || typeof username !== 'string') {
      console.log('[CheckUsername] Invalid username input')
      return { available: false, reason: 'Invalid username' }
    }
    
    const trimmedUsername = username.trim().toLowerCase()
    
    if (trimmedUsername.length < 3) {
      console.log('[CheckUsername] Username too short')
      return { available: false, reason: 'Username must be at least 3 characters' }
    }
    
    if (trimmedUsername.length > 30) {
      console.log('[CheckUsername] Username too long')
      return { available: false, reason: 'Username must be less than 30 characters' }
    }
    
    // Validate username format (alphanumeric, underscore, hyphen only)
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      console.log('[CheckUsername] Invalid username format:', trimmedUsername)
      return { available: false, reason: 'Username can only contain letters, numbers, underscores, and hyphens' }
    }
    
    // Query the profiles table to check if username exists
    // Use ilike for case-insensitive search
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('username', trimmedUsername)
    
    console.log('[CheckUsername] Query result:', { 
      count, 
      dataLength: data?.length,
      error: error?.message, 
      errorCode: error?.code 
    })
    
    // Handle database errors
    if (error) {
      console.error('[CheckUsername] Database query error:', error.message, error.code)
      
      // Don't silently return available: true on error
      // Instead, throw an error so the frontend knows something went wrong
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`
      })
    }
    
    // Check if username is taken
    // count should be reliable when no error occurs
    const isTaken = count !== null && count > 0
    
    console.log('[CheckUsername] Result - Username taken:', isTaken, '| Count:', count)
    
    return { 
      available: !isTaken,
      count: count || 0,
      username: trimmedUsername
    }
    
  } catch (err: any) {
    console.error('[CheckUsername] Unexpected error:', err.message)
    
    // If it's already a formatted error, throw it
    if (err.statusCode) {
      throw err
    }
    
    // Otherwise, throw a generic error
    throw createError({
      statusCode: 500,
      statusMessage: `Username check failed: ${err.message}`
    })
  }
})

