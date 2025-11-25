// FILE 4: /server/api/middleware/load-balance.ts
// ============================================================================
// Load balancer middleware for stream routing
// ============================================================================

import { H3Event } from 'h3';
import { LoadBalancer } from '../../utils/load-balancer';

export interface StreamServerSelection {
  serverId: string;
  url: string;
  region: string;
  protocol: string;
  quality: string;
}

export async function selectStreamServer(
  event: H3Event,
  options: {
    region?: string;
    protocol?: string;
    quality?: string;
    userLocation?: string;
  } = {}
): Promise<StreamServerSelection | null> {
  try {
    const loadBalancer = event.context.loadBalancer as LoadBalancer;
    
    if (!loadBalancer) {
      console.error('Load Balancer not initialized');
      return null;
    }

    const server = loadBalancer.getBestServer({
      region: options.region,
      protocol: options.protocol || 'webrtc',
      quality: options.quality || '720p',
      userLocation: options.userLocation
    });

    return {
      serverId: server.id,
      url: server.url,
      region: server.region,
      protocol: options.protocol || 'webrtc',
      quality: options.quality || '720p'
    };
  } catch (error) {
    console.error('Error selecting stream server:', error);
    return null;
  }
}

export async function trackStreamLoad(
  event: H3Event,
  serverId: string,
  streamId: string,
  action: 'add' | 'remove'
): Promise<void> {
  try {
    const loadBalancer = event.context.loadBalancer as LoadBalancer;
    
    if (!loadBalancer) {
      return;
    }

    if (action === 'add') {
      loadBalancer.addServerLoad(serverId, streamId);
    } else {
      loadBalancer.removeServerLoad(serverId, streamId);
    }
  } catch (error) {
    console.error('Error tracking stream load:', error);
  }
}

export async function getServerHealth(
  event: H3Event
): Promise<{ [key: string]: any } | null> {
  try {
    const loadBalancer = event.context.loadBalancer as LoadBalancer;
    
    if (!loadBalancer) {
      return null;
    }

    return loadBalancer.getServerStats?.();
  } catch (error) {
    console.error('Error getting server health:', error);
    return null;
  }
}
