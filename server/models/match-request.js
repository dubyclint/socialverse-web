// server/models/match-request.js - Supabase PostgreSQL Match Request Model
import { supabase } from '../utils/supabase.js';

export class MatchRequest {
  /**
   * Create a new match request
   */
  static async create(matchData) {
    try {
      // Check if match request already exists
      const { data: existing, error: checkError } = await supabase
        .from('match_requests')
        .select('*')
        .or(`and(requester_id.eq.${matchData.requesterId},target_id.eq.${matchData.targetId}),and(requester_id.eq.${matchData.targetId},target_id.eq.${matchData.requesterId})`)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existing) {
        throw new Error('Match request already exists');
      }

      const { data, error } = await supabase
        .from('match_requests')
        .insert([{
          requester_id: matchData.requesterId,
          target_id: matchData.targetId,
          match_type: matchData.matchType || 'dating',
          compatibility_score: matchData.compatibilityScore,
          common_interests: matchData.commonInterests || [],
          expires_at: matchData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending'
        }])
        .select(`
          *,
          requester:requester_id(username, avatar_url, bio, location),
          target:target_id(username, avatar_url, bio, location)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating match request:', error);
      throw error;
    }
  }

  /**
   * Respond to match request
   */
  static async respondToMatch(requesterId, targetId, response) {
    try {
      const status = response === 'accept' ? 'matched' : 'declined';
      const updateData = { status };

      if (status === 'matched') {
        updateData.matched_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('match_requests')
        .update(updateData)
        .eq('requester_id', requesterId)
        .eq('target_id', targetId)
        .select(`
          *,
          requester:requester_id(username, avatar_url, bio),
          target:target_id(username, avatar_url, bio)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error responding to match:', error);
      throw error;
    }
  }

  /**
   * Get user matches
   */
  static async getUserMatches(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('match_requests')
        .select(`
          *,
          requester:requester_id(username, avatar_url, bio, location),
          target:target_id(username, avatar_url, bio, location)
        `, { count: 'exact' })
        .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
        .eq('status', 'matched')
        .order('matched_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Format response to show the matched user (not the current user)
      const formattedData = data.map(match => ({
        ...match,
        matched_user: match.requester_id === userId ? match.target : match.requester
      }));

      return { data: formattedData, count };
    } catch (error) {
      console.error('Error fetching user matches:', error);
      throw error;
    }
  }

  /**
   * Get pending requests for user
   */
  static async getPendingRequests(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('match_requests')
        .select(`
          *,
          requester:requester_id(username, avatar_url, bio, location)
        `, { count: 'exact' })
        .eq('target_id', userId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
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
   * Get sent requests
   */
  static async getSentRequests(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('match_requests')
        .select(`
          *,
          target:target_id(username, avatar_url, bio, location)
        `, { count: 'exact' })
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      throw error;
    }
  }

  /**
   * Calculate compatibility score
   */
  static async calculateCompatibility(user1Id, user2Id) {
    try {
      const { data: user1Profile, error: error1 } = await supabase
        .from('profiles')
        .select('location, date_of_birth, interests')
        .eq('id', user1Id)
        .single();

      const { data: user2Profile, error: error2 } = await supabase
        .from('profiles')
        .select('location, date_of_birth, interests')
        .eq('id', user2Id)
        .single();

      if (error1 || error2) throw error1 || error2;

      let score = 0;

      // Location compatibility
      if (user1Profile.location === user2Profile.location) {
        score += 30;
      }

      // Age compatibility (within 5 years)
      if (user1Profile.date_of_birth && user2Profile.date_of_birth) {
        const age1 = new Date().getFullYear() - new Date(user1Profile.date_of_birth).getFullYear();
        const age2 = new Date().getFullYear() - new Date(user2Profile.date_of_birth).getFullYear();
        const ageDiff = Math.abs(age1 - age2);

        if (ageDiff <= 5) score += 25;
        else if (ageDiff <= 10) score += 15;
      }

      // Interests compatibility
      if (user1Profile.interests && user2Profile.interests) {
        const commonInterests = user1Profile.interests.filter(i => 
          user2Profile.interests.includes(i)
        );
        score += Math.min(commonInterests.length * 5, 45);
      } else {
        score += Math.floor(Math.random() * 45);
      }

      return Math.min(score, 100);
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      throw error;
    }
  }

  /**
   * Clean up expired requests
   */
  static async cleanupExpiredRequests() {
    try {
      const { data, error } = await supabase
        .from('match_requests')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) throw error;
      return { success: true, expiredCount: data?.length || 0 };
    } catch (error) {
      console.error('Error cleaning up expired requests:', error);
      throw error;
    }
  }

  /**
   * Get match statistics
   */
  static async getStatistics(userId) {
    try {
      const { data, error } = await supabase
        .from('match_requests')
        .select('status')
        .or(`requester_id.eq.${userId},target_id.eq.${userId}`);

      if (error) throw error;

      const stats = {
        totalMatches: data.length,
        matched: data.filter(m => m.status === 'matched').length,
        pending: data.filter(m => m.status === 'pending').length,
        declined: data.filter(m => m.status === 'declined').length,
        expired: data.filter(m => m.status === 'expired').length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching match statistics:', error);
      throw error;
    }
  }

  /**
   * Unmatch users
   */
  static async unmatch(userId1, userId2) {
    try {
      const { error } = await supabase
        .from('match_requests')
        .delete()
        .or(`and(requester_id.eq.${userId1},target_id.eq.${userId2}),and(requester_id.eq.${userId2},target_id.eq.${userId1})`)
        .eq('status', 'matched');

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unmatching users:', error);
      throw error;
    }
  }

  /**
   * Get match request by ID
   */
  static async getById(requestId) {
    try {
      const { data, error } = await supabase
        .from('match_requests')
        .select(`
          *,
          requester:requester_id(username, avatar_url, bio, location),
          target:target_id(username, avatar_url, bio, location)
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching match request:', error);
      throw error;
    }
  }

  /**
   * Get suggested matches
   */
  static async getSuggestedMatches(userId, limit = 10) {
    try {
      // Get user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('location, interests')
        .eq('id', userId)
        .single();

      // Find potential matches with similar location/interests
      let query = supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, location, interests')
        .neq('id', userId);

      if (userProfile.location) {
        query = query.eq('location', userProfile.location);
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;

      // Calculate compatibility for each suggestion
      const suggestionsWithScore = await Promise.all(
        data.map(async (profile) => ({
          ...profile,
          compatibility_score: await this.calculateCompatibility(userId, profile.id)
        }))
      );

      return suggestionsWithScore.sort((a, b) => b.compatibility_score - a.compatibility_score);
    } catch (error) {
      console.error('Error fetching suggested matches:', error);
      throw error;
    }
  }
}
