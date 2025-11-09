// server/ws/universeEvents.js - UNIVERSE CHAT EVENTS HANDLER
// ===========================================================

const { supabase } = require('../utils/supabase');

class UniverseEvents {
  static setupUniverseEvents(io, socket) {
    // ===== JOIN UNIVERSE =====
    socket.on('universe:join', async (data) => {
      try {
        const { country, interest, language } = data;
        const userId = socket.userId;

        // Join universe room with filters
        const roomId = `universe:${country || 'global'}:${interest || 'all'}:${language || 'en'}`;
        socket.join(roomId);

        // Store user's universe preferences
        socket.universeRoom = roomId;
        socket.universeFilters = { country, interest, language };

        // Get user's profile for universe
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, is_verified, rank')
          .eq('id', userId)
          .single();

        // Notify others user joined
        io.to(roomId).emit('universe:user-joined', {
          userId,
          username: profile?.username,
          avatar: profile?.avatar_url,
          isVerified: profile?.is_verified,
          rank: profile?.rank,
          timestamp: new Date().toISOString()
        });

        // Send online count
        const onlineUsers = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        socket.emit('universe:online-count', { count: onlineUsers });

      } catch (error) {
        console.error('Join universe error:', error);
        socket.emit('error', { message: 'Failed to join universe' });
      }
    });

    // ===== SEND UNIVERSE MESSAGE =====
    socket.on('universe:send-message', async (data) => {
      try {
        const { content, country, interest, language } = data;
        const userId = socket.userId;
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, is_verified, rank')
          .eq('id', userId)
          .single();

        const messageData = {
          id: messageId,
          userId,
          username: profile?.username,
          avatar: profile?.avatar_url,
          isVerified: profile?.is_verified,
          rank: profile?.rank,
          content,
          country,
          interest,
          language,
          timestamp: new Date().toISOString(),
          likes: 0,
          replies: 0,
          reactions: {}
        };

        // 1. Store in Supabase
        await supabase
          .from('universe_messages')
          .insert({
            id: messageId,
            user_id: userId,
            content,
            country: country || null,
            interest: interest || null,
            language: language || 'en',
            created_at: messageData.timestamp
          })
          .catch(err => console.error('Supabase insert error:', err));

        // 2. Broadcast to universe room
        const roomId = `universe:${country || 'global'}:${interest || 'all'}:${language || 'en'}`;
        io.to(roomId).emit('universe:message', messageData);

        // 3. Acknowledge to sender
        socket.emit('universe:message-sent', { messageId });

      } catch (error) {
        console.error('Send universe message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ===== LIKE MESSAGE =====
    socket.on('universe:like-message', async (data) => {
      try {
        const { messageId } = data;
        const userId = socket.userId;

        // Update likes in Supabase
        const { data: message } = await supabase
          .from('universe_messages')
          .select('likes')
          .eq('id', messageId)
          .single();

        const likes = (message?.likes || 0) + 1;

        await supabase
          .from('universe_messages')
          .update({ likes })
          .eq('id', messageId);

        // Broadcast like update
        io.emit('universe:message-liked', {
          messageId,
          likes,
          userId
        });

      } catch (error) {
        console.error('Like message error:', error);
      }
    });

    // ===== ADD REACTION =====
    socket.on('universe:add-reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        const userId = socket.userId;

        // Store reaction in Supabase
        await supabase
          .from('universe_reactions')
          .insert({
            message_id: messageId,
            user_id: userId,
            emoji,
            created_at: new Date().toISOString()
          })
          .catch(err => console.error('Reaction insert error:', err));

        // Broadcast reaction
        io.emit('universe:reaction-added', {
          messageId,
          userId,
          emoji,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    // ===== TRANSLATE MESSAGE =====
    socket.on('universe:translate-message', async (data) => {
      try {
        const { messageId, text, targetLang } = data;
        const userId = socket.userId;

        // Call translation service
        const translatedText = await translateText(text, targetLang);

        // Cache translation
        await supabase
          .from('universe_translations')
          .insert({
            message_id: messageId,
            original_text: text,
            translated_text: translatedText,
            target_language: targetLang,
            user_id: userId,
            created_at: new Date().toISOString()
          })
          .catch(err => console.error('Translation cache error:', err));

        // Broadcast translation
        io.emit('universe:message-translated', {
          messageId,
          translatedText,
          targetLang,
          userId
        });

      } catch (error) {
        console.error('Translate message error:', error);
      }
    });

    // ===== SEND GIFT IN UNIVERSE =====
    socket.on('universe:send-gift', async (data) => {
      try {
        const { recipientId, giftId, giftAmount, message: giftMessage, messageId } = data;
        const senderId = socket.userId;

        // Check balance
        const { data: senderBalance } = await supabase
          .from('pewgift_balance')
          .select('balance')
          .eq('user_id', senderId)
          .single();

        if (!senderBalance || senderBalance.balance < giftAmount) {
          socket.emit('error', { message: 'Insufficient balance' });
          return;
        }

        // Create gift transaction
        const giftTransactionId = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await supabase
          .from('pewgift_transactions')
          .insert({
            id: giftTransactionId,
            sender_id: senderId,
            recipient_id: recipientId,
            gift_id: giftId,
            amount: giftAmount,
            message: giftMessage,
            message_id: messageId,
            status: 'completed',
            created_at: new Date().toISOString()
          });

        // Deduct from sender
        await supabase
          .from('pewgift_balance')
          .update({ balance: senderBalance.balance - giftAmount })
          .eq('user_id', senderId);

        // Add to recipient
        const { data: recipientBalance } = await supabase
          .from('pewgift_balance')
          .select('balance')
          .eq('user_id', recipientId)
          .single();

        if (recipientBalance) {
          await supabase
            .from('pewgift_balance')
            .update({ balance: recipientBalance.balance + giftAmount })
            .eq('user_id', recipientId);
        } else {
          await supabase
            .from('pewgift_balance')
            .insert({ user_id: recipientId, balance: giftAmount });
        }

        // Broadcast gift
        io.emit('universe:gift-sent', {
          giftId: giftTransactionId,
          senderId,
          recipientId,
          amount: giftAmount,
          message: giftMessage,
          messageId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Send gift error:', error);
        socket.emit('error', { message: 'Failed to send gift' });
      }
    });

    // ===== GET MATCHED USERS =====
    socket.on('universe:get-matched-users', async (data) => {
      try {
        const userId = socket.userId;
        const { limit = 10 } = data;

        // Get user's interests
        const { data: userInterests } = await supabase
          .from('user_interests')
          .select('interest_id')
          .eq('user_id', userId);

        if (!userInterests || userInterests.length === 0) {
          socket.emit('universe:matched-users', { users: [] });
          return;
        }

        const interestIds = userInterests.map(ui => ui.interest_id);

        // Find users with similar interests
        const { data: matchedUsers } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            avatar_url,
            is_verified,
            rank,
            user_interests(interest_id)
          `)
          .neq('id', userId)
          .limit(limit);

        // Filter and score matches
        const scoredMatches = matchedUsers
          ?.map(user => {
            const commonInterests = user.user_interests?.filter(ui =>
              interestIds.includes(ui.interest_id)
            ).length || 0;
            return {
              id: user.id,
              username: user.username,
              avatar: user.avatar_url,
              isVerified: user.is_verified,
              rank: user.rank,
              matchScore: commonInterests,
              commonInterests
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, limit) || [];

        socket.emit('universe:matched-users', { users: scoredMatches });

      } catch (error) {
        console.error('Get matched users error:', error);
        socket.emit('universe:matched-users', { users: [] });
      }
    });

    // ===== FILTER MESSAGES =====
    socket.on('universe:filter-messages', async (data) => {
      try {
        const { country, interest, language, limit = 50 } = data;

        // Query filtered messages
        let query = supabase
          .from('universe_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (country) query = query.eq('country', country);
        if (interest) query = query.eq('interest', interest);
        if (language) query = query.eq('language', language);

        const { data: messages } = await query;

        socket.emit('universe:filtered-messages', { messages: messages || [] });

      } catch (error) {
        console.error('Filter messages error:', error);
        socket.emit('universe:filtered-messages', { messages: [] });
      }
    });

    // ===== LEAVE UNIVERSE =====
    socket.on('universe:leave', async (data) => {
      try {
        const userId = socket.userId;
        const roomId = socket.universeRoom;

        if (roomId) {
          socket.leave(roomId);

          // Notify others user left
          io.to(roomId).emit('universe:user-left', {
            userId,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error('Leave universe error:', error);
      }
    });
  }
}

// Helper function to translate text
async function translateText(text, targetLang) {
  try {
    // TODO: Implement with actual translation service
    return `[Translated to ${targetLang}]: ${text}`;
  } catch (error) {
    console.error('Translation service error:', error);
    throw new Error('Translation service unavailable');
  }
}

module.exports = UniverseEvents;
