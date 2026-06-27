// FILE: /server/services/ServiceRegistry.ts
// SERVICE REGISTRY - Central service management
// ============================================================================
// Provides a centralized way to access all services throughout the app

import { DIContainer, diContainer } from './DIContainer'
import { ModelFactory, modelFactory } from './ModelFactory'

// ============================================================================
// SERVICE REGISTRY CLASS
// ============================================================================
export class ServiceRegistry {
  private container: DIContainer

  constructor(container: DIContainer = diContainer) {
    this.container = container
  }

  /**
   * Get ModelFactory
   */
  getModelFactory(): typeof ModelFactory {
    return this.container.resolve('modelFactory')
  }

  /**
   * Get EscrowTrade model
   */
  getEscrowTrade() {
    return this.container.resolve('EscrowTrade')
  }

  /**
   * Get MatchRequest model
   */
  getMatchRequest() {
    return this.container.resolve('MatchRequest')
  }

  /**
   * Get Notification model
   */
  getNotification() {
    return this.container.resolve('Notification')
  }

  /**
   * Get Trade model
   */
  getTrade() {
    return this.container.resolve('Trade')
  }

  /**
   * Get P2PProfile model
   */
  getP2PProfile() {
    return this.container.resolve('P2PProfile')
  }

  /**
   * Get Pal model
   */
  getPal() {
    return this.container.resolve('Pal')
  }

  /**
   * Get PewGift model
   */
  getPewGift() {
    return this.container.resolve('PewGift')
  }

  /**
   * Get Post model
   */
  getPost() {
    return this.container.resolve('Post')
  }

  /**
   * Get SwapTransaction model
   */
  getSwapTransaction() {
    return this.container.resolve('SwapTransaction')
  }

  /**
   * Get UniverseMessage model
   */
  getUniverseMessage() {
    return this.container.resolve('UniverseMessage')
  }

  /**
   * Get UserWallet model
   */
  getUserWallet() {
    return this.container.resolve('UserWallet')
  }

  /**
   * Get Profile model
   */
  getProfile() {
    return this.container.resolve('Profile')
  }

  /**
   * Register custom service
   */
  registerService(name: string, factory: () => any, singleton: boolean = true) {
    if (singleton) {
      this.container.registerSingleton(name, factory)
    } else {
      this.container.registerTransient(name, factory)
    }
  }

  /**
   * Check if service exists
   */
  hasService(name: string): boolean {
    return this.container.has(name)
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================
export const serviceRegistry = new ServiceRegistry(diContainer)

// ============================================================================
// EXPORT CONVENIENCE FUNCTIONS
// ============================================================================
export function getServiceRegistry(): ServiceRegistry {
  return serviceRegistry
}

export function getModel(modelName: string) {
  return serviceRegistry.getModelFactory()[modelName]
}
