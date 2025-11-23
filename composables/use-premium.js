// composables/use-premium.ts
import { ref, computed, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'

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
  features: Ref<Feature[]>
  restrictions: Ref<Restriction[]>
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

  const loadPremiumStatus = async (): Promise<void> => {
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
    } catch (err: any) {
      error.value = err.message
      console.error('Error loading premium status:', err)
    } finally {
      loading.value = false
    }
  }

  const hasFeature = (featureKey: string): boolean => {
    return features.value.some(feature => feature.feature_key === featureKey)
  }

  const hasRestriction = (restrictionType: string): boolean => {
    return restrictions.value.some(restriction => restriction.restriction_type === restrictionType)
  }

  const getRestrictionValue = (restrictionType: string): number | string | boolean | null => {
    const restriction = restrictions.value.find(r => r.restriction_type === restrictionType)
    return restriction?.restriction_value || null
  }

  const getPricingTiers = async (): Promise<PricingTier[]> => {
    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/premium/pricing')
      if (result.success) {
        return result.data
      }
      throw new Error(result.message)
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching pricing tiers:', err)
      return []
    }
  }

  const upgradeToPremium = async (tier: SubscriptionTier): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/premium/upgrade', {
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

  const cancelSubscription = async (): Promise<any> => {
    loading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/premium/cancel', {
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
