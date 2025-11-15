// FILE 2: server/api/stream/broadcast.post.ts - WEBRTC BROADCAST ENDPOINT
// ============================================================================
// HANDLE WEBRTC OFFER/ANSWER AND ICE CANDIDATES
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface BroadcastRequest {
  type: 'offer' | 'ice-candidate' | 'stream-started' | 'stream-ended'
  offer?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
  streamConfig?: any
  streamId?: string
  duration?: number
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody<BroadcastRequest>(event)

    if (!body.type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing type field'
      })
    }

    const supabase = await serverSupabaseClient(event)

    switch (body.type) {
      case 'offer': {
        // Handle WebRTC offer
        if (!body.offer || !body.streamConfig) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Missing offer or streamConfig'
          })
        }

        // Create stream record
        const { data: stream, error: streamError } = await supabase
          .from('streams')
          .insert({
            broadcaster_id: user.id,
            title: body.streamConfig.title,
            category: body.streamConfig.category,
            privacy: body.streamConfig.privacy,
            quality: body.streamConfig.quality,
            status: 'live',
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (streamError) throw streamError

        // Store offer in database
        const { data: offer, error: offerError } = await supabase
          .from('stream_offers')
          .insert({
            stream_id: stream.id,
            offer_data: JSON.stringify(body.offer)
          })
          .select()
          .single()

        if (offerError) throw offerError

        // Generate answer (simplified - in production use actual WebRTC library)
        const answer = {
          type: 'answer',
          sdp: generateAnswerSDP(body.offer.sdp || '')
        }

        return {
          success: true,
          streamId: stream.id,
          answer: answer
        }
      }

      case 'ice-candidate': {
        // Handle ICE candidate
        if (!body.candidate || !body.streamId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Missing candidate or streamId'
          })
        }

        const { error } = await supabase
          .from('stream_ice_candidates')
          .insert({
            stream_id: body.streamId,
            candidate_data: JSON.stringify(body.candidate)
          })

        if (error) throw error

        return { success: true }
      }

      case 'stream-started': {
        // Update stream status
        if (!body.streamId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Missing streamId'
          })
        }

        const { error } = await supabase
          .from('streams')
          .update({
            status: 'live',
            started_at: new Date().toISOString()
          })
          .eq('id', body.streamId)

        if (error) throw error

        return { success: true }
      }

      case 'stream-ended': {
        // End stream
        if (!body.streamId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Missing streamId'
          })
        }

        const { error } = await supabase
          .from('streams')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            duration: body.duration || 0
          })
          .eq('id', body.streamId)

        if (error) throw error

        return { success: true }
      }

      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Unknown type: ${body.type}`
        })
    }
  } catch (error: any) {
    console.error('Broadcast error:', error)
    throw error
  }
})

// Helper function to generate answer SDP
function generateAnswerSDP(offerSDP: string): string {
  // This is a simplified version - in production, use a proper WebRTC library
  return offerSDP.replace(/^o=.*/, `o=- ${Date.now()} 2 IN IP4 127.0.0.1`)
}
