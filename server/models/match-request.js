// server/models/match-request.js - Supabase PostgreSQL Match Request Model
import { supabase } from '../utils/supabase.js';

export class MatchRequest {
  static async create(matchData) {
    // Check if match request already exists
    const { data: existing } = await supabase
      .from('match_requests')
      .select('*')
      .or(`and(requester_id.eq.${matchData.requesterId},target_id.eq.${matchData.targetId}),and(requester_id.eq.${matchData.targetId},target_id.eq.${matchData.requesterId})`)
      .single();

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
        expires_at: matchData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }])
      .select(`
        *,
        requester:requester_id(username, avatar_url, bio, location),
        target:target_id(username, avatar_url, bio, location)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async respondToMatch(requesterId, targetId, response) {
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
  }

  static async getUserMatches(userId) {
    const { data, error } = await supabase
      .from('match_requests')
      .select(`
        *,
        requester:requester_id(username, avatar_url, bio, location),
        target:target_id(username, avatar_url, bio, location)
      `)
      .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false });

    if (error) throw error;
    
    // Format response to show the matched user (not the current user)
    return data.map(match => ({
      ...match,
      matched_user: match.requester_id === userId ? match.target : match.requester
    }));
  }

  static async getPendingRequests(userId) {
    const { data, error } = await supabase
      .from('match_requests')
      .select(`
        *,
        requester:requester_id(username, avatar_url, bio, location)
      `)
      .eq('target_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getSentRequests(userId) {
    const { data, error } = await supabase
      .from('match_requests')
      .select(`
        *,
        target:target_id(username, avatar_url, bio, location)
      `)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async calculateCompatibility(user1Id, user2Id) {
    // This is a simplified compatibility calculation
    // In a real app, you'd have more sophisticated algorithms
    
    const { data: user1Profile } = await supabase
      .from('profiles')
      .select('location, date_of_birth')
      .eq('id', user1Id)
      .single();

    const { data: user2Profile } = await supabase
      .from('profiles')
      .select('location, date_of_birth')
      .eq('id', user2Id)
      .single();

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
    
    // Random factor for interests (in real app, compare actual interests)
    score += Math.floor(Math.random() * 45);
    
    return Math.min(score, 100);
  }

  static async cleanupExpiredRequests() {
    const { data, error } = await supabase
      .from('match_requests')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) throw error;
    return data;
  }
}
