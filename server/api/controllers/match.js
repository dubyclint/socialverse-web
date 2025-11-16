// server/api/controllers/match.js
import { supabase } from '~/server/utils/database';

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
        return res.status(400).json({ error: 'Match request already exists' });
      }

      // Create match request
      const { data: matchRequest, error } = await supabase
        .from('match_requests')
        .insert({
          requester_id,
          target_user_id,
          match_type,
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

      return res.status(201).json({
        success: true,
        message: 'Match request created successfully',
        data: matchRequest
      });
    } catch (error) {
      console.error('Error creating match request:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Get match requests
  static async getMatchRequests(req, res) {
    try {
      const { user_id, status } = req.query;

      let query = supabase
        .from('match_requests')
        .select('*');

      if (user_id) {
        query = query.or(`requester_id.eq.${user_id},target_user_id.eq.${user_id}`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error fetching match requests:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
