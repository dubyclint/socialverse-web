import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const method = getMethod(event)

  if (method === 'GET') {
    try {
      const { userId } = getQuery(event)
      const { data: overrides, error } = await supabase
        .from('user_overrides')
        .select('*')
        .eq('user_id', userId)
        
      if (error) throw error
      return overrides
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch user overrides'
      })
    }
  }

  if (method === 'POST') {
    try {
      const override = await readBody(event)

      if (!override.userId || !override.overrideType || !override.key) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Missing required fields: userId, overrideType, key'
        })
      }

      const overrideData = {
        user_id: override.userId,
        override_type: override.overrideType,
        key: override.key,
        value: override.value,
        updated_at: new Date().toISOString(),
        created_at: override.createdAt || new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_overrides')
        .upsert(overrideData, {
          onConflict: 'user_id,override_type,key'
        })
        
      if (error) throw error
      return { success: true, message: 'Override saved.' }
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save user override'
      })
    }
  }

  if (method === 'DELETE') {
    try {
      const { userId, key } = await readBody(event)
      const { error } = await supabase
        .from('user_overrides')
        .delete()
        .eq('user_id', userId)
        .eq('key', key)
        
      if (error) throw error
      return { success: true, message: 'Override deleted.' }
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete user override'
      })
    }
  }
})


