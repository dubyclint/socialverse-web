import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { username } = await readBody(event)
    
    if (!username || username.length < 3) {
      return { available: false }
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      console.error('[CheckUsername] Error:', error)
      return { available: false }
    }
    
    return { available: !data }
  } catch (error) {
    console.error('[CheckUsername] Error:', error)
    return { available: false }
  }
})

