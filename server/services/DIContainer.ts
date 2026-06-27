// FILE: /server/services/DIContainer.ts
// DEPENDENCY INJECTION CONTAINER
// ============================================================================
// Manages service registration, resolution, and lifecycle

import { ModelFactory } from './ModelFactory'

// ============================================================================
// SERVICE REGISTRY TYPES
// ============================================================================
interface ServiceDefinition {
  factory: () => any
  singleton: boolean
  instance?: any
}

// ============================================================================
// DEPENDENCY INJECTION CONTAINER CLASS
// ============================================================================
export class DIContainer {
  private services: Map<string, ServiceDefinition> = new Map()
  private singletons: Map<string, any> = new Map()

  constructor() {
    this.registerDefaultServices()
  }

  /**
   * Register default services
   */
  private registerDefaultServices() {
    // Register ModelFactory as singleton
    this.registerSingleton('modelFactory', () => new ModelFactory())

    // Register individual models
    this.registerSingleton('EscrowTrade', () =>
      ModelFactory.getEscrowTrade()
    )
    this.registerSingleton('MatchRequest', () =>
      ModelFactory.getMatchRequest()
    )
    this.registerSingleton('Notification', () =>
      ModelFactory.getNotification()
    )
    this.registerSingleton('Trade', () => ModelFactory.getTrade())
    this.registerSingleton('P2PProfile', () =>
      ModelFactory.getP2PProfile()
    )
    this.registerSingleton('Pal', () => ModelFactory.getPal())
    this.registerSingleton('PewGift', () => ModelFactory.getPewGift())
    this.registerSingleton('Post', () => ModelFactory.getPost())
    this.registerSingleton('SwapTransaction', () =>
      ModelFactory.getSwapTransaction()
    )
    this.registerSingleton('UniverseMessage', () =>
      ModelFactory.getUniverseMessage()
    )
    this.registerSingleton('UserWallet', () =>
      ModelFactory.getUserWallet()
    )
    this.registerSingleton('Profile', () => ModelFactory.getProfile())
  }

  /**
   * Register a singleton service
   */
  registerSingleton(name: string, factory: () => any) {
    this.services.set(name, {
      factory,
      singleton: true
    })
  }

  /**
   * Register a transient service (new instance each time)
   */
  registerTransient(name: string, factory: () => any) {
    this.services.set(name, {
      factory,
      singleton: false
    })
  }

  /**
   * Resolve a service
   */
  resolve<T = any>(name: string): T {
    const service = this.services.get(name)

    if (!service) {
      throw new Error(`Service '${name}' not registered in DIContainer`)
    }

    // Return singleton instance if already created
    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory())
      }
      return this.singletons.get(name) as T
    }

    // Return new instance for transient services
    return service.factory() as T
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name)
  }

  /**
   * Clear all singletons
   */
  clearSingletons() {
    this.singletons.clear()
  }

  /**
   * Clear all services
   */
  clear() {
    this.services.clear()
    this.singletons.clear()
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================
export const diContainer = new DIContainer()
