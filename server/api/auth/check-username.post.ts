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
    
    // ✅ CHECK BOTH profiles table AND auth.users metadata
    console.log('[CheckUsername] Checking profiles table for username:', trimmedUsername)
    const { data: profileUsers, error: profileError, count: profileCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .ilike('username', trimmedUsername)
    
    console.log('[CheckUsername] Profiles table result:', { count: profileCount, error: profileError?.message })
    
    if (profileError) {
      console.error('[CheckUsername] Error checking profiles:', profileError)
    }
    
    // Check if username is taken in profiles
    if (profileCount && profileCount > 0) {
      console.log('[CheckUsername] Username already taken in profiles table')
      return { 
        available: false,
        count: profileCount,
        username: trimmedUsername,
        message: 'Username already taken'
      }
    }
    
    // ✅ ALSO check auth.users table (where Supabase stores user metadata)
    console.log('[CheckUsername] Checking auth.users for username in metadata...')
    const { data: authUsers, error: authError } = await supabase
      .rpc('check_username_in_auth', { p_username: trimmedUsername })
    
    if (authError) {
      console.log('[CheckUsername] RPC not available, skipping auth.users check')
      // RPC might not exist, that's okay - just check profiles
    } else if (authUsers && authUsers.exists) {
      console.log('[CheckUsername] Username already taken in auth.users')
      return { 
        available: false,
        username: trimmedUsername,
        message: 'Username already taken'
      }
    }
    
    console.log('[CheckUsername] Username is available')
    return { 
      available: true,
      count: 0,
      username: trimmedUsername,
      message: 'Username is available'
    }
    
  } catch (err) {
    console.error('[CheckUsername] Unexpected error:', err)
    throw err
  }
})
