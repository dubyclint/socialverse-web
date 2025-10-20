// server/routes/premiumRoutes.js
// Nuxt 3 Consolidated Route Handler - Premium Subscription Management
import { PremiumController } from '../api/controllers/premiumController'
import { authenticateUser } from '../api/middleware/auth'
import { requireSubscriptionTier, addPremiumContext } from '../api/middleware/premiumMiddleware'

export default defineEventHandler(async (event) => {
  const { method } = event
  const path = event.node.req.url?.split('?')[0] || ''

  // Extract tier from path
  const tierMatch = path.match(/\/premium\/features\/([^/]+)/)
  const tier = tierMatch?.[1]

  // Extract feature key from path
  const featureMatch = path.match(/\/premium\/check\/([^/]+)/)
  const featureKey = featureMatch?.[1]

  try {
    // Apply authentication middleware to all routes
    await authenticateUser(event)

    // Add premium context to all requests
    await addPremiumContext(event)

    // Public premium routes
    if (method === 'GET' && path.endsWith('/premium/pricing')) {
      return await PremiumController.getPricing(event)
    }

    if (method === 'GET' && path.includes('/premium/features')) {
      return await PremiumController.getFeatures(event, tier)
    }

    // User subscription management
    if (method === 'GET' && path.endsWith('/premium/status')) {
      return await PremiumController.getSubscriptionStatus(event)
    }

    if (method === 'POST' && path.endsWith('/premium/upgrade')) {
      return await PremiumController.upgradeSubscription(event)
    }

    if (method === 'POST' && path.endsWith('/premium/cancel')) {
      return await PremiumController.cancelSubscription(event)
    }

    if (method === 'GET' && featureKey) {
      return await PremiumController.checkFeatureAccess(event, featureKey)
    }

    // Admin routes
    if (method === 'GET' && path.includes('/premium/admin/subscriptions')) {
      await requireSubscriptionTier('VIP')(event)
      return await PremiumController.getAdminSubscriptions(event)
    }

    throw createError({
      statusCode: 404,
      message: 'Route not found'
    })
  } catch (error) {
    console.error('Premium Route Error:', error)
    throw error
  }
})
