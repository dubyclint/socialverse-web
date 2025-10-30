import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { username } = await readBody(event)
    
    const trimmedUsername = username.trim().toLowerCase()
    
    console.log('=== DEBUG USERNAME CHECK ===')
    console.log('Username:', trimmedUsername)
    
    // Test 1: Direct query
    console.log('Test 1: Direct query with eq()')
    const test1 = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmedUsername)
    
    console.log('Test 1 result:', { data: test1.data, error: test1.error })
    
    // Test 2: ilike query
    console.log('Test 2: Query with ilike()')
    const test2 = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', trimmedUsername)
    
    console.log('Test 2 result:', { data: test2.data, error: test2.error })
    
    // Test 3: Count query
    console.log('Test 3: Count query')
    const test3 = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('username', trimmedUsername)
    
    console.log('Test 3 result:', { count: test3.count, error: test3.error })
    
    // Test 4: Get all profiles
    console.log('Test 4: Get all profiles')
    const test4 = await supabase
      .from('profiles')
      .select('id, username')
      .limit(10)
    
    console.log('Test 4 result:', { data: test4.data, error: test4.error })
    
    return {
      test1: { data: test1.data, error: test1.error?.message },
      test2: { data: test2.data, error: test2.error?.message },
      test3: { count: test3.count, error: test3.error?.message },
      test4: { data: test4.data, error: test4.error?.message }
    }
    
  } catch (err) {
    console.error('Debug error:', err)
    throw err
  }
})
  
