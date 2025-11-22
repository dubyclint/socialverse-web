import { supabase } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    const { recipientId, message } = await readBody(event);

    // Insert chat message
    const { error: chatError } = await supabase
      .from('chats')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        message,
        timestamp: new Date().toISOString()
      });
      
    if (chatError) throw chatError;

    // Update user's chatted_with list
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('chatted_with')
      .eq('id', user.id)
      .single();
      
    if (fetchError) throw fetchError;

    const chattedWith = [...(currentUser.chatted_with || [])];
    if (!chattedWith.includes(recipientId)) {
      chattedWith.push(recipientId);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ chatted_with: chattedWith })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
    }

    return { success: true };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send message'
    });
  }
});
