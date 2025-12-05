import { getSupabaseClient } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const supabase = await getSupabaseClient();
    const body = await readBody(event);
    const { name, socialLink, docUrl } = body;
    const userId = event.context.user.id;

    if (!name || !socialLink) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: name and socialLink'
      });
    }

    const requestData = {
      id: crypto.randomUUID(),
      user_id: userId,
      name,
      social_link: socialLink,
      doc_url: docUrl || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('badge_requests')
      .insert(requestData);
      
    if (error) throw error;

    return { status: 'pending', id: requestData.id };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit verification request'
    });
  }
});
