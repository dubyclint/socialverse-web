// server/api/controllers/palController.js
import { supabase } from '../../utils/supabase';

export class PalController {
  // Send pal request
  static async sendPalRequest(req, res) {
    try {
      const { requester_id, requested_id, message } = req.body;

      if (requester_id === requested_id) {
        return res.status(400).json({ error: 'Cannot send pal request to yourself' });
      }

      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('pals')
        .select('id, status')
        .or(`and(requester_id.eq.${requester_id},requested_id.eq.${requested_id}),and(requester_id.eq.${requested_id},requested_id.eq.${requester_id})`)
        .single();

      if (existingRequest) {
        if (existingRequest.status === 'accepted') {
          return res.status(400).json({ error: 'You are already pals' });
        } else if (existingRequest.status === 'pending') {
          return res.status(400).json({ error: 'Pal request already sent' });
        }
      }

      const { data: palRequest, error } = await supabase
        .from('pals')
        .insert({
          requester_id,
          requested_id,
          message,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Pal request sent successfully',
        data: palRequest
      });
    } catch (error) {
      console.error('Error sending pal request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Accept pal request
  static async acceptPalRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { user_id } = req.body;

      // Verify user is the requested person
      const { data: request, error: fetchError } = await supabase
        .from('pals')
        .select('*')
        .eq('id', requestId)
        .eq('requested_id', user_id)
        .eq('status', 'pending')
        .single();

      if (fetchError) throw fetchError;

      if (!request) {
        return res.status(404).json({ error: 'Pal request not found or already processed' });
      }

      const { data: palRequest, error } = await supabase
        .from('pals')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Pal request accepted successfully',
        data: palRequest
      });
    } catch (error) {
      console.error('Error accepting pal request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Decline pal request
  static async declinePalRequest(req, res) {
    try {
      const { requestId } = req.params;
      const { user_id } = req.body;

      const { data: palRequest, error } = await supabase
        .from('pals')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('requested_id', user_id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Pal request declined successfully',
        data: palRequest
      });
    } catch (error) {
      console.error('Error declining pal request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user's pals
  static async getUserPals(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: pals, error } = await supabase
        .from('pals')
        .select(`
          *,
          requester:users!pals_requester_id_fkey(id, username, avatar_url, last_seen),
          requested:users!pals_requested_id_fkey(id, username, avatar_url, last_seen)
        `)
        .or(`requester_id.eq.${userId},requested_id.eq.${userId}`)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Format response to show the other person as the pal
      const formattedPals = pals.map(pal => ({
        ...pal,
        pal_info: pal.requester_id === userId ? pal.requested : pal.requester
      }));

      return res.status(200).json({
        success: true,
        data: formattedPals
      });
    } catch (error) {
      console.error('Error fetching user pals:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get pending pal requests
  static async getPendingRequests(req, res) {
    try {
      const { userId } = req.params;
      const { type = 'received' } = req.query; // 'sent' or 'received'

      let query = supabase
        .from('pals')
        .select(`
          *,
          requester:users!pals_requester_id_fkey(id, username, avatar_url),
          requested:users!pals_requested_id_fkey(id, username, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (type === 'sent') {
        query = query.eq('requester_id', userId);
      } else {
        query = query.eq('requested_id', userId);
      }

      const { data: requests, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Block/Unblock pal
  static async toggleBlockPal(req, res) {
    try {
      const { palId } = req.params;
      const { user_id, action } = req.body; // action: 'block' or 'unblock'

      // Find the pal relationship
      const { data: pal, error: fetchError } = await supabase
        .from('pals')
        .select('*')
        .eq('id', palId)
        .or(`requester_id.eq.${user_id},requested_id.eq.${user_id}`)
        .single();

      if (fetchError) throw fetchError;

      const status = action === 'block' ? 'blocked' : 'accepted';
      const updateField = action === 'block' ? 'blocked_at' : 'unblocked_at';

      const { data: updatedPal, error } = await supabase
        .from('pals')
        .update({
          status,
          [updateField]: new Date().toISOString(),
          blocked_by: action === 'block' ? user_id : null
        })
        .eq('id', palId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: `Pal ${action}ed successfully`,
        data: updatedPal
      });
    } catch (error) {
      console.error(`Error ${req.body.action}ing pal:`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Remove pal
  static async removePal(req, res) {
    try {
      const { palId } = req.params;
      const { user_id } = req.body;

      // Verify user is part of this pal relationship
      const { data: pal, error: fetchError } = await supabase
        .from('pals')
        .select('*')
        .eq('id', palId)
        .or(`requester_id.eq.${user_id},requested_id.eq.${user_id}`)
        .single();

      if (fetchError) throw fetchError;

      if (!pal) {
        return res.status(404).json({ error: 'Pal relationship not found' });
      }

      const { error } = await supabase
        .from('pals')
        .delete()
        .eq('id', palId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Pal removed successfully'
      });
    } catch (error) {
      console.error('Error removing pal:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Check pal status between two users
  static async checkPalStatus(req, res) {
    try {
      const { userId, targetUserId } = req.params;

      const { data: pal, error } = await supabase
        .from('pals')
        .select('*')
        .or(`and(requester_id.eq.${userId},requested_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},requested_id.eq.${userId})`)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      const status = pal ? pal.status : 'none';

      return res.status(200).json({
        success: true,
        data: {
          status,
          pal_relationship: pal
        }
      });
    } catch (error) {
      console.error('Error checking pal status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
