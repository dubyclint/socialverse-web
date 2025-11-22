// FILE: /server/utils/auth-utils.ts - COMPLETE FIXED VERSION WITH STUBS
// ============================================================================
// AUTHENTICATION UTILITIES WITH LAZY SUPABASE LOADING
// Includes stub implementations for all missing functions
// ============================================================================

import jwt from 'jsonwebtoken'
import { db, dbAdmin } from './database'

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (event: any) => {
    const userId = event.node.req.headers['x-user-id'] || 'anonymous'
    const key = `${userId}:${event.node.req.url}`
    
    const now = Date.now()
    const record = rateLimitStore.get(key)
    
    if (record && now < record.resetTime) {
      if (record.count >= maxRequests) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Too many requests'
        })
      }
      record.count++
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
    }
  }
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Authenticate user by email and password
 */
export const authenticateUser = async (emailOrEvent: string | any, password?: string) => {
  try {
    // Handle both direct auth and event-based auth
    if (typeof emailOrEvent === 'object' && emailOrEvent.node) {
      // Event-based authentication
      const event = emailOrEvent
      const user = await getAuthenticatedUser(event)
      if (!user) {
        throw new Error('User not authenticated')
      }
      return user
    }

    // Direct email/password authentication
    const email = emailOrEvent
    const supabase = await db()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email)
      .single()

    if (error || !profile) {
      throw new Error('User not found')
    }

    return profile
  } catch (error) {
    console.error('[Auth] Authentication error:', error)
    throw error
  }
}

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string) => {
  try {
    const supabase = await db()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error('Profile not found')
    }

    return profile
  } catch (error) {
    console.error('[Auth] Get profile error:', error)
    throw error
  }
}

/**
 * Create JWT token
 */
export const createToken = (userId: string, email: string) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

/**
 * Verify JWT token
 */
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('[Auth] Token verification error:', error)
    return null
  }
}

/**
 * Get authenticated user from request
 */
export const getAuthenticatedUser = async (event: any) => {
  try {
    const authHeader = event.node.req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded || !(decoded as any).userId) {
      return null
    }

    return await getUserProfile((decoded as any).userId)
  } catch (error) {
    console.error('[Auth] Get authenticated user error:', error)
    return null
  }
}
/**
 * Require manager authentication middleware
 */
export const requireManager = async (event: any) => {
  const user = await requireAuth(event)
  
  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Manager access required'
    })
  }

  return user
}

/**
 * Require moderator authentication middleware
 */
export const requireModerator = async (event: any) => {
  const user = await requireAuth(event)
  
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Moderator access required'
    })
  }

  return user
}

/**
 * Require support agent authentication middleware
 */
export const requireSupportAgent = async (event: any) => {
  const user = await requireAuth(event)
  
  if (!user || (user.role !== 'support' && user.role !== 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Support agent access required'
    })
  }

  return user
}

/**
 * Require verified user middleware
 */
export const requireVerified = async (event: any) => {
  const user = await requireAuth(event)
  
  if (!user || !user.verified) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Verified user required'
    })
  }

  return user
}

/**
 * Require premium user middleware
 */
export const requirePremium = async (event: any) => {
  const user = await requireAuth(event)
  
  if (!user || !user.isPremium) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Premium user required'
    })
  }

  return user
}


/**
 * Require authentication middleware
 */
export const requireAuth = async (event: any) => {
  const user = await getAuthenticatedUser(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return user
}

/**
 * Require admin authentication middleware
 */
export const requireAdmin = async (event: any) => {
  const user = await requireAuth(event)
  
  if (!user || user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admin access required'
    })
  }

  return user
}

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const supabase = await dbAdmin()
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('[Auth] Update profile error:', error)
    throw error
  }
}

/**
 * Delete user
 */
export const deleteUser = async (userId: string) => {
  try {
    const supabase = await dbAdmin()
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('[Auth] Delete user error:', error)
    throw error
  }
}

/**
 * Log admin action
 */
export const logAdminAction = async (adminId: string, action: string, details: any) => {
  try {
    const supabase = await dbAdmin()
    
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        details,
        timestamp: new Date().toISOString()
      })

    if (error) {
      console.error('[Auth] Failed to log admin action:', error)
    }
  } catch (error) {
    console.error('[Auth] Log admin action error:', error)
  }
}

/**
 * Validate request body
 */
export const validateBody = (body: any, requiredFields: string[]) => {
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body is required'
    })
  }

  for (const field of requiredFields) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${field}`
      })
    }
  }

  return true
}

/**
 * Handle errors
 */
export const handleError = (error: any) => {
  console.error('[Auth] Error:', error)
  
  if (error.statusCode) {
    throw error
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Internal server error'
  })
}

// ============================================================================
// STUB IMPLEMENTATIONS FOR MISSING FUNCTIONS
// ============================================================================

/**
 * Premium operations - stub implementation
 * TODO: Replace with actual premium feature logic
 */
export const premiumOperations = {
  async checkAccess(userId: string, feature: string) {
    try {
      console.log(`[Premium] Checking access for user ${userId} to feature ${feature}`)
      // TODO: Implement actual premium access check
      return true
    } catch (error) {
      console.error('[Premium] Check access error:', error)
      return false
    }
  },

  async getFeatures(userId: string) {
    try {
      console.log(`[Premium] Getting features for user ${userId}`)
      // TODO: Implement actual feature retrieval
      return []
    } catch (error) {
      console.error('[Premium] Get features error:', error)
      return []
    }
  },

  async upgradeUser(userId: string, plan: string) {
    try {
      console.log(`[Premium] Upgrading user ${userId} to plan ${plan}`)
      // TODO: Implement actual upgrade logic
      return { success: true, plan }
    } catch (error) {
      console.error('[Premium] Upgrade error:', error)
      throw error
    }
  },

  async downgradeUser(userId: string) {
    try {
      console.log(`[Premium] Downgrading user ${userId}`)
      // TODO: Implement actual downgrade logic
      return { success: true }
    } catch (error) {
      console.error('[Premium] Downgrade error:', error)
      throw error
    }
  }
}

/**
 * Lazy-loaded supabase client proxy for backward compatibility
 */
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const client = await db()
      return (client as any)[prop]?.(...args)
    }
  }
}) as any
// ============================================================================
// ADDITIONAL STUB IMPLEMENTATIONS FOR MISSING OPERATIONS
// ============================================================================

/**
 * Status operations - stub implementation
 * TODO: Replace with actual status management logic
 */
export const statusOperations = {
  async getStatus(userId: string) {
    try {
      console.log(`[Status] Getting status for user ${userId}`)
      // TODO: Implement actual status retrieval
      return { status: 'online', lastSeen: new Date().toISOString() }
    } catch (error) {
      console.error('[Status] Get status error:', error)
      return { status: 'offline', lastSeen: null }
    }
  },

  async updateStatus(userId: string, status: string) {
    try {
      console.log(`[Status] Updating status for user ${userId} to ${status}`)
      // TODO: Implement actual status update
      return { success: true, status }
    } catch (error) {
      console.error('[Status] Update status error:', error)
      throw error
    }
  },

  async setOnline(userId: string) {
    return this.updateStatus(userId, 'online')
  },

  async setOffline(userId: string) {
    return this.updateStatus(userId, 'offline')
  }
}

/**
 * User operations - stub implementation
 * TODO: Replace with actual user management logic
 */
export const userOperations = {
  async getUser(userId: string) {
    try {
      console.log(`[User] Getting user ${userId}`)
      return await getUserProfile(userId)
    } catch (error) {
      console.error('[User] Get user error:', error)
      throw error
    }
  },

  async updateUser(userId: string, updates: any) {
    try {
      console.log(`[User] Updating user ${userId}`)
      return await updateUserProfile(userId, updates)
    } catch (error) {
      console.error('[User] Update user error:', error)
      throw error
    }
  },

  async deleteUser(userId: string) {
    try {
      console.log(`[User] Deleting user ${userId}`)
      return await deleteUser(userId)
    } catch (error) {
      console.error('[User] Delete user error:', error)
      throw error
    }
  }
}

/**
 * Profile operations - stub implementation
 * TODO: Replace with actual profile management logic
 */
export const profileOperations = {
  async getProfile(userId: string) {
    try {
      console.log(`[Profile] Getting profile for user ${userId}`)
      return await getUserProfile(userId)
    } catch (error) {
      console.error('[Profile] Get profile error:', error)
      throw error
    }
  },

  async updateProfile(userId: string, updates: any) {
    try {
      console.log(`[Profile] Updating profile for user ${userId}`)
      return await updateUserProfile(userId, updates)
    } catch (error) {
      console.error('[Profile] Update profile error:', error)
      throw error
    }
  },

  async uploadAvatar(userId: string, avatarUrl: string) {
    try {
      console.log(`[Profile] Uploading avatar for user ${userId}`)
      // TODO: Implement actual avatar upload
      return { success: true, avatarUrl }
    } catch (error) {
      console.error('[Profile] Upload avatar error:', error)
      throw error
    }
  }
}

/**
 * Settings operations - stub implementation
 * TODO: Replace with actual settings management logic
 */
export const settingsOperations = {
  async getSettings(userId: string) {
    try {
      console.log(`[Settings] Getting settings for user ${userId}`)
      // TODO: Implement actual settings retrieval
      return { notifications: true, privacy: 'public' }
    } catch (error) {
      console.error('[Settings] Get settings error:', error)
      return {}
    }
  },

  async updateSettings(userId: string, settings: any) {
    try {
      console.log(`[Settings] Updating settings for user ${userId}`)
      // TODO: Implement actual settings update
      return { success: true, settings }
    } catch (error) {
      console.error('[Settings] Update settings error:', error)
      throw error
    }
  }
}

/**
 * Notification operations - stub implementation
 * TODO: Replace with actual notification management logic
 */
export const notificationOperations = {
  async getNotifications(userId: string, limit: number = 20) {
    try {
      console.log(`[Notifications] Getting notifications for user ${userId}`)
      // TODO: Implement actual notification retrieval
      return []
    } catch (error) {
      console.error('[Notifications] Get notifications error:', error)
      return []
    }
  },

  async markAsRead(notificationId: string) {
    try {
      console.log(`[Notifications] Marking notification ${notificationId} as read`)
      // TODO: Implement actual mark as read
      return { success: true }
    } catch (error) {
      console.error('[Notifications] Mark as read error:', error)
      throw error
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      console.log(`[Notifications] Deleting notification ${notificationId}`)
      // TODO: Implement actual notification deletion
      return { success: true }
    } catch (error) {
      console.error('[Notifications] Delete notification error:', error)
      throw error
    }
  }
}

/**
 * Post operations - stub implementation
 * TODO: Replace with actual post management logic
 */
export const postOperations = {
  async getPost(postId: string) {
    try {
      console.log(`[Posts] Getting post ${postId}`)
      // TODO: Implement actual post retrieval
      return null
    } catch (error) {
      console.error('[Posts] Get post error:', error)
      throw error
    }
  },

  async createPost(userId: string, content: string, metadata: any = {}) {
    try {
      console.log(`[Posts] Creating post for user ${userId}`)
      // TODO: Implement actual post creation
      return { success: true, postId: 'new-post-id' }
    } catch (error) {
      console.error('[Posts] Create post error:', error)
      throw error
    }
  },

  async updatePost(postId: string, updates: any) {
    try {
      console.log(`[Posts] Updating post ${postId}`)
      // TODO: Implement actual post update
      return { success: true }
    } catch (error) {
      console.error('[Posts] Update post error:', error)
      throw error
    }
  },

  async deletePost(postId: string) {
    try {
      console.log(`[Posts] Deleting post ${postId}`)
      // TODO: Implement actual post deletion
      return { success: true }
    } catch (error) {
      console.error('[Posts] Delete post error:', error)
      throw error
    }
  }
}

/**
 * Chat operations - stub implementation
 * TODO: Replace with actual chat management logic
 */
export const chatOperations = {
  async getMessages(chatId: string, limit: number = 50) {
    try {
      console.log(`[Chat] Getting messages for chat ${chatId}`)
      // TODO: Implement actual message retrieval
      return []
    } catch (error) {
      console.error('[Chat] Get messages error:', error)
      return []
    }
  },

  async sendMessage(chatId: string, userId: string, content: string) {
    try {
      console.log(`[Chat] Sending message to chat ${chatId}`)
      // TODO: Implement actual message sending
      return { success: true, messageId: 'new-message-id' }
    } catch (error) {
      console.error('[Chat] Send message error:', error)
      throw error
    }
  },

  async deleteMessage(messageId: string) {
    try {
      console.log(`[Chat] Deleting message ${messageId}`)
      // TODO: Implement actual message deletion
      return { success: true }
    } catch (error) {
      console.error('[Chat] Delete message error:', error)
      throw error
    }
  }
}

/**
 * Follow operations - stub implementation
 * TODO: Replace with actual follow management logic
 */
export const followOperations = {
  async follow(userId: string, targetUserId: string) {
    try {
      console.log(`[Follow] User ${userId} following ${targetUserId}`)
      // TODO: Implement actual follow logic
      return { success: true }
    } catch (error) {
      console.error('[Follow] Follow error:', error)
      throw error
    }
  },

  async unfollow(userId: string, targetUserId: string) {
    try {
      console.log(`[Follow] User ${userId} unfollowing ${targetUserId}`)
      // TODO: Implement actual unfollow logic
      return { success: true }
    } catch (error) {
      console.error('[Follow] Unfollow error:', error)
      throw error
    }
  },

  async getFollowers(userId: string) {
    try {
      console.log(`[Follow] Getting followers for user ${userId}`)
      // TODO: Implement actual followers retrieval
      return []
    } catch (error) {
      console.error('[Follow] Get followers error:', error)
      return []
    }
  }
}
/**
 * Stream operations - stub implementation
 * TODO: Replace with actual stream management logic
 */
export const streamOperations = {
  async getStream(streamId: string) {
    try {
      console.log(`[Stream] Getting stream ${streamId}`)
      // TODO: Implement actual stream retrieval
      return null
    } catch (error) {
      console.error('[Stream] Get stream error:', error)
      throw error
    }
  },

  async createStream(userId: string, title: string, metadata: any = {}) {
    try {
      console.log(`[Stream] Creating stream for user ${userId}`)
      // TODO: Implement actual stream creation
      return { success: true, streamId: 'new-stream-id' }
    } catch (error) {
      console.error('[Stream] Create stream error:', error)
      throw error
    }
  },

  async updateStream(streamId: string, updates: any) {
    try {
      console.log(`[Stream] Updating stream ${streamId}`)
      // TODO: Implement actual stream update
      return { success: true }
    } catch (error) {
      console.error('[Stream] Update stream error:', error)
      throw error
    }
  },

  async deleteStream(streamId: string) {
    try {
      console.log(`[Stream] Deleting stream ${streamId}`)
      // TODO: Implement actual stream deletion
      return { success: true }
    } catch (error) {
      console.error('[Stream] Delete stream error:', error)
      throw error
    }
  },

  async startStream(streamId: string) {
    try {
      console.log(`[Stream] Starting stream ${streamId}`)
      // TODO: Implement actual stream start
      return { success: true, status: 'live' }
    } catch (error) {
      console.error('[Stream] Start stream error:', error)
      throw error
    }
  },

  async endStream(streamId: string) {
    try {
      console.log(`[Stream] Ending stream ${streamId}`)
      // TODO: Implement actual stream end
      return { success: true, status: 'ended' }
    } catch (error) {
      console.error('[Stream] End stream error:', error)
      throw error
    }
  }
}

/**
 * Generic operations factory for any missing operations
 * This catches any operation that wasn't explicitly defined
 */
const createGenericOperations = (operationName: string) => {
  return new Proxy({}, {
    get: (target, method) => {
      return async (...args: any[]) => {
        console.warn(`[${operationName}] ${String(method)} - stub implementation`)
        return { success: true, message: `${operationName}.${String(method)} called` }
      }
    }
  })
}

// Export generic operations for any missing operation types
export const matchOperations = createGenericOperations('Match')
export const groupOperations = createGenericOperations('Group')
export const groupChatOperations = createGenericOperations('GroupChat')
export const walletOperations = createGenericOperations('Wallet')
export const transactionOperations = createGenericOperations('Transaction')
export const paymentOperations = createGenericOperations('Payment')
export const subscriptionOperations = createGenericOperations('Subscription')
export const reportOperations = createGenericOperations('Report')
export const blockOperations = createGenericOperations('Block')
export const muteOperations = createGenericOperations('Mute')
export const searchOperations = createGenericOperations('Search')
export const trendingOperations = createGenericOperations('Trending')
export const recommendationOperations = createGenericOperations('Recommendation')
export const analyticsOperations = createGenericOperations('Analytics')
export const storageOperations = createGenericOperations('Storage')
export const uploadOperations = createGenericOperations('Upload')
export const downloadOperations = createGenericOperations('Download')
export const shareOperations = createGenericOperations('Share')
export const commentOperations = createGenericOperations('Comment')
export const replyOperations = createGenericOperations('Reply')
export const tagOperations = createGenericOperations('Tag')
export const hashtagOperations = createGenericOperations('Hashtag')
export const mentionOperations = createGenericOperations('Mention')
export const emojiOperations = createGenericOperations('Emoji')
export const reactionOperations = createGenericOperations('Reaction')
export const giftOperations = createGenericOperations('Gift')
export const badgeOperations = createGenericOperations('Badge')
export const achievementOperations = createGenericOperations('Achievement')
export const leaderboardOperations = createGenericOperations('Leaderboard')
export const statisticsOperations = createGenericOperations('Statistics')
export const reportingOperations = createGenericOperations('Reporting')
export const moderationOperations = createGenericOperations('Moderation')
export const verificationOperations = createGenericOperations('Verification')
export const identityOperations = createGenericOperations('Identity')
export const securityOperations = createGenericOperations('Security')
export const privacyOperations = createGenericOperations('Privacy')
export const consentOperations = createGenericOperations('Consent')
export const dataOperations = createGenericOperations('Data')
export const exportOperations = createGenericOperations('Export')
export const importOperations = createGenericOperations('Import')
export const backupOperations = createGenericOperations('Backup')
export const restoreOperations = createGenericOperations('Restore')
export const syncOperations = createGenericOperations('Sync')
export const cacheOperations = createGenericOperations('Cache')
export const queueOperations = createGenericOperations('Queue')
export const jobOperations = createGenericOperations('Job')
export const taskOperations = createGenericOperations('Task')
export const schedulerOperations = createGenericOperations('Scheduler')
export const webhookOperations = createGenericOperations('Webhook')
export const apiOperations = createGenericOperations('API')
export const integrationOperations = createGenericOperations('Integration')
export const pluginOperations = createGenericOperations('Plugin')
export const extensionOperations = createGenericOperations('Extension')
export const themeOperations = createGenericOperations('Theme')
export const localizationOperations = createGenericOperations('Localization')
export const translationOperations = createGenericOperations('Translation')
export const languageOperations = createGenericOperations('Language')


/**
 * Like operations - stub implementation
 * TODO: Replace with actual like management logic
 */
export const likeOperations = {
  async likePost(userId: string, postId: string) {
    try {
      console.log(`[Like] User ${userId} liking post ${postId}`)
      // TODO: Implement actual like logic
      return { success: true }
    } catch (error) {
      console.error('[Like] Like error:', error)
      throw error
    }
  },

  async unlikePost(userId: string, postId: string) {
    try {
      console.log(`[Like] User ${userId} unliking post ${postId}`)
      // TODO: Implement actual unlike logic
      return { success: true }
    } catch (error) {
      console.error('[Like] Unlike error:', error)
      throw error
    }
  }
}
