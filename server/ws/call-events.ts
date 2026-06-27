// FILE: /server/ws/call-events.ts
// Call Events - Voice/Video Call Management
// Converted from: call-events.js

import { db } from '~/server/utils/database'
import type { Socket, Server } from 'socket.io'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CallData {
  callId: string
  callerId: string
  targetUserId: string
  callType: 'voice' | 'video'
  chatId?: string
  status: 'pending' | 'accepted' | 'rejected' | 'ended'
  startedAt?: string
  endedAt?: string
  duration?: number
}

export interface CallSignal {
  callId: string
  type: 'offer' | 'answer' | 'ice-candidate'
  data: any
}

// ============================================================================
// CALL EVENTS HANDLER
// ============================================================================

export class CallEvents {
  /**
   * Setup call events for socket connection
   */
  static setupCallEvents(io: Server, socket: Socket) {
    // ===== INITIATE CALL =====
    socket.on('initiate_call', async (data: { targetUserId: string; callType: 'voice' | 'video'; chatId?: string }) => {
      try {
        const { targetUserId, callType, chatId } = data
        const callerId = socket.data?.userId

        if (!callerId) {
          socket.emit('call_error', { error: 'Not authenticated' })
          return
        }

        // Verify call permission
        const canCall = await this.verifyCallPermission(callerId, targetUserId, chatId)
        if (!canCall) {
          socket.emit('call_error', { error: 'Not authorized to call this user' })
          return
        }

        // Check if target user is online
        const targetSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.data?.userId === targetUserId
        )

        if (!targetSocket) {
          socket.emit('call_error', { error: 'User is not online' })
          return
        }

        // Generate call ID
        const callId = `call_${Date.now()}_${callerId}_${targetUserId}`

        // Store call data
        const callData: CallData = {
          callId,
          callerId,
          targetUserId,
          callType,
          chatId,
          status: 'pending',
          startedAt: new Date().toISOString()
        }

        // Save to database
        const { error: dbError } = await db
          .from('calls')
          .insert({
            id: callId,
            caller_id: callerId,
            target_user_id: targetUserId,
            call_type: callType,
            chat_id: chatId,
            status: 'pending',
            started_at: new Date().toISOString()
          })

        if (dbError) throw dbError

        // Send call invitation to target user
        targetSocket.emit('incoming_call', {
          callId,
          callerId,
          callerName: socket.data?.username,
          callerAvatar: socket.data?.avatar,
          callType
        })

        // Notify caller that invitation was sent
        socket.emit('call_initiated', { callId, status: 'pending' })

        console.log(`[Call] ${callerId} initiated ${callType} call to ${targetUserId}`)
      } catch (error) {
        console.error('[Call] Initiate call error:', error)
        socket.emit('call_error', { error: 'Failed to initiate call' })
      }
    })

    // ===== ACCEPT CALL =====
    socket.on('accept_call', async (data: { callId: string }) => {
      try {
        const { callId } = data
        const userId = socket.data?.userId

        if (!userId) {
          socket.emit('call_error', { error: 'Not authenticated' })
          return
        }

        // Update call status in database
        const { error: dbError } = await db
          .from('calls')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', callId)

        if (dbError) throw dbError

        // Get caller socket
        const { data: callData, error: fetchError } = await db
          .from('calls')
          .select('caller_id')
          .eq('id', callId)
          .single()

        if (fetchError) throw fetchError

        const callerSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.data?.userId === callData.caller_id
        )

        if (callerSocket) {
          callerSocket.emit('call_accepted', {
            callId,
            acceptedBy: userId,
            acceptedByName: socket.data?.username
          })
        }

        socket.emit('call_accepted_confirmed', { callId })
        console.log(`[Call] ${userId} accepted call ${callId}`)
      } catch (error) {
        console.error('[Call] Accept call error:', error)
        socket.emit('call_error', { error: 'Failed to accept call' })
      }
    })

    // ===== REJECT CALL =====
    socket.on('reject_call', async (data: { callId: string; reason?: string }) => {
      try {
        const { callId, reason } = data
        const userId = socket.data?.userId

        if (!userId) {
          socket.emit('call_error', { error: 'Not authenticated' })
          return
        }

        // Update call status
        const { error: dbError } = await db
          .from('calls')
          .update({ status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: reason })
          .eq('id', callId)

        if (dbError) throw dbError

        // Get caller socket
        const { data: callData, error: fetchError } = await db
          .from('calls')
          .select('caller_id')
          .eq('id', callId)
          .single()

        if (fetchError) throw fetchError

        const callerSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.data?.userId === callData.caller_id
        )

        if (callerSocket) {
          callerSocket.emit('call_rejected', {
            callId,
            rejectedBy: userId,
            reason: reason || 'User declined'
          })
        }

        socket.emit('call_rejected_confirmed', { callId })
        console.log(`[Call] ${userId} rejected call ${callId}`)
      } catch (error) {
        console.error('[Call] Reject call error:', error)
        socket.emit('call_error', { error: 'Failed to reject call' })
      }
    })

    // ===== END CALL =====
    socket.on('end_call', async (data: { callId: string }) => {
      try {
        const { callId } = data
        const userId = socket.data?.userId

        if (!userId) {
          socket.emit('call_error', { error: 'Not authenticated' })
          return
        }

        // Calculate call duration
        const { data: callData, error: fetchError } = await db
          .from('calls')
          .select('started_at, caller_id, target_user_id')
          .eq('id', callId)
          .single()

        if (fetchError) throw fetchError

        const duration = Math.floor(
          (new Date().getTime() - new Date(callData.started_at).getTime()) / 1000
        )

        // Update call status
        const { error: dbError } = await db
          .from('calls')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            duration
          })
          .eq('id', callId)

        if (dbError) throw dbError

        // Notify other participant
        const otherUserId = userId === callData.caller_id ? callData.target_user_id : callData.caller_id
        const otherSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.data?.userId === otherUserId
        )

        if (otherSocket) {
          otherSocket.emit('call_ended', {
            callId,
            endedBy: userId,
            duration
          })
        }

        socket.emit('call_ended_confirmed', { callId, duration })
        console.log(`[Call] ${userId} ended call ${callId} (duration: ${duration}s)`)
      } catch (error) {
        console.error('[Call] End call error:', error)
        socket.emit('call_error', { error: 'Failed to end call' })
      }
    })

    // ===== SEND CALL SIGNAL (WebRTC) =====
    socket.on('call_signal', async (data: CallSignal) => {
      try {
        const { callId, type, data: signalData } = data
        const userId = socket.data?.userId

        if (!userId) {
          socket.emit('call_error', { error: 'Not authenticated' })
          return
        }

        // Get call data
        const { data: callData, error: fetchError } = await db
          .from('calls')
          .select('caller_id, target_user_id')
          .eq('id', callId)
          .single()

        if (fetchError) throw fetchError

        // Determine recipient
        const recipientId = userId === callData.caller_id ? callData.target_user_id : callData.caller_id
        const recipientSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.data?.userId === recipientId
        )

        if (recipientSocket) {
          recipientSocket.emit('call_signal', {
            callId,
            type,
            data: signalData,
            from: userId
          })
        }
      } catch (error) {
        console.error('[Call] Send signal error:', error)
        socket.emit('call_error', { error: 'Failed to send signal' })
      }
    })

    // ===== MUTE/UNMUTE =====
    socket.on('toggle_audio', async (data: { callId: string; enabled: boolean }) => {
      try {
        const { callId, enabled } = data
        const userId = socket.data?.userId

        // Get call participants
        const { data: callData, error: fetchError } = await db
          .from('calls')
          .select('caller_id, target_user_id')
          .eq('id', callId)
          .single()

        if (fetchError) throw fetchError

        const otherUserId = userId === callData.caller_id ? callData.target_user_id : callData.caller_id
        const otherSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.data?.userId === otherUserId
        )

        if (otherSocket) {
          otherSocket.emit('participant_audio_toggled', {
            callId,
            userId,
            enabled
          })
        }
      } catch (error) {
        console.error('[Call] Toggle audio error:', error)
      }
    })

    // ===== TOGGLE VIDEO =====
    socket.on('toggle_video', async (data: { callId: string; enabled: boolean }) => {
      try {
        const { callId, enabled } = data
        const userId = socket.data?.userId

        // Get call participants
        const { data: callData, error: fetchError } = await db
          .from('calls')
          .select('caller_id, target_user_id')
          .eq('id', callId)
          .single()

        if (fetchError) throw fetchError

        const otherUserId = userId === callData.caller_id ? callData.target_user_id : callData.caller_id
        const otherSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.data?.userId === otherUserId
        )

        if (otherSocket) {
          otherSocket.emit('participant_video_toggled', {
            callId,
            userId,
            enabled
          })
        }
      } catch (error) {
        console.error('[Call] Toggle video error:', error)
      }
    })
  }

  /**
   * Verify if user can call another user
   */
  private static async verifyCallPermission(
    callerId: string,
    targetUserId: string,
    chatId?: string
  ): Promise<boolean> {
    try {
      // Check if users are in same chat or are pals
      if (chatId) {
        const { data: chatParticipants, error } = await db
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chatId)
          .in('user_id', [callerId, targetUserId])

        if (error) throw error
        return chatParticipants.length === 2
      }

      // Check if they are pals/friends
      const { data: follows, error } = await db
        .from('follows')
        .select('id')
        .eq('follower_id', callerId)
        .eq('following_id', targetUserId)

      if (error) throw error
      return follows.length > 0
    } catch (error) {
      console.error('[Call] Verify permission error:', error)
      return false
    }
  }
}
