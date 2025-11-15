// server/api/controllers/match.js
import { supabase } from '../../utils/supabase';

export class MatchController {
  // Create match request
  static async createMatchRequest(req, res) {
    try {
      const {
        requester_id,
        target_user_id,
        match_type,
        location,
        preferred_date,
        preferred_time,
        activity_type,
        message,
        budget_range
      } = req.body;

      if (requester_id === target_user_id) {
        return res.status(400).json({ error: 'Cannot send match request to yourself' });
      }

      // Check if there's already a pending match request between these users
      const { data: existingRequest, error: checkError } = await supabase
        .from('match_requests')
        .select('id, status')
        .or(`and(requester_id.eq.${requester_id},target_user_id.eq.${target_user_id}),and(requester_id.eq.${target_user_id},target_user_id.eq.${requester_id})`)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        return res.status(400).json({ error: 'Match request already pending between these users' });
      }

      const { data: matchRequest, error } = await supabase
        .from('match_requests')
        .insert({
          requester_id,
          target_user_id,
          match_type: match_type || 'casual',
          location,
          preferred_date,
          preferred_time,
          activity_type,
          message,
          budget_range,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for target user
      await supabase
        .from('notifications')
        .insert({
          user_id: target_user_id,
          type: 'match_request',
          title: 'New Match Request',
          message: `You have a new match request from a user`,
          sender_id: requester_id,
          related_id: matchRequest.id,
          is_read: false,
          created_at: new Date().toISOString()
        });

      return res.status(201).json({
        success: true,
        message: 'Match request sent successfully',
        data: matchRequest
      });
    } catch (error) {
      console.error('Error creating match request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Accept match request
  static async acceptMatchRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { user_id, meeting_details } = req.body;

      // Verify user is the target of this request
      const { data: request, error: fetchError } = await supabase
        .from('match_requests')
        .select('*')
        .eq('id', requestId)
        .eq('target_user_id', user_id)
        .eq('status', 'pending')
        .single();

      if (fetchError) throw fetchError;

      if (!request) {
        return res.status(404).json({ error: 'Match request not found or already processed' });
      }

      const { data: matchRequest, error } = await supabase
        .from('match_requests')
        .update({
          status: 'accepted',
          meeting_details,
          accepted_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Notify requester
      await supabase
        .from('notifications')
        .insert({
          user_id: request.requester_id,
          type: 'match_accepted',
          title: 'Match Request Accepted',
          message: 'Your match request has been accepted!',
          sender_id: user_id,
          related_id: requestId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      return res.status(200).json({
        success: true,
        message: 'Match request accepted successfully',
        data: matchRequest
      });
    } catch (error) {
      console.error('Error accepting match request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Decline match request
  static async declineMatchRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { user_id, reason } = req.body;

      const { data: matchRequest, error } = await supabase
        .from('match_requests')
        .update({
          status: 'declined',
          decline_reason: reason,
          declined_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('target_user_id', user_id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Match request declined successfully',
        data: matchRequest
      });
    } catch (error) {
      console.error('Error declining match request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user's match requests (sent and received)
  static async getUserMatchRequests(req, res) {
    try {
      const { userId } = req.params;
      const { type = 'all', status } = req.query; // type: 'sent', 'received', 'all'

      let query = supabase
        .from('match_requests')
        .select(`
          *,
          requester:users!match_requests_requester_id_fkey(id, username, avatar_url, location),
          target:users!match_requests_target_user_id_fkey(id, username, avatar_url, location)
        `)
        .order('created_at', { ascending: false });

      if (type === 'sent') {
        query = query.eq('requester_id', userId);
      } else if (type === 'received') {
        query = query.eq('target_user_id', userId);
      } else {
        query = query.or(`requester_id.eq.${userId},target_user_id.eq.${userId}`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: matchRequests, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: matchRequests
      });
    } catch (error) {
      console.error('Error fetching match requests:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update match status (completed, cancelled)
  static async updateMatchStatus(req, res) {
    try {
      const { requestId } = req.params;
      const { user_id, status, rating, review } = req.body;

      // Verify user is part of this match
      const { data: request, error: fetchError } = await supabase
        .from('match_requests')
        .select('*')
        .eq('id', requestId)
        .or(`requester_id.eq.${user_id},target_user_id.eq.${user_id}`)
        .single();

      if (fetchError) throw fetchError;

      const updateData = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        if (rating) updateData.rating = rating;
        if (review) updateData.review = review;
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = user_id;
      }

      const { data: matchRequest, error } = await supabase
        .from('match_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: `Match ${status} successfully`,
        data: matchRequest
      });
    } catch (error) {
      console.error('Error updating match status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get nearby users for matching
  static async getNearbyUsers(req, res) {
    try {
      const { userId } = req.params;
      const { radius = 50, activity_type, age_min, age_max } = req.query; // radius in km

      // Get current user's location
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('location')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (!currentUser.location) {
        return res.status(400).json({ error: 'User location not set' });
      }

      // For simplicity, we'll return users with similar preferences
      // In a real app, you'd use PostGIS for location-based queries
      let query = supabase
        .from('user_settings')
        .select(`
          *,
          users!user_settings_user_id_fkey(id, username, avatar_url, location, age)
        `)
        .eq('is_available_for_matches', true)
        .neq('user_id', userId);

      if (activity_type) {
        query = query.contains('preferred_activities', [activity_type]);
      }

      const { data: nearbyUsers, error } = await query;

      if (error) throw error;

      // Filter by age if specified
      let filteredUsers = nearbyUsers;
      if (age_min || age_max) {
        filteredUsers = nearbyUsers.filter(user => {
          const age = user.users.age;
          if (age_min && age < parseInt(age_min)) return false;
          if (age_max && age > parseInt(age_max)) return false;
          return true;
        });
      }

      return res.status(200).json({
        success: true,
        data: filteredUsers.slice(0, 20) // Limit to 20 users
      });
    } catch (error) {
      console.error('Error fetching nearby users:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get match statistics
  static async getMatchStats(req, res) {
    try {
      const { userId } = req.params;

      // Get sent requests stats
      const { data: sentRequests, error: sentError } = await supabase
        .from('match_requests')
        .select('status')
        .eq('requester_id', userId);

      if (sentError) throw sentError;

      // Get received requests stats
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('match_requests')
        .select('status')
        .eq('target_user_id', userId);

      if (receivedError) throw receivedError;

      // Calculate stats
      const stats = {
        sent: {
          total: sentRequests.length,
          pending: sentRequests.filter(r => r.status === 'pending').length,
          accepted: sentRequests.filter(r => r.status === 'accepted').length,
          declined: sentRequests.filter(r => r.status === 'declined').length
        },
        received: {
          total: receivedRequests.length,
          pending: receivedRequests.filter(r => r.status === 'pending').length,
          accepted: receivedRequests.filter(r => r.status === 'accepted').length,
          declined: receivedRequests.filter(r => r.status === 'declined').length
        }
      };

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching match stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
