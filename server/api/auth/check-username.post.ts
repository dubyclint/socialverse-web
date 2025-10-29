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
    
    const { data, error, count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('username', trimmedUsername)
    
    console.log('[CheckUsername] Query result:', { 
      count, 
      dataLength: data?.length,
      error: error?.message, 
      errorCode: error?.code 
    })
    
    if (error) {
      console.error('[CheckUsername] Database query error:', error.message, error.code)
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
      username: trimmedUsername
    }
    
  } catch (err: any) {
    console.error('[CheckUsername] Unexpected error:', err.message)
    
    if (err.statusCode) {
      throw err
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: `Username check failed: ${err.message}`
    })
  }
})
