// server/utils/loadBalancer.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class LoadBalancer {
  constructor() {
    this.servers = new Map()
    this.healthCheckInterval = 30000 // 30 seconds
    this.maxRetries = 3
    this.timeoutMs = 5000
    
    this.initializeServers()
    this.startHealthChecks()
  }

  async initializeServers() {
    try {
      // Load server configuration from environment or database
      const serverConfigs = [
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
      ]

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
        })
      }

      console.log(`Initialized ${this.servers.size} servers for load balancing`)
    } catch (error) {
      console.error('Failed to initialize servers:', error)
    }
  }

  async startHealthChecks() {
    const performHealthCheck = async () => {
      const healthPromises = Array.from(this.servers.entries()).map(
        ([serverId, server]) => this.checkServerHealth(serverId, server)
      )
      
      await Promise.allSettled(healthPromises)
    }

    // Initial health check
    await performHealthCheck()
    
    // Schedule periodic health checks
    setInterval(performHealthCheck, this.healthCheckInterval)
  }

  async checkServerHealth(serverId, server) {
    try {
      const startTime = Date.now()
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)
      
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'SocialVerse-LoadBalancer/1.0'
        }
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        const healthData = await response.json()
        
        this.servers.set(serverId, {
          ...server,
          status: 'healthy',
          responseTime,
          currentLoad: healthData.load || 0,
          lastHealthCheck: new Date(),
          consecutiveFailures: 0,
          activeStreams: new Set(healthData.activeStreams || [])
        })
        
        console.log(`Server ${serverId} is healthy (${responseTime}ms)`)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      const server = this.servers.get(serverId)
      const consecutiveFailures = server.consecutiveFailures + 1
      
      this.servers.set(serverId, {
        ...server,
        status: consecutiveFailures >= this.maxRetries ? 'unhealthy' : 'degraded',
        consecutiveFailures,
        lastHealthCheck: new Date()
      })
      
      console.warn(`Server ${serverId} health check failed:`, error.message)
    }
  }

  // Get the best server for a new stream
  getBestServer(requirements = {}) {
    const {
      region = null,
      protocol = 'webrtc',
      quality = '720p',
      userLocation = null
    } = requirements

    const healthyServers = Array.from(this.servers.entries())
      .filter(([_, server]) => server.status === 'healthy')
      .map(([id, server]) => ({ id, ...server }))

    if (healthyServers.length === 0) {
      // Fallback to degraded servers if no healthy ones available
      const degradedServers = Array.from(this.servers.entries())
        .filter(([_, server]) => server.status === 'degraded')
        .map(([id, server]) => ({ id, ...server }))
      
      if (degradedServers.length === 0) {
        throw new Error('No available servers')
      }
      
      return this.selectOptimalServer(degradedServers, requirements)
    }

    return this.selectOptimalServer(healthyServers, requirements)
  }

  selectOptimalServer(servers, requirements) {
    const { region, protocol, userLocation } = requirements

    // Filter servers by protocol support
    let candidateServers = servers.filter(server => 
      server.protocols.includes(protocol)
    )

    if (candidateServers.length === 0) {
      candidateServers = servers // Fallback to all servers
    }

    // Score servers based on multiple factors
    const scoredServers = candidateServers.map(server => {
      let score = 0

      // Load factor (lower is better)
      const loadFactor = server.currentLoad / server.capacity
      score += (1 - loadFactor) * 40

      // Response time factor (lower is better)
      const responseTimeFactor = Math.max(0, 1 - (server.responseTime / 1000))
      score += responseTimeFactor * 30

      // Region preference
      if (region && server.region === region) {
        score += 20
      }

      // Priority factor
      score += (3 - server.priority) * 10 // Higher priority = lower number

      // Geographic proximity (simplified)
      if (userLocation && this.calculateDistance(server.region, userLocation) < 1000) {
        score += 15
      }

      return { ...server, score }
    })

    // Sort by score (highest first) and return the best server
    scoredServers.sort((a, b) => b.score - a.score)
    
    const bestServer = scoredServers[0]
    console.log(`Selected server ${bestServer.id} with score ${bestServer.score}`)
    
    return bestServer
  }

  // Simplified distance calculation (in practice, use proper geolocation)
  calculateDistance(serverRegion, userLocation) {
    const regionCoords = {
      'us-east-1': { lat: 39.0458, lng: -76.6413 },
      'us-west-1': { lat: 37.4419, lng: -122.1430 },
      'eu-west-1': { lat: 53.3498, lng: -6.2603 },
      'ap-southeast-1': { lat: 1.3521, lng: 103.8198 }
    }

    const serverCoords = regionCoords[serverRegion]
    if (!serverCoords || !userLocation.lat || !userLocation.lng) {
      return 1000 // Default distance
    }

    // Haversine formula for distance calculation
    const R = 6371 // Earth's radius in km
    const dLat = (userLocation.lat - serverCoords.lat) * Math.PI / 180
    const dLng = (userLocation.lng - serverCoords.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(serverCoords.lat * Math.PI / 180) * Math.cos(userLocation.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    
    return R * c
  }

  // Register a new stream on a server
  async registerStream(serverId, streamId, streamConfig) {
    try {
      const server = this.servers.get(serverId)
      if (!server) {
        throw new Error(`Server ${serverId} not found`)
      }

      // Add stream to server's active streams
      server.activeStreams.add(streamId)
      server.currentLoad = server.activeStreams.size

      // Notify the server about the new stream
      const response = await fetch(`${server.url}/api/streams/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
        },
        body: JSON.stringify({
          streamId,
          config: streamConfig
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to register stream: HTTP ${response.status}`)
      }

      console.log(`Stream ${streamId} registered on server ${serverId}`)
      return { success: true, serverId, serverUrl: server.url }
    } catch (error) {
      console.error(`Failed to register stream ${streamId} on server ${serverId}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Unregister a stream from a server
  async unregisterStream(serverId, streamId) {
    try {
      const server = this.servers.get(serverId)
      if (!server) {
        throw new Error(`Server ${serverId} not found`)
      }

      // Remove stream from server's active streams
      server.activeStreams.delete(streamId)
      server.currentLoad = server.activeStreams.size

      // Notify the server about stream removal
      const response = await fetch(`${server.url}/api/streams/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
        },
        body: JSON.stringify({ streamId })
      })

      if (!response.ok) {
        console.warn(`Failed to unregister stream from server: HTTP ${response.status}`)
      }

      console.log(`Stream ${streamId} unregistered from server ${serverId}`)
      return { success: true }
    } catch (error) {
      console.error(`Failed to unregister stream ${streamId} from server ${serverId}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Get load balancer statistics
  getStats() {
    const stats = {
      totalServers: this.servers.size,
      healthyServers: 0,
      degradedServers: 0,
      unhealthyServers: 0,
      totalActiveStreams: 0,
      totalCapacity: 0,
      averageLoad: 0,
      servers: []
    }

    for (const [id, server] of this.servers) {
      switch (server.status) {
        case 'healthy':
          stats.healthyServers++
          break
        case 'degraded':
          stats.degradedServers++
          break
        case 'unhealthy':
          stats.unhealthyServers++
          break
      }

      stats.totalActiveStreams += server.activeStreams.size
      stats.totalCapacity += server.capacity

      stats.servers.push({
        id,
        status: server.status,
        region: server.region,
        currentLoad: server.currentLoad,
        capacity: server.capacity,
        responseTime: server.responseTime,
        activeStreams: server.activeStreams.size,
        loadPercentage: Math.round((server.currentLoad / server.capacity) * 100)
      })
    }

    stats.averageLoad = stats.totalCapacity > 0 
      ? Math.round((stats.totalActiveStreams / stats.totalCapacity) * 100)
      : 0

    return stats
  }

  // Migrate streams from unhealthy server
  async migrateStreamsFromServer(unhealthyServerId) {
    try {
      const unhealthyServer = this.servers.get(unhealthyServerId)
      if (!unhealthyServer || unhealthyServer.activeStreams.size === 0) {
        return { success: true, migratedStreams: 0 }
      }

      const streamsToMigrate = Array.from(unhealthyServer.activeStreams)
      const migrationResults = []

      for (const streamId of streamsToMigrate) {
        try {
          // Find a new server for the stream
          const newServer = this.getBestServer({ protocol: 'webrtc' })
          
          // Get stream configuration
          const { data: streamConfig } = await supabase
            .from('streams')
            .select('*')
            .eq('id', streamId)
            .single()

          if (streamConfig) {
            // Register stream on new server
            const registerResult = await this.registerStream(newServer.id, streamId, streamConfig)
            
            if (registerResult.success) {
              // Update stream server in database
              await supabase
                .from('streams')
                .update({ server_id: newServer.id, server_url: newServer.url })
                .eq('id', streamId)

              // Unregister from old server
              await this.unregisterStream(unhealthyServerId, streamId)

              migrationResults.push({ streamId, success: true, newServerId: newServer.id })
            } else {
              migrationResults.push({ streamId, success: false, error: registerResult.error })
            }
          }
        } catch (error) {
          migrationResults.push({ streamId, success: false, error: error.message })
        }
      }

      const successfulMigrations = migrationResults.filter(r => r.success).length
      console.log(`Migrated ${successfulMigrations}/${streamsToMigrate.length} streams from server ${unhealthyServerId}`)

      return {
        success: true,
        migratedStreams: successfulMigrations,
        totalStreams: streamsToMigrate.length,
        results: migrationResults
      }
    } catch (error) {
      console.error(`Failed to migrate streams from server ${unhealthyServerId}:`, error)
      return { success: false, error: error.message }
    }
  }
}

export default LoadBalancer
