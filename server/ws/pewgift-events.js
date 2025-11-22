// server/ws/pewgift-events.js - GIFT EVENTS HANDLER
// ===============================================

const { supabase } = require('../utils/supabase');

class GiftEvents {
  static setupGiftEvents(io, socket) {
    // ===== SEND GIFT IN CHAT =====
    socket.on('gift:send', async (data) => {
      try {
        const { recipientId, giftId, giftAmount, message: giftMessage, messageId, chatId } = data;
        const senderId = socket.userId;

        // Verify sender has balance
        const { data: senderBalance, error: balanceError } = await supabase
          .from('pewgift_balance')
          .select('balance')
          .eq('user_id', senderId)
          .single();

        if (balanceError || !senderBalance || senderBalance.balance < giftAmount) {
          socket.emit('gift:error', {
            message: 'Insufficient balance'
          });
          return;
        }

        // Create gift transaction
        const giftTransactionId = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { data: giftTransaction, error: giftError } = await supabase
          .from('pewgift_transactions')
          .insert({
            id: giftTransactionId,
            sender_id: senderId,
            recipient_id: recipientId,
            gift_id: giftId,
            amount: giftAmount,
            message: giftMessage,
            message_id: messageId,
            chat_id: chatId,
            status: 'completed',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (giftError) {
          socket.emit('gift:error', {
            message: 'Failed to send gift'
          });
          return;
        }

        // Deduct from sender balance
        await supabase
          .from('pewgift_balance')
          .update({
            balance: senderBalance.balance - giftAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', senderId);

        // Add to recipient balance
        const { data: recipientBalance } = await supabase
          .from('pewgift_balance')
          .select('balance')
          .eq('user_id', recipientId)
          .single();

        if (recipientBalance) {
          await supabase
            .from('pewgift_balance')
            .update({
              balance: recipientBalance.balance + giftAmount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', recipientId);
        } else {
          await supabase
            .from('pewgift_balance')
            .insert({
              user_id: recipientId,
              balance: giftAmount,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        // Create notification for recipient
        await supabase
          .from('notifications')
          .insert({
            user_id: recipientId,
            type: 'gift_received',
            title: `${socket.username} sent you a gift!`,
            message: giftMessage,
            data: {
              giftId: giftTransactionId,
              senderId,
              senderName: socket.username,
              amount: giftAmount,
              messageId,
              chatId
            },
            read: false,
            created_at: new Date().toISOString()
          })
          .catch(err => console.error('Notification error:', err));

        // Broadcast gift event to chat room
        io.to(`chat:${chatId}`).emit('gift:received', {
          giftId: giftTransactionId,
          senderId,
          senderName: socket.username,
          recipientId,
          giftId: giftId,
          amount: giftAmount,
          message: giftMessage,
          messageId,
          timestamp: new Date().toISOString()
        });

        // Acknowledge to sender
        socket.emit('gift:sent', {
          giftId: giftTransactionId,
          recipientId,
          amount: giftAmount
        });

      } catch (error) {
        console.error('Send gift error:', error);
        socket.emit('gift:error', {
          message: 'Failed to send gift'
        });
      }
    });

    // ===== GET GIFT BALANCE =====
    socket.on('gift:get-balance', async (data) => {
      try {
        const userId = socket.userId;

        const { data: balance, error } = await supabase
          .from('pewgift_balance')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (error) {
          socket.emit('gift:balance', { balance: 0 });
          return;
        }

        socket.emit('gift:balance', {
          balance: balance?.balance || 0
        });

      } catch (error) {
        console.error('Get balance error:', error);
        socket.emit('gift:balance', { balance: 0 });
      }
    });

    // ===== GET GIFT HISTORY =====
    socket.on('gift:get-history', async (data) => {
      try {
        const userId = socket.userId;
        const { limit = 20, offset = 0 } = data;

        const { data: transactions, error } = await supabase
          .from('pewgift_transactions')
          .select(`
            *,
            sender:profiles!sender_id(username, avatar_url),
            recipient:profiles!recipient_id(username, avatar_url)
          `)
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          socket.emit('gift:history', { transactions: [] });
          return;
        }

        socket.emit('gift:history', {
          transactions: transactions || []
        });

      } catch (error) {
        console.error('Get history error:', error);
        socket.emit('gift:history', { transactions: [] });
      }
    });
  }
}

module.exports = GiftEvents;
