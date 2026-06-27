import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const method = getMethod(event)
  
  if (method === 'GET') {
    try {
      const { data: contacts, error } = await supabase
        .from('support_contacts')
        .select('*')
        
      if (error) throw error
      return contacts
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch support contacts'
      })
    }
  }

  if (method === 'POST') {
    try {
      const contacts = await readBody(event)
      
      // Delete existing contacts and insert new ones
      const { error: deleteError } = await supabase
        .from('support_contacts')
        .delete()
        .neq('id', ) // Delete all
        
      if (deleteError) throw deleteError
      
      const { error: insertError } = await supabase
        .from('support_contacts')
        .insert(contacts)
        
      if (insertError) throw insertError
      
      return { success: true, message: 'Support contacts updated.' }
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update support contacts'
      })
    }
  }
})
