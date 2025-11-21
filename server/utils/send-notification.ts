import { db } from './database';

export async function sendNotification(
  userId: string, 
  type: 'filter' | 'rematch' | 'group' | 'match' | 'system', 
  message: string
): Promise<void> {
  try {
    const supabase = await db();
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        message,
        timestamp: new Date().toISOString(),
        read: false
      });
      
    if (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
