// server/api/controllers/pewController.js
import { supabase } from '../../utils/supabase';

export class PewController {
  // Create new pew
  static async createPew(req, res) {
    try {
      const { sender_id, receiver_id, pew_type, content, media_url, location } = req.body;

      const { data: pew, error } = await supabase
        .from('pews')
        .insert({
          sender_id,
          receiver_id,
          pew_type: pew_type || 'text',
          content,
          media_url,
          location,
          status: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Pew sent successfully',
        data: pew
      });
    } catch (error) {
      console.error('Error creating pew:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user pews (inbox)
  static async getUserPews(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: pews, error } = await supabase
        .from('pews')
        .select(`
          *,
          sender:users!pews_sender_id_fkey(id, username, avatar_url),
          receiver:users!pews_receiver_id_fkey(id, username, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: pews
      });
    } catch (error) {
      console.error('Error fetching user pews:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Mark pew as read
  static async markAsRead(req, res) {
    try {
      const { pewId } = req.params;
      const { user_id } = req.body;

      const { data: pew, error } = await supabase
        .from('pews')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', pewId)
        .eq('receiver_id', user_id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Pew marked as read',
        data: pew
      });
    } catch (error) {
      console.error('Error marking pew as read:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete pew
  static async deletePew(req, res) {
    try {
      const { pewId } = req.params;
      const { user_id } = req.body;

      // Verify ownership (sender can delete)
      const { data: pew, error: fetchError } = await supabase
        .from('pews')
        .select('sender_id')
        .eq('id', pewId)
        .single();

      if (fetchError) throw fetchError;

      if (pew.sender_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to delete this pew' });
      }

      const { error } = await supabase
        .from('pews')
        .delete()
        .eq('id', pewId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Pew deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting pew:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get pew conversation between two users
  static async getConversation(req, res) {
    try {
      const { userId, partnerId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      const { data: pews, error } = await supabase
        .from('pews')
        .select(`
          *,
          sender:users!pews_sender_id_fkey(id, username, avatar_url)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: pews
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
