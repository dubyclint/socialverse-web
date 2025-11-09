// composables/usePewGift.ts
// ============================================================================
// PEWGIFT COMPOSABLE
// ============================================================================

import { ref, computed } from 'vue'

export interface PewGiftType {
  id: string
  name: string
  emoji: string
  price_in_credits: number
  rarity: string
  category: string
  image_url?: string
}

export interface PewGiftBalance {
  balance: number
  lifetime_earned: number
  lifetime_spent: number
}

export const usePewGift = () => {
  const giftTypes = ref<PewGiftType[]>([])
  const balance = ref<PewGiftBalance | null>(null)
  const loading = ref(false)
  const selectedGift = ref<PewGiftType | null>(null)
  const quantity = ref(1)
  const message = ref('')
  const isAnonymous = ref(false)

  /**
   * Load available gifts
   */
  const loadGiftTypes = async (category?: string) => {
    loading.value = true
    try {
      const response = await $fetch<any>('/api/pewgift/types', {
        query: category ? { category } : {}
      })

      if (response.success) {
        giftTypes.value = response.data
      }
    } catch (error) {
      console.error('Load gift types error:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * Load user balance
   */
  const loadBalance = async () => {
    try {
      const response = await $fetch<any>('/api/pewgift/balance')

      if (response.success) {
        balance.value = response.data
      }
    } catch (error) {
      console.error('Load balance error:', error)
    }
  }

  /**
   * Send gift to post
   */
  const sendGiftToPost = async (postId: string) => {
    if (!selectedGift.value) return false

    try {
      const response = await $fetch<any>('/api/pewgift/send-to-post', {
        method: 'POST',
        body: {
          postId,
          giftTypeId: selectedGift.value.id,
          quantity: quantity.value,
          message: message.value || undefined,
          isAnonymous: isAnonymous.value
        }
      })

      if (response.success) {
        // Update balance
        if (balance.value) {
          balance.value.balance = response.data.newBalance
          balance.value.lifetime_spent += selectedGift.value.price_in_credits * quantity.value
        }

        // Reset form
        selectedGift.value = null
        quantity.value = 1
        message.value = ''
        isAnonymous.value = false

        return true
      }
    } catch (error) {
      console.error('Send gift error:', error)
    }

    return false
  }

  /**
   * Get gift categories
   */
  const categories = computed(() => {
    const cats = new Set(giftTypes.value.map(g => g.category))
    return Array.from(cats)
  })

  /**
   * Get gifts by category
   */
  const getGiftsByCategory = (category: string) => {
    return giftTypes.value.filter(g => g.category === category)
  }

  /**
   * Can afford gift
   */
  const canAffordGift = computed(() => {
    if (!selectedGift.value || !balance.value) return false
    return balance.value.balance >= selectedGift.value.price_in_credits * quantity.value
  })

  /**
   * Total cost
   */
  const totalCost = computed(() => {
    if (!selectedGift.value) return 0
    return selectedGift.value.price_in_credits * quantity.value
  })

  return {
    giftTypes,
    balance,
    loading,
    selectedGift,
    quantity,
    message,
    isAnonymous,
    categories,
    loadGiftTypes,
    loadBalance,
    sendGiftToPost,
    getGiftsByCategory,
    canAffordGift,
    totalCost
  }
            }
      
