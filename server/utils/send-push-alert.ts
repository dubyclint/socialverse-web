import { getSupabaseClient } from './database';

// Mock push service - replace with actual implementation (FCM, APNs, etc.)
const pushService = {
  async send(notification: { to: string; title: string; body: string }) {
    console.log('Push notification sent:', notification);
    // TODO: Implement actual push notification service
    return Promise.resolve();
  }
};

export async function sendPushAlert(
  userId: string, 
  title: string, 
  body: string
): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Failed to get user for push notification:', error);
      return;
    }
    
    if (!user?.push_token) {
      console.log('No push token found for user:', userId);
      return;
    }

    await pushService.send({
      to: user.push_token,
      title,
      body
    });

    console.log(`Push alert sent to user ${userId}:`);
  } catch (error) {
    console.error('Error sending push alert:', error);
  }
}
