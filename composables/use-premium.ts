// ============================================================================
// FILE: /composables/use-premium.ts
// Description: Premium subscription management composable for billing, features, and gating
// ============================================================================
import { ref, computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { ApiResponse } from '~/types/api'

interface PremiumStatusData {
  subscription: Subscription
  features: Feature[]
  restrictions: Restriction[]
}

type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP'
type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED'

interface Subscription {
  subscription_type: SubscriptionTier
  status: SubscriptionStatus
  start_date: string
  end_date: string
  renewal_date: string
  auto_renew: boolean
}

interface Feature {
  feature_key: string
  feature_name: string
  description: string
  enabled: boolean
}

interface Restriction {
  restriction_type: string
  restriction_value: number | string | boolean
  description: string
}

interface PricingTier {
  tier: SubscriptionTier
  price: number
  currency: string
  billing_period: string
  features: string[]
}

interface PremiumReturn {
  subscription: Ref<Subscription | null>
  features: Ref<readonly Feature[]>
  restrictions: Ref<readonly Restriction[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  currentTier: ComputedRef<SubscriptionTier>
  isActive: ComputedRef<boolean>
  isPremium: ComputedRef<boolean>
  loadPremiumStatus: () => Promise<void>
  hasFeature: (featureKey: string) => boolean
  hasRestriction: (restrictionType: string) => boolean
  getRestrictionValue: (restrictionType: string) => number | string | boolean | null
  getPricingTiers: () => Promise<PricingTier[]>
  upgradeToPremium: (tier: SubscriptionTier) => Promise<any>
  cancelSubscription: () => Promise<any>
}

export const usePremium = (): PremiumReturn => {
  const subscription = ref<Subscription | null>(null)
  const features = ref<Feature[]>([])
  const restrictions = ref<Restriction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const currentTier = computed(() => subscription.value?.subscription_type || 'FREE')
  const isActive = computed(() => subscription.value?.status === 'ACTIVE')
  const isPremium = computed(() => ['BASIC', 'PREMIUM', 'VIP'].includes(currentTier.value))

  /**
   * Sync active entitilements and premium payload parameters from back-office engines
   */
  const loadPremiumStatus = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<ApiResponse<PremiumStatusData>>('/api/premium/status')

      if (result.success && result.data) {
        subscription.value = result.data.subscription
        features.value = result.data.features
        restrictions.value = result.data.restrictions
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message
      console.error('[usePremium] Error loading premium status:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if a specific feature key is mapped and enabled
   */
  const hasFeature = (featureKey: string): boolean => {
    return features.value.some(feature => feature.feature_key === featureKey && feature.enabled !== false)
  }

  /**
   * Check if an exact operational limitation threshold exists
   */
  const hasRestriction = (restrictionType: string): boolean => {
    return restrictions.value.some(restriction => restriction.restriction_type === restrictionType)
  }

  /**
   * Grab raw value thresholds associated with system constraints
   */
  const getRestrictionValue = (restrictionType: string): number | string | boolean | null => {
    const restriction = restrictions.value.find(r => r.restriction_type === restrictionType)
    return restriction ? restriction.restriction_value : null
  }

  /**
   * Fetch complete pricing configuration matrices
   */
  const getPricingTiers = async (): Promise<PricingTier[]> => {
    try {
      const result = await $fetch<ApiResponse<PricingTier[]>>('/api/premium/pricing')
      if (result.success && result.data) {
        return result.data
      }
      throw new Error(result.message)
    } catch (err: any) {
      error.value = err.message
      console.error('[usePremium] Error fetching pricing tiers:', err)
      return []
    }
  }

  /**
   * Submit transaction modifications to alter tier profiles
   */
  const upgradeToPremium = async (tier: SubscriptionTier): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<ApiResponse<null>>('/api/premium/upgrade', {
        method: 'POST',
        body: { tier }
      })

      if (result.success) {
        await loadPremiumStatus()
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Revoke continuous payment profile auto-renew mechanisms
   */
  const cancelSubscription = async (): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<ApiResponse<null>>('/api/premium/cancel', {
        method: 'POST'
      })

      if (result.success) {
        await loadPremiumStatus()
        return result
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    subscription: readonly(subscription),
    features: readonly(features),
    restrictions: readonly(restrictions),
    loading: readonly(loading),
    error: readonly(error),
    currentTier,
    isActive,
    isPremium,
    loadPremiumStatus,
    hasFeature,
    hasRestriction,
    getRestrictionValue,
    getPricingTiers,
    upgradeToPremium,
    cancelSubscription
  }
}
