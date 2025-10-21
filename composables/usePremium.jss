// composables/usePremium.js - FIXED
import { ref, computed } from 'vue'

export const usePremium = () => {
  const subscription = ref(null)
  const features = ref([])
  const restrictions = ref([])
  const loading = ref(false)
  const error = ref(null)
  const api = useApi()

  const currentTier = computed(() => subscription.value?.subscription_type || 'FREE')
  const isActive = computed(() => subscription.value?.status === 'ACTIVE')
  const isPremium = computed(() => ['BASIC', 'PREMIUM', 'VIP'].includes(currentTier.value))

  const loadPremiumStatus = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await api.premium.getSubscription()
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

  const getPricingTiers = async () => {
    try {
      const result = await api.premium.getPricing()
      if (result.success) {
        return result.data
      }
      throw new Error(result.message)
    } catch (err) {
      console.error('Error fetching pricing:', err)
      throw err
    }
  }

  const checkFeatureAccess = async (featureKey) => {
    try {
      const result = await api.premium.checkFeature(featureKey)
      return result.data
    } catch (err) {
      console.error('Error checking feature access:', err)
      return false
    }
  }

  return {
    subscription,
    features,
    restrictions,
    loading,
    error,
    currentTier,
    isActive,
    isPremium,
    loadPremiumStatus,
    getPricingTiers,
    checkFeatureAccess
  }
}
