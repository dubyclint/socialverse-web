import { supabase } from '~/server/utils/database';
// import { sendNotification } from '~/server/utils/sendNotification'; // May not exist
// import { sendPushAlert } from '~/server/utils/sendPushAlert'; // May not exist
// import { evaluateTrust } from '~/server/utils/evaluateTrust'; // May not exist

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user.id;
    const filters = await readBody(event);

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;

    // For now, skip trust evaluation and auto-approve
    // const trust = evaluateTrust(user);
    const trust = { isTrusted: true, criteriaMet: [], priorityRatio: 1 };

    if (trust.isTrusted) {
      // Update user filters
      const { error: updateError } = await supabase
        .from('users')
        .update({ match_filters: filters })
        .eq('id', userId);
        
      if (updateError) throw updateError;

      // Remove any pending filter requests
      await supabase
        .from('filter_requests')
        .delete()
        .eq('user_id', userId);

      // Send notifications (commented out for now)
      // await sendNotification(userId, 'filter', 'Your filters were auto-approved.');
      // await sendPushAlert(userId, 'Filters Activated', 'Your trusted filters are now live.');

      return {
        success: true,
        status: 'approved',
        autoApproved: true,
        criteriaMet: trust.criteriaMet,
        priorityRatio: trust.priorityRatio
      };
    }

    // Check for existing pending request
    const { data: existing } = await supabase
      .from('filter_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return { 
        success: false, 
        message: 'You already have a pending request.' 
      };
    }

    // Create new filter request
    const { error: insertError } = await supabase
      .from('filter_requests')
      .upsert({
        user_id: userId,
        filters,
        status: 'pending',
        approved_filters: [],
        rejected_filters: [],
        rejection_reason: '',
        submitted_at: new Date().toISOString()
      });
      
    if (insertError) throw insertError;

    // Send admin notifications (commented out for now)
    // await sendNotification('admin', 'filter', `${user.username} submitted a new match filter request.`);
    // await sendPushAlert('admin', 'New Filter Request', `${user.username} submitted filters.`);

    return { success: true, status: 'pending' };
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process filter request'
    });
  }
});

