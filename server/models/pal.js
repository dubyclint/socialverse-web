// server/models/pal.js - Supabase PostgreSQL Friend System Model
import { supabase } from '../utils/supabase.js';

export class Pal {
  static async sendFriendRequest(requesterId, addresseeId) {
    // Check if request already exists
    const { data: existing } = await supabase 
      .from('pals')
      .select('*')
      .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
      .single();

    if (existing) {
      throw new Error('Friend request already exists or you are already friends');
    }

    const { data, error } = await supabase
      .from('pals')
      .insert([{
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'pending'
      }])
      .select(`
        *,
        requester:requester_id(username, avatar_url),
        addressee:addressee_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async acceptFriendRequest(requesterId, addresseeId) {
    const { data, error } = await supabase
      .from('pals')
      .update({ status: 'accepted' })
      .eq('requester_id', requesterId)
      .eq('addressee_id', addresseeId)
      .select(`
        *,
        requester:requester_id(username, avatar_url),
        addressee:addressee_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getFriends(userId) {
    const { data, error } = await supabase
      .from('pals')
      .select(`
        *,
        requester:requester_id(id, username, avatar_url, is_verified),
        addressee:addressee_id(id, username, avatar_url, is_verified)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    
    // Format response to show the friend (not the current user)
    return data.map(friendship => ({
      ...friendship,
      friend: friendship.requester_id === userId ? friendship.addressee : friendship.requester
    }));
  }

  static async getPendingRequests(userId) {
    const { data, error } = await supabase
      .from('pals')
      .select(`
        *,
        requester:requester_id(username, avatar_url, is_verified)
      `)
      .eq('addressee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async blockUser(requesterId, addresseeId) {
    const { data, error } = await supabase
      .from('pals')
      .upsert([{
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'blocked'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeFriend(userId, friendId) {
    const { error } = await supabase
      .from('pals')
      .delete()
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`);

    if (error) throw error;
    return { success: true };
  }
}
