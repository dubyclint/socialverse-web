// server/api/controllers/universeController.js
import { supabase } from '../../utils/supabase.js';

export class UniverseController {
  // Send message to universe chat
  static async sendUniverseMessage(req, res) {
    try {
      const {
        sender_id,
        content,
        message_type,
        media_url,
        reply_to_id,
        location,
        is_anonymous
      } = req.body;

      const { data: message, error } = await supabase
        .from('universe_messages')
        .insert({
          sender_id,
          content,
          message_type: message_type || 'text',
          media_url,
          reply_to_id,
          location,
          is_anonymous: is_anonymous || false,
          status: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Universe message sent successfully',
        data: message
      });
    } catch (error) {
      console.error('Error sending universe message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get universe messages (global chat)
  static async getUniverseMessages(req, res) {
    try {
      const { page = 1, limit = 50, message_type, location } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('universe_messages')
        .select(`
          *,
          sender:users!universe_messages_sender_id_fkey(id, username, avatar_url, verified_badge),
          reply_to:universe_messages!universe_messages_reply_to_id_fkey(
            id, content, sender_id,
            sender:users!universe_messages_sender_id_fkey(username)
          ),
          reactions:universe_message_reactions(reaction_type, count)
        `)
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (message_type) {
        query = query.eq('message_type', message_type);
      }

      if (location) {
        query = query.eq('location', location);
      }

      const { data: messages, error } = await query;

      if (error) throw error;

      // Hide sender info for anonymous messages
      const processedMessages = messages.map(msg => ({
        ...msg,
        sender: msg.is_anonymous ? null : msg.sender
      }));

      return res.status(200).json({
        success: true,
        data: processedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching universe messages:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get trending universe messages
  static async getTrendingMessages(req, res) {
    try {
      const { hours = 24, limit = 20 } = req.query;
      const timeLimit = new Date(Date.now() - hours * 60 * 60 * 1000);

      const { data: messages, error } = await supabase
        .from('universe_messages')
        .select(`
          *,
          sender:users!universe_messages_sender_id_fkey(id, username, avatar_url, verified_badge),
          reactions_count:universe_message_reactions(count),
          replies_count:universe_messages!universe_messages_reply_to_id_fkey(count)
        `)
        .eq('status', 'sent')
        .gte('created_at', timeLimit.toISOString())
        .order('reactions_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error fetching trending messages:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // React to universe message
  static async reactToMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { user_id, reaction_type } = req.body;

      // Check if user already reacted
      const { data: existingReaction, error: checkError } = await supabase
        .from('universe_message_reactions')
        .select('id, reaction_type')
        .eq('message_id', messageId)
        .eq('user_id', user_id)
        .single();

      if (existingReaction) {
        if (existingReaction.reaction_type === reaction_type) {
          // Remove reaction
          const { error: deleteError } = await supabase
            .from('universe_message_reactions')
            .delete()
            .eq('id', existingReaction.id);

          if (deleteError) throw deleteError;

          return res.status(200).json({
            success: true,
            message: 'Reaction removed successfully'
          });
        } else {
          // Update reaction
          const { data: updatedReaction, error: updateError } = await supabase
            .from('universe_message_reactions')
            .update({ reaction_type })
            .eq('id', existingReaction.id)
            .select()
            .single();

          if (updateError) throw updateError;

          return res.status(200).json({
            success: true,
            message: 'Reaction updated successfully',
            data: updatedReaction
          });
        }
      } else {
        // Add new reaction
        const { data: reaction, error } = await supabase
          .from('universe_message_reactions')
          .insert({
            message_id: messageId,
            user_id,
            reaction_type,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({
          success: true,
          message: 'Reaction added successfully',
          data: reaction
        });
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete universe message
  static async deleteUniverseMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { user_id } = req.body;

      // Verify ownership
      const { data: message, error: fetchError } = await supabase
        .from('universe_messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      if (message.sender_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to delete this message' });
      }

      const { error } = await supabase
        .from('universe_messages')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting universe message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Report universe message
  static async reportMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { reporter_id, reason, description } = req.body;

      const { data: report, error } = await supabase
        .from('universe_message_reports')
        .insert({
          message_id: messageId,
          reporter_id,
          reason,
          description,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Message reported successfully',
        data: report
      });
    } catch (error) {
      console.error('Error reporting message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user's universe messages
  static async getUserUniverseMessages(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: messages, error } = await supabase
        .from('universe_messages')
        .select(`
          *,
          reactions_count:universe_message_reactions(count),
          replies_count:universe_messages!universe_messages_reply_to_id_fkey(count)
        `)
        .eq('sender_id', userId)
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error fetching user universe messages:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get universe chat statistics
  static async getUniverseStats(req, res) {
    try {
      const { timeframe = '24h' } = req.query;
      
      let timeLimit;
      switch (timeframe) {
        case '1h':
          timeLimit = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      // Get message count
      const { count: messageCount, error: msgError } = await supabase
        .from('universe_messages')
        .select('*', { count: 'exact' })
        .eq('status', 'sent')
        .gte('created_at', timeLimit.toISOString());

      if (msgError) throw msgError;

      // Get active users count
      const { data: activeUsers, error: usersError } = await supabase
        .from('universe_messages')
        .select('sender_id')
        .eq('status', 'sent')
        .gte('created_at', timeLimit.toISOString());

      if (usersError) throw usersError;

      const uniqueUsers = new Set(activeUsers.map(m => m.sender_id)).size;

      // Get top message types
      const { data: messageTypes, error: typesError } = await supabase
        .from('universe_messages')
        .select('message_type')
        .eq('status', 'sent')
        .gte('created_at', timeLimit.toISOString());

      if (typesError) throw typesError;

      const typeStats = messageTypes.reduce((acc, msg) => {
        acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        data: {
          total_messages: messageCount,
          active_users: uniqueUsers,
          timeframe,
          message_types: typeStats,
          avg_messages_per_user: uniqueUsers > 0 ? Math.round(messageCount / uniqueUsers) : 0
        }
      });
    } catch (error) {
      console.error('Error fetching universe stats:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Pin/Unpin universe message (admin feature)
  static async togglePinMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { user_id, action } = req.body; // action: 'pin' or 'unpin'

      // Verify admin privileges (you would check user role here)
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user_id)
        .single();

      if (userError) throw userError;

      if (user.role !== 'admin' && user.role !== 'moderator') {
        return res.status(403).json({ error: 'Insufficient privileges to pin messages' });
      }

      const { data: message, error } = await supabase
        .from('universe_messages')
        .update({
          is_pinned: action === 'pin',
          pinned_at: action === 'pin' ? new Date().toISOString() : null,
          pinned_by: action === 'pin' ? user_id : null
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: `Message ${action}ned successfully`,
        data: message
      });
    } catch (error) {
      console.error('Error toggling pin message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
