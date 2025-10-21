// composables/usePremium.js - 
import { ref, computed, readonly } from 'vue'

export const usePremium = () => {
  const subscription = ref(null)
  const features = ref([])
  const restrictions = ref([])
  const loading = ref(false)
  const error = ref(null)

  const currentTier = computed(() => subscription.value?.subscription_type || 'FREE')
  const isActive = computed(() => subscription.value?.status === 'ACTIVE')
  const isPremium = computed(() => ['BASIC', 'PREMIUM', 'VIP'].includes(currentTier.value))

  /**
   * Load user's premium status
   */
  const loadPremiumStatus = async () => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/premium/status')

      if (result.success) {
        subscription.value = result.data.subscription
        features.value = result.data.features
        restrictions.value = result.data.restrictions
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      error.value = err.message
      console.error('Error loading premium status:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if user has access to a feature
   */
  const hasFeature = (featureKey) => {
    return features.value.some(feature => feature.feature_key === featureKey)
  }

  /**
   * Check if user has a specific restriction
   */
  const hasRestriction = (restrictionType) => {
    return restrictions.value.some(restriction => restriction.restriction_type === restrictionType)
  }

  /**
   * Get restriction value
   */
  const getRestrictionValue = (restrictionType) => {
    const restriction = restrictions.value.find(r => r.restriction_type === restrictionType)
    return restriction?.restriction_value || null
  }

  /**
   * Get pricing tiers
   */
  const getPricingTiers = async () => {
    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/premium/pricing')
      if (result.success) {
        return result.data
      }
      throw new Error(result.message)
    } catch (err) {
      console.error('Error fetching pricing:', err)
      throw err
    }
  }

  /**
   * Check feature access
   */
  const checkFeatureAccess = async (featureKey) => {
    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/premium/check-feature', {
        method: 'POST',
        body: { featureKey }
      })
      return result.data
    } catch (err) {
      console.error('Error checking feature access:', err)
      return false
    }
  }

  /**
   * Upgrade subscription
   */
  const upgradeSubscription = async (tier, paymentMethod) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/premium/upgrade', {
        method: 'POST',
        body: { tier, paymentMethod }
      })

      if (result.success) {
        subscription.value = result.data.subscription
        features.value = result.data.features
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Cancel subscription
   */
  const cancelSubscription = async (reason) => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/premium/cancel', {
        method: 'POST',
        body: { reason }
      })

      if (result.success) {
        subscription.value = result.data.subscription
        await loadPremiumStatus()
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get tier display info
   */
  const getTierInfo = (tier) => {
    const tierInfo = {
      FREE: { name: 'Free', color: 'gray', icon: 'fas fa-user' },
      BASIC: { name: 'Basic', color: 'blue', icon: 'fas fa-star' },
      PREMIUM: { name: 'Premium', color: 'purple', icon: 'fas fa-crown' },
      VIP: { name: 'VIP', color: 'gold', icon: 'fas fa-gem' }
    }
    return tierInfo[tier] || tierInfo.FREE
  }

  /**
   * Check if upgrade is available
   */
  const canUpgradeTo = (targetTier) => {
    const hierarchy = { FREE: 0, BASIC: 1, PREMIUM: 2, VIP: 3 }
    return hierarchy[targetTier] > hierarchy[currentTier.value]
  }

  /**
   * Get daily usage limits
   */
  const getDailyLimits = () => {
    const dailyLimitRestriction = getRestrictionValue('DAILY_LIMIT')
    return dailyLimitRestriction || {}
  }

  return {
    // State (readonly)
    subscription: readonly(subscription),
    features: readonly(features),
    restrictions: readonly(restrictions),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    currentTier,
    isActive,
    isPremium,
    
    // Methods
    loadPremiumStatus,
    hasFeature,
    hasRestriction,
    getRestrictionValue,
    getPricingTiers,
    checkFeatureAccess,
    upgradeSubscription,
    cancelSubscription,
    getTierInfo,
    canUpgradeTo,
    getDailyLimits
  }
}
