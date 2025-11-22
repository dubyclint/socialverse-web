// server/models/pal.js - Supabase PostgreSQL Friend System Model
import { supabase } from '../utils/supabase.js';

export class Pal {
  /**
   * Send friend request
   */
  static async sendFriendRequest(requesterId, addresseeId) {
    try {
      // Check if request already exists
      const { data: existing, error: checkError } = await supabase
        .from('pals')
        .select('*')
        .or(`and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

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
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  /**
   * Accept friend request
   */
  static async acceptFriendRequest(requesterId, addresseeId) {
    try {
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
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }

  /**
   * Get user's friends
   */
  static async getFriends(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('pals')
        .select(`
          *,
          requester:requester_id(id, username, avatar_url, is_verified),
          addressee:addressee_id(id, username, avatar_url, is_verified)
        `, { count: 'exact' })
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Format response to show the friend (not the current user)
      const formattedData = data.map(friendship => ({
        ...friendship,
        friend: friendship.requester_id === userId ? friendship.addressee : friendship.requester
      }));

      return { data: formattedData, count };
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw error;
    }
  }

  /**
   * Get pending friend requests
   */
  static async getPendingRequests(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('pals')
        .select(`
          *,
          requester:requester_id(username, avatar_url, is_verified)
        `, { count: 'exact' })
        .eq('addressee_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  }

  /**
   * Block user
   */
  static async blockUser(requesterId, addresseeId) {
    try {
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
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  /**
   * Remove friend
   */
  static async removeFriend(userId, friendId) {
    try {
      const { error } = await supabase
        .from('pals')
        .delete()
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  /**
   * Unblock user
   */
  static async unblockUser(requesterId, addresseeId) {
    try {
      const { error } = await supabase
        .from('pals')
        .delete()
        .eq('requester_id', requesterId)
        .eq('addressee_id', addresseeId)
        .eq('status', 'blocked');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  /**
   * Get blocked users
   */
  static async getBlockedUsers(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('pals')
        .select(`
          *,
          addressee:addressee_id(username, avatar_url)
        `)
        .eq('requester_id', userId)
        .eq('status', 'blocked')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      throw error;
    }
  }

  /**
   * Check if users are friends
   */
  static async areFriends(userId1, userId2) {
    try {
      const { data, error } = await supabase
        .from('pals')
        .select('id')
        .or(`and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`)
        .eq('status', 'accepted')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking friendship:', error);
      throw error;
    }
  }

  /**
   * Get sent friend requests
   */
  static async getSentRequests(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('pals')
        .select(`
          *,
          addressee:addressee_id(username, avatar_url)
        `)
        .eq('requester_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      throw error;
    }
  }

  /**
   * Decline friend request
   */
  static async declineFriendRequest(requesterId, addresseeId) {
    try {
      const { error } = await supabase
        .from('pals')
        .delete()
        .eq('requester_id', requesterId)
        .eq('addressee_id', addresseeId)
        .eq('status', 'pending');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }

  /**
   * Get friend statistics
   */
  static async getFriendStatistics(userId) {
    try {
      const { data, error } = await supabase
        .from('pals')
        .select('status')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error) throw error;

      const stats = {
        totalFriends: data.filter(p => p.status === 'accepted').length,
        pendingRequests: data.filter(p => p.status === 'pending').length,
        blockedUsers: data.filter(p => p.status === 'blocked').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching friend statistics:', error);
      throw error;
    }
  }
}
