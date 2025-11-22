import { supabase } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  if (method === 'GET') {
    try {
      const { data: contacts, error } = await supabase
        .from('support_contacts')
        .select('*');
        
      if (error) throw error;
      return contacts;
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch support contacts'
      });
    }
  }

  if (method === 'POST') {
    try {
      const contacts = await readBody(event);
      
      // Delete existing contacts
      await supabase.from('support_contacts').delete().neq('id', 0);
      
      // Insert new contacts
      const { error } = await supabase
        .from('support_contacts')
        .insert(contacts);
        
      if (error) throw error;
      return { success: true };
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update support contacts'
      });
    }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  });
});
