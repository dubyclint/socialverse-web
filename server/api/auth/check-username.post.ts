import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { username } = await readBody(event)
    
    console.log('[CheckUsername] Checking username:', username)
    
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
    
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(trimmedUsername)) {
      console.log('[CheckUsername] Invalid username format:', trimmedUsername)
      return { available: false, reason: 'Username can only contain letters, numbers, underscores, and hyphens' }
    }
    
    // ✅ SIMPLE FIX: Use ilike for case-insensitive search
    console.log('[CheckUsername] Querying profiles table for username:', trimmedUsername)
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('username', trimmedUsername)  // Case-insensitive
    
    console.log('[CheckUsername] Query result:', { 
      count, 
      dataLength: data?.length,
      error: error?.message
    })
    
    if (error) {
      console.error('[CheckUsername] Database query error:', error.message)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`
      })
    }
    
    const isTaken = count !== null && count > 0
    
    console.log('[CheckUsername] Result - Username taken:', isTaken, '| Count:', count)
    
    return { 
      available: !isTaken,
      count: count || 0,
      username: trimmedUsername,
      message: isTaken ? 'Username already taken' : 'Username is available'
    }
    
  } catch (err) {
    console.error('[CheckUsername] Unexpected error:', err)
    throw err
  }
})
