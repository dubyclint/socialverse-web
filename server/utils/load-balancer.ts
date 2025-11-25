import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface ServerConfig {
  id: string;
  url: string;
  region: string;
  capacity: number;
  priority: number;
  protocols: string[];
}

interface ServerState extends ServerConfig {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  currentLoad: number;
  responseTime: number;
  lastHealthCheck: Date | null;
  consecutiveFailures: number;
  activeStreams: Set<string>;
  capabilities: ServerCapabilities;
}

interface ServerCapabilities {
  maxConcurrentStreams: number;
  supportedCodecs: string[];
  supportedResolutions: string[];
}

interface HealthCheckResponse {
  load: number;
  activeStreams: string[];
}

interface LoadBalancerRequirements {
  region?: string | null;
  protocol?: string;
  quality?: string;
  userLocation?: string | null;
}

interface ScoredServer extends ServerState {
  score: number;
}

export class LoadBalancer {
  private servers: Map<string, ServerState>;
  private supabase: SupabaseClient;
  private healthCheckInterval: number;
  private maxRetries: number;
  private timeoutMs: number;

  constructor() {
    this.servers = new Map();
    this.healthCheckInterval = 30000;
    this.maxRetries = 3;
    this.timeoutMs = 5000;

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializeServers();
    this.startHealthChecks();
  }

  private async initializeServers(): Promise<void> {
    try {
      const serverConfigs: ServerConfig[] = [
        {
          id: 'primary',
          url: process.env.PRIMARY_SERVER_URL || 'http://localhost:8080',
          region: 'us-east-1',
          capacity: 1000,
          priority: 1,
          protocols: ['webrtc', 'hls', 'dash']
        },
        {
          id: 'secondary',
          url: process.env.SECONDARY_SERVER_URL || 'http://localhost:8081',
          region: 'us-west-1',
          capacity: 800,
          priority: 2,
          protocols: ['webrtc', 'hls']
        },
        {
          id: 'eu-server',
          url: process.env.EU_SERVER_URL || 'http://eu.example.com:8080',
          region: 'eu-west-1',
          capacity: 600,
          priority: 1,
          protocols: ['webrtc', 'hls', 'dash']
        }
      ];

      for (const config of serverConfigs) {
        this.servers.set(config.id, {
          ...config,
          status: 'unknown',
          currentLoad: 0,
          responseTime: 0,
          lastHealthCheck: null,
          consecutiveFailures: 0,
          activeStreams: new Set(),
          capabilities: {
            maxConcurrentStreams: config.capacity,
            supportedCodecs: ['h264', 'vp8', 'vp9'],
            supportedResolutions: ['360p', '480p', '720p', '1080p']
          }
        });
      }

      console.log(`Initialized ${this.servers.size} servers for load balancing`);
    } catch (error) {
      console.error('Failed to initialize servers:', error);
    }
  }

  private async startHealthChecks(): Promise<void> {
    const performHealthCheck = async (): Promise<void> => {
      const healthPromises = Array.from(this.servers.entries()).map(
        ([serverId, server]) => this.checkServerHealth(serverId, server)
      );

      await Promise.allSettled(healthPromises);
    };

    await performHealthCheck();
    setInterval(performHealthCheck, this.healthCheckInterval);
  }

  private async checkServerHealth(serverId: string, server: ServerState): Promise<void> {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialVerse-LoadBalancer/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const healthData: HealthCheckResponse = await response.json();

        this.servers.set(serverId, {
          ...server,
          status: 'healthy',
          responseTime,
          currentLoad: healthData.load || 0,
          lastHealthCheck: new Date(),
          consecutiveFailures: 0,
          activeStreams: new Set(healthData.activeStreams || [])
        });

        console.log(`Server ${serverId} is healthy (${responseTime}ms)`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const server = this.servers.get(serverId)!;
      const consecutiveFailures = server.consecutiveFailures + 1;

      this.servers.set(serverId, {
        ...server,
        status: consecutiveFailures >= this.maxRetries ? 'unhealthy' : 'degraded',
        consecutiveFailures,
        lastHealthCheck: new Date()
      });

      console.warn(`Server ${serverId} health check failed:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  getBestServer(requirements: LoadBalancerRequirements = {}): ServerState {
    const {
      region = null,
      protocol = 'webrtc',
      quality = '720p',
      userLocation = null
    } = requirements;

    const healthyServers = Array.from(this.servers.entries())
      .filter(([_, server]) => server.status === 'healthy')
      .map(([id, server]) => ({ ...server, id }));

    if (healthyServers.length === 0) {
      const degradedServers = Array.from(this.servers.entries())
        .filter(([_, server]) => server.status === 'degraded')
        .map(([id, server]) => ({ ...server, id }));

      if (degradedServers.length === 0) {
        throw new Error('No available servers');
      }

      return this.selectOptimalServer(degradedServers, requirements);
    }

    return this.selectOptimalServer(healthyServers, requirements);
  }

  private selectOptimalServer(
    servers: (ServerState & { id: string })[],
    requirements: LoadBalancerRequirements
  ): ServerState {
    const { region, protocol, userLocation } = requirements;

    let candidateServers = servers.filter(server =>
      server.protocols.includes(protocol || 'webrtc')
    );

    if (candidateServers.length === 0) {
      candidateServers = servers;
    }

    const scoredServers: ScoredServer[] = candidateServers.map(server => {
      let score = 0;

      const loadFactor = server.currentLoad / server.capacity;
      score += (1 - loadFactor) * 40;

      const responseTimeFactor = Math.max(0, 1 - (server.responseTime / 1000));
      score += responseTimeFactor * 30;

      if (region && server.region === region) {
        score += 20;
      }

      score += (3 - server.priority) * 10;

      if (userLocation && this.calculateDistance(server.region, userLocation) < 1000) {
        score += 15;
      }

      return { ...server, score };
    });

    scoredServers.sort((a, b) => b.score - a.score);
    return scoredServers[0];
  }

  private calculateDistance(region: string, userLocation: string): number {
    // Simplified distance calculation
    const regionCoords: { [key: string]: [number, number] } = {
      'us-east-1': [38.8951, -77.0369],
      'us-west-1': [37.7749, -122.4194],
      'eu-west-1': [53.3498, -6.2603],
      'ap-southeast-1': [1.3521, 103.8198]
    };

    const [lat1, lon1] = regionCoords[region] || [0, 0];
    const [lat2, lon2] = regionCoords[userLocation] || [0, 0];

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  addServerLoad(serverId: string, streamId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.activeStreams.add(streamId);
      server.currentLoad = server.activeStreams.size;
      this.servers.set(serverId, server);
    }
  }

  removeServerLoad(serverId: string, streamId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.activeStreams.delete(streamId);
      server.currentLoad = server.activeStreams.size;
      this.servers.set(serverId, server);
    }
  }

  getServerStatus(serverId: string): ServerState | undefined {
    return this.servers.get(serverId);
  }

  getAllServers(): ServerState[] {
    return Array.from(this.servers.values());
  }
}
