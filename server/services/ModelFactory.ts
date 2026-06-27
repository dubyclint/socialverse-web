// FILE: /server/services/ModelFactory.ts
// CENTRALIZED MODEL FACTORY - Dependency Injection Pattern
// ============================================================================
// This factory provides lazy-loaded access to all models
// Breaks the transitive dependency chain completely

import * as EscrowTrade from '~/server/models/escrow-trade'
import * as MatchRequest from '~/server/models/match-request'
import * as Notification from '~/server/models/notification'
import * as Trade from '~/server/models/trade'
import * as P2PProfile from '~/server/models/p2p-profile'
import * as Pal from '~/server/models/pal'
import * as PewGift from '~/server/models/pewgift'
import * as Post from '~/server/models/post'
import * as SwapTransaction from '~/server/models/swap-transaction'
import * as UniverseMessage from '~/server/models/universe-message'
import * as UserWallet from '~/server/models/user-wallet'
import * as Profile from '~/server/models/profile'

// ============================================================================
// MODEL FACTORY CLASS
// ============================================================================
export class ModelFactory {
  /**
   * Get EscrowTrade model
   * ✅ Lazy-loaded: Supabase only loads when model methods are called
   */
  static getEscrowTrade() {
    return EscrowTrade
  }

  /**
   * Get MatchRequest model
   */
  static getMatchRequest() {
    return MatchRequest
  }

  /**
   * Get Notification model
   */
  static getNotification() {
    return Notification
  }

  /**
   * Get Trade model
   */
  static getTrade() {
    return Trade
  }

  /**
   * Get P2PProfile model
   */
  static getP2PProfile() {
    return P2PProfile
  }

  /**
   * Get Pal model
   */
  static getPal() {
    return Pal
  }

  /**
   * Get PewGift model
   */
  static getPewGift() {
    return PewGift
  }

  /**
   * Get Post model
   */
  static getPost() {
    return Post
  }

  /**
   * Get SwapTransaction model
   */
  static getSwapTransaction() {
    return SwapTransaction
  }

  /**
   * Get UniverseMessage model
   */
  static getUniverseMessage() {
    return UniverseMessage
  }

  /**
   * Get UserWallet model
   */
  static getUserWallet() {
    return UserWallet
  }

  /**
   * Get Profile model
   */
  static getProfile() {
    return Profile
  }

  /**
   * Get all models
   */
  static getAllModels() {
    return {
      EscrowTrade,
      MatchRequest,
      Notification,
      Trade,
      P2PProfile,
      Pal,
      PewGift,
      Post,
      SwapTransaction,
      UniverseMessage,
      UserWallet,
      Profile
    }
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================
export const modelFactory = new ModelFactory()
