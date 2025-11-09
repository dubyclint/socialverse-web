// server/ws/callEvents.js
class CallEvents {
  static setupCallEvents(io, socket) {
    // Initiate voice/video call
    socket.on('initiate_call', async (data) => {
      try {
        const { targetUserId, callType, chatId } = data; // callType: 'voice' | 'video'
        const callerId = socket.userId;

        // Verify users are pals or in same chat
        const canCall = await this.verifyCallPermission(callerId, targetUserId, chatId);
        if (!canCall) {
          socket.emit('call_error', {
            error: 'Not authorized to call this user'
          });
          return;
        }

        // Check if target user is online
        const targetSocketId = io.connectedUsers?.get(targetUserId);
        if (!targetSocketId) {
          socket.emit('call_error', {
            error: 'User is not online'
          });
          return;
        }

        // Generate call ID
        const callId = `call_${Date.now()}_${callerId}_${targetUserId}`;

        // Send call invitation to target user
        io.to(targetSocketId).emit('incoming_call', {
          callId,
          callType,
          caller: {
            id: callerId,
            username: socket.username,
            avatar: socket.userAvatar
          },
          chatId
        });

        // Confirm call initiated to caller
        socket.emit('call_initiated', {
          callId,
          targetUserId,
          callType
        });

        // Set call timeout (30 seconds)
        setTimeout(() => {
          io.to(targetSocketId).emit('call_timeout', { callId });
          socket.emit('call_timeout', { callId });
        }, 30000);

      } catch (error) {
        console.error('Initiate call error:', error);
        socket.emit('call_error', { error: error.message });
      }
    });

    // Accept call
    socket.on('accept_call', (data) => {
      try {
        const { callId, callerSocketId } = data;
        
        // Notify caller that call was accepted
        io.to(callerSocketId).emit('call_accepted', {
          callId,
          acceptedBy: {
            id: socket.userId,
            username: socket.username,
            avatar: socket.userAvatar
          }
        });

        // Join both users to call room
        socket.join(`call_${callId}`);
        io.sockets.sockets.get(callerSocketId)?.join(`call_${callId}`);

        socket.emit('call_joined', { callId });

      } catch (error) {
        console.error('Accept call error:', error);
      }
    });

    // Reject call
    socket.on('reject_call', (data) => {
      try {
        const { callId, callerSocketId, reason = 'declined' } = data;
        
        // Notify caller that call was rejected
        io.to(callerSocketId).emit('call_rejected', {
          callId,
          reason,
          rejectedBy: {
            id: socket.userId,
            username: socket.username
          }
        });

      } catch (error) {
        console.error('Reject call error:', error);
      }
    });

    // End call
    socket.on('end_call', (data) => {
      try {
        const { callId } = data;
        
        // Notify all participants that call ended
        io.to(`call_${callId}`).emit('call_ended', {
          callId,
          endedBy: {
            id: socket.userId,
            username: socket.username
          }
        });

        // Remove users from call room
        io.in(`call_${callId}`).socketsLeave(`call_${callId}`);

      } catch (error) {
        console.error('End call error:', error);
      }
    });

    // WebRTC signaling
    socket.on('webrtc_offer', (data) => {
      try {
        const { callId, offer, targetSocketId } = data;
        
        io.to(targetSocketId).emit('webrtc_offer', {
          callId,
          offer,
          fromSocketId: socket.id
        });

      } catch (error) {
        console.error('WebRTC offer error:', error);
      }
    });

    socket.on('webrtc_answer', (data) => {
      try {
        const { callId, answer, targetSocketId } = data;
        
        io.to(targetSocketId).emit('webrtc_answer', {
          callId,
          answer,
          fromSocketId: socket.id
        });

      } catch (error) {
        console.error('WebRTC answer error:', error);
      }
    });

    socket.on('webrtc_ice_candidate', (data) => {
      try {
        const { callId, candidate, targetSocketId } = data;
        
        io.to(targetSocketId).emit('webrtc_ice_candidate', {
          callId,
          candidate,
          fromSocketId: socket.id
        });

      } catch (error) {
        console.error('WebRTC ICE candidate error:', error);
      }
    });

    // Call quality feedback
    socket.on('call_quality_report', async (data) => {
      try {
        const { callId, quality, issues } = data;
        
        // Log call quality for analytics
        console.log(`Call quality report for ${callId}:`, { quality, issues });
        
        // Store in database for analysis
        // await this.storeCallQualityReport(callId, socket.userId, quality, issues);

      } catch (error) {
        console.error('Call quality report error:', error);
      }
    });

    // Group call events
    socket.on('start_group_call', async (data) => {
      try {
        const { chatId, callType } = data;
        const callerId = socket.userId;

        // Verify user is in group
        const isParticipant = await this.verifyUserInChat(callerId, chatId);
        if (!isParticipant) {
          socket.emit('call_error', {
            error: 'Not authorized to start group call'
          });
          return;
        }

        const callId = `group_call_${Date.now()}_${chatId}`;

        // Notify all group members
        io.to(`chat_${chatId}`).emit('group_call_started', {
          callId,
          callType,
          chatId,
          startedBy: {
            id: callerId,
            username: socket.username,
            avatar: socket.userAvatar
          }
        });

      } catch (error) {
        console.error('Start group call error:', error);
        socket.emit('call_error', { error: error.message });
      }
    });

    socket.on('join_group_call', (data) => {
      try {
        const { callId } = data;
        
        socket.join(`call_${callId}`);
        
        // Notify other participants
        socket.to(`call_${callId}`).emit('user_joined_call', {
          callId,
          user: {
            id: socket.userId,
            username: socket.username,
            avatar: socket.userAvatar
          }
        });

        socket.emit('group_call_joined', { callId });

      } catch (error) {
        console.error('Join group call error:', error);
      }
    });
  }

  static async verifyCallPermission(callerId, targetUserId, chatId = null) {
    try {
      if (chatId) {
        // Verify both users are in the chat
        const { data: participants } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chatId)
          .in('user_id', [callerId, targetUserId])
          .eq('is_active', true);

        return participants.length === 2;
      } else {
        // Verify users are pals
        const { data: palRelation } = await supabase
          .from('pals')
          .select('*')
          .or(`and(requester_id.eq.${callerId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${callerId})`)
          .eq('status', 'accepted')
          .single();

        return !!palRelation;
      }
    } catch (error) {
      console.error('Verify call permission error:', error);
      return false;
    }
  }

  static async verifyUserInChat(userId, chatId) {
    try {
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .eq('is_active', true)
        .single();

      return !!participant;
    } catch (error) {
      return false;
    }
  }
}

module.exports = CallEvents;
