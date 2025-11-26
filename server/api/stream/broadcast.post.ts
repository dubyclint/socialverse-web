// FILE 12: /server/api/stream/broadcast.post.ts (UPDATED)
// ============================================================================
// POST /api/stream/broadcast - WebRTC broadcast with load balancing
// ============================================================================

import { selectStreamServer, trackStreamLoad } from '../middleware/load-balance';
import { uploadToCDN } from '../middleware/cdn-upload';
import { logUserEvent } from '../middleware/ml-service';
import { checkPremiumStatus } from '../middleware/premium-check';

interface BroadcastRequest {
  streamId: string;
  title: string;
  description?: string;
  offer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  type: 'offer' | 'ice-candidate' | 'stream-started' | 'stream-ended';
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      });
    }

    const body = await readBody<BroadcastRequest>(event);
    const { streamId, type, title, description } = body;

    if (!streamId || !type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: streamId, type'
      });
    }

    // Get user's region/location
    const userLocation = event.headers.get('cf-ipcountry') || 'US';

    // Select best server using load balancer
    const serverSelection = await selectStreamServer(event, {
      protocol: 'webrtc',
      quality: '1080p',
      userLocation
    });

    if (!serverSelection) {
      throw createError({
        statusCode: 503,
        statusMessage: 'No available streaming servers'
      });
    }

    // Check premium status for quality
    const premiumStatus = await checkPremiumStatus(event);
    const quality = premiumStatus.isPremium ? '1080p' : '720p';

    // Handle different broadcast types
    let response: any = {
      success: true,
      streamId,
      serverId: serverSelection.serverId,
      serverUrl: serverSelection.url,
      quality
    };

    if (type === 'stream-started') {
      // Track load on server
      await trackStreamLoad(event, serverSelection.serverId, streamId, 'add');

      // Log event
      await logUserEvent(event, user.id, {
        eventType: 'stream_started',
        itemId: streamId,
        itemType: 'stream',
        metadata: { title, quality }
      });

      response.message = 'Stream started successfully';
    } else if (type === 'stream-ended') {
      // Remove load from server
      await trackStreamLoad(event, serverSelection.serverId, streamId, 'remove');

      // Log event
      await logUserEvent(event, user.id, {
        eventType: 'stream_ended',
        itemId: streamId,
        itemType: 'stream'
      });

      response.message = 'Stream ended';
    } else if (type === 'offer') {
      response.offer = body.offer;
      response.message = 'Offer received, ready for answer';
    } else if (type === 'ice-candidate') {
      response.candidate = body.candidate;
      response.message = 'ICE candidate received';
    }

    return response;
  } catch (error) {
    console.error('Error in broadcast:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Broadcast error'
    });
  }
});
