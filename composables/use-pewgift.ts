 //composables/use-pewgift.ts - COMPLETE FIXED VERSION
// ============================================================================
// PEWGIFT COMPOSABLE - FULLY FUNCTIONAL
// ============================================================================

import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'

export interface PewGiftType {
  id: string
  name: string
  emoji: string
  price_in_credits: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: string
  image_url?: string
  animation_url?: string
  description?: string
}

export interface PewGiftBalance {
  balance: number
  locked_balance: number
  lifetime_earned: number
  lifetime_spent: number
  last_updated: string
}

export interface PewGiftTransaction {
  id: string
  sender_id: string
  recipient_id: string
  gift_id: string
  amount: number
  target_type: 'post' | 'comment' | 'stream' | 'chat' | 'message'
  target_id: string
  quantity: number
  message?: string
  is_anonymous: boolean
  created_at: string
  status: 'pending' | 'completed' | 'failed'
}

export const usePewGift = () => {
  const giftTypes: Ref<PewGiftType[]> = ref([])
  const balance: Ref<PewGiftBalance | null> = ref(null)
  const loading = ref(false)
  const selectedGift: Ref<PewGiftType | null> = ref(null)
  const quantity = ref(1)
  const message = ref('')
  const isAnonymous = ref(false)
  const error: Ref<string | null> = ref(null)
  const success: Ref<string | null> = ref(null)
  const transactions: Ref<PewGiftTransaction[]> = ref([])

  // Load available gifts
  const loadGiftTypes = async (category?: string) => {
    loading.value = true
    error.value = null
    try {
      const query = category ? { category } : {}
      const response = await $fetch<any>('/api/pewgift/types', { query })

      if (response.success) {
        giftTypes.value = response.data || []
      } else {
        throw new Error(response.message || 'Failed to load gifts')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load gift types'
      console.error('Load gift types error:', err)
    } finally {
      loading.value = false
    }
  }

  // Load user balance
  const loadBalance = async (userId?: string) => {
    try {
      const query = userId ? { userId } : {}
      const response = await $fetch<any>('/api/pewgift/balance', { query })

      if (response.success) {
        balance.value = response.data
      } else {
        throw new Error(response.message || 'Failed to load balance')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load balance'
      console.error('Load balance error:', err)
    }
  }

  // Send gift to post
  const sendGiftToPost = async (postId: string, recipientId: string) => {
    if (!selectedGift.value) {
      error.value = 'Please select a gift'
      return false
    }

    if (!balance.value || balance.value.balance < selectedGift.value.price_in_credits * quantity.value) {
      error.value = 'Insufficient balance'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const response = await $fetch<any>('/api/pewgift/send-to-posts', {
        method: 'POST',
        body: {
          postId,
          recipientId,
          giftTypeId: selectedGift.value.id,
          quantity: quantity.value,
          message: message.value || undefined,
          isAnonymous: isAnonymous.value,
          targetType: 'post'
        }
      })

      if (response.success) {
        // Update balance
        if (balance.value) {
          balance.value.balance = response.data.newBalance
          balance.value.lifetime_spent += selectedGift.value.price_in_credits * quantity.value
        }

        success.value = 'Gift sent successfully!'
        resetForm()
        return true
      } else {
        throw new Error(response.message || 'Failed to send gift')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to send gift'
      console.error('Send gift error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Send gift to comment
  const sendGiftToComment = async (commentId: string, recipientId: string, postId: string) => {
    if (!selectedGift.value) {
      error.value = 'Please select a gift'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const response = await $fetch<any>('/api/pewgift/send', {
        method: 'POST',
        body: {
          commentId,
          recipientId,
          postId,
          giftTypeId: selectedGift.value.id,
          quantity: quantity.value,
          message: message.value || undefined,
          isAnonymous: isAnonymous.value,
          targetType: 'comment'
        }
      })

      if (response.success) {
        if (balance.value) {
          balance.value.balance = response.data.newBalance
          balance.value.lifetime_spent += selectedGift.value.price_in_credits * quantity.value
        }

        success.value = 'Gift sent to comment!'
        resetForm()
        return true
      } else {
        throw new Error(response.message || 'Failed to send gift')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to send gift'
      console.error('Send gift to comment error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Send gift to stream
  const sendGiftToStream = async (streamId: string, streamerId: string) => {
    if (!selectedGift.value) {
      error.value = 'Please select a gift'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const response = await $fetch<any>('/api/pewgift/send-to-stream', {
        method: 'POST',
        body: {
          streamId,
          streamerId,
          giftTypeId: selectedGift.value.id,
          quantity: quantity.value,
          message: message.value || undefined,
          isAnonymous: isAnonymous.value,
          targetType: 'stream'
        }
      })

      if (response.success) {
        if (balance.value) {
          balance.value.balance = response.data.newBalance
          balance.value.lifetime_spent += selectedGift.value.price_in_credits * quantity.value
        }

        success.value = 'Gift sent to streamer!'
        resetForm()
        return true
      } else {
        throw new Error(response.message || 'Failed to send gift')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to send gift'
      console.error('Send gift to stream error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Send gift to chat
  const sendGiftToChat = async (chatId: string, recipientId: string) => {
    if (!selectedGift.value) {
      error.value = 'Please select a gift'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const response = await $fetch<any>('/api/pewgift/send-to-chat', {
        method: 'POST',
        body: {
          chatId,
          recipientId,
          giftTypeId: selectedGift.value.id,
          quantity: quantity.value,
          message: message.value || undefined,
          isAnonymous: isAnonymous.value,
          targetType: 'chat'
        }
      })

      if (response.success) {
        if (balance.value) {
          balance.value.balance = response.data.newBalance
          balance.value.lifetime_spent += selectedGift.value.price_in_credits * quantity.value
        }

        success.value = 'Gift sent to chat!'
        resetForm()
        return true
      } else {
        throw new Error(response.message || 'Failed to send gift')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to send gift'
      console.error('Send gift to chat error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Load transaction history
  const loadTransactionHistory = async (userId?: string, limit = 20, offset = 0) => {
    try {
      const query = { limit, offset, ...(userId && { userId }) }
      const response = await $fetch<any>('/api/pewgift/history', { query })

      if (response.success) {
        transactions.value = response.data || []
      } else {
        throw new Error(response.message || 'Failed to load history')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to load transaction history'
      console.error('Load history error:', err)
    }
  }

  // Get categories
  const categories = computed(() => {
    const cats = new Set(giftTypes.value.map(g => g.category))
    return Array.from(cats).sort()
  })

  // Get gifts by category
  const getGiftsByCategory = (category: string) => {
    return giftTypes.value.filter(g => g.category === category)
  }

  // Can afford gift
  const canAffordGift = computed(() => {
    if (!selectedGift.value || !balance.value) return false
    const totalCost = selectedGift.value.price_in_credits * quantity.value
    return balance.value.balance >= totalCost
  })

  // Total cost
  const totalCost = computed(() => {
    if (!selectedGift.value) return 0
    return selectedGift.value.price_in_credits * quantity.value
  })

  // Reset form
  const resetForm = () => {
    selectedGift.value = null
    quantity.value = 1
    message.value = ''
    isAnonymous.value = false
  }

  // Clear messages
  const clearMessages = () => {
    error.value = null
    success.value = null
  }

  return {
    giftTypes,
    balance,
    loading,
    selectedGift,
    quantity,
    message,
    isAnonymous,
    error,
    success,
    transactions,
    loadGiftTypes,
    loadBalance,
    sendGiftToPost,
    sendGiftToComment,
    sendGiftToStream,
    sendGiftToChat,
    loadTransactionHistory,
    categories,
    getGiftsByCategory,
    canAffordGift,
    totalCost,
    resetForm,
    clearMessages
  }
}
