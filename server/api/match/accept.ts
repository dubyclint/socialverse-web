import { supabase } from '~/server/utils/database';

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const { userId } = await readBody(event);

  try {
    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('recent_matches, accepted_matches')
      .eq('id', user.id)
      .single();
      
    if (fetchError) throw fetchError;

    // Update arrays (Supabase doesn't have $addToSet, so we need to handle duplicates)
    const recentMatches = [...(currentUser.recent_matches || [])];
    const acceptedMatches = [...(currentUser.accepted_matches || [])];
    
    if (!recentMatches.includes(userId)) {
      recentMatches.push(userId);
    }
    if (!acceptedMatches.includes(userId)) {
      acceptedMatches.push(userId);
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        recent_matches: recentMatches,
        accepted_matches: acceptedMatches
      })
      .eq('id', user.id);
      
    if (updateError) throw updateError;

    return { success: true };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to accept match'
    });
  }
});

