// /server/utils/load-balancer.ts
import type { SupabaseClient } from '@supabase/supabase-js'

interface ServerConfig {
  id: string
  url: string
  region: string
  capacity: number
  priority: number
  protocols: string[]
}

interface ServerState extends ServerConfig {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  currentLoad: number
  responseTime: number
  lastHealthCheck: Date | null
  consecutiveFailures: number
  activeStreams: Set<string>
  capabilities: ServerCapabilities
}

interface ServerCapabilities {
  maxConnections: number
  supportedProtocols: string[]
  maxBandwidth: number
}

interface LoadBalancingStrategy {
  name: string
  weight: number
}

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: SupabaseClient | null = null

async function getSupabaseClient(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    return supabaseInstance
  } catch (error) {
    console.error('[LoadBalancer] Failed to initialize Supabase:', error)
    throw new Error('Supabase initialization failed')
  }
}

export class LoadBalancer {
  private servers: Map<string, ServerState> = new Map()
  private supabase: SupabaseClient | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private strategy: LoadBalancingStrategy = { name: 'round-robin', weight: 1 }

  constructor() {
    this.initializeServers()
  }

  private async ensureSupabase(): Promise<SupabaseClient> {
    if (!this.supabase) {
      this.supabase = await getSupabaseClient()
    }
    return this.supabase
  }

  private initializeServers(): void {
    // Initialize servers from environment or config
    const serverConfigs = this.getServerConfigs()
    serverConfigs.forEach(config => {
      this.servers.set(config.id, {
        ...config,
        status: 'unknown',
        currentLoad: 0,
        responseTime: 0,
        lastHealthCheck: null,
        consecutiveFailures: 0,
        activeStreams: new Set(),
        capabilities: {
          maxConnections: 1000,
          supportedProtocols: config.protocols,
          maxBandwidth: 1000
        }
      })
    })
  }

  private getServerConfigs(): ServerConfig[] {
    // Load from environment or database
    return []
  }

  async selectServer(): Promise<ServerState | null> {
    try {
      const supabase = await this.ensureSupabase()
      
      // Get healthy servers
      const healthyServers = Array.from(this.servers.values()).filter(
        s => s.status === 'healthy'
      )

      if (healthyServers.length === 0) {
        console.warn('[LoadBalancer] No healthy servers available')
        return null
      }

      // Apply load balancing strategy
      const selected = this.applyStrategy(healthyServers)

      // Log selection to Supabase
      await supabase
        .from('load_balancer_logs')
        .insert({
          selected_server_id: selected.id,
          timestamp: new Date().toISOString(),
          current_load: selected.currentLoad
        })

      return selected
    } catch (error) {
      console.error('[LoadBalancer] Server selection failed:', error)
      return null
    }
  }

  private applyStrategy(servers: ServerState[]): ServerState {
    // Implement round-robin or other strategies
    return servers[Math.floor(Math.random() * servers.length)]
  }

  async updateServerHealth(serverId: string, healthy: boolean): Promise<void> {
    try {
      const supabase = await this.ensureSupabase()
      const server = this.servers.get(serverId)

      if (!server) return

      server.status = healthy ? 'healthy' : 'unhealthy'
      server.lastHealthCheck = new Date()

      // Update in Supabase
      await supabase
        .from('server_health')
        .upsert({
          server_id: serverId,
          status: server.status,
          last_check: new Date().toISOString()
        })
    } catch (error) {
      console.error('[LoadBalancer] Health update failed:', error)
    }
  }

  startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [serverId, server] of this.servers) {
        try {
          const response = await fetch(`${server.url}/health`, {
            timeout: 5000
          })
          await this.updateServerHealth(serverId, response.ok)
        } catch (error) {
          await this.updateServerHealth(serverId, false)
        }
      }
    }, 30000)
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  }
}
