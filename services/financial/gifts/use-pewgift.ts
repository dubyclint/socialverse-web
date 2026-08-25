import { computed, ref } from 'vue'
import type { Ref } from 'vue'

export type GiftTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

export interface PewGiftType {
  id: string
  name: string
  cost_credits: number
  tier: GiftTier
  icon_url: string | null
  /** 'light' for gifts under 5 PEW, 'fullscreen' for 5 PEW and above. */
  animation: 'light' | 'fullscreen'
}

export interface PewGiftBalance {
  balance: number
  lockedBalance: number
  isLocked: boolean
  totalBalance: number
}

export interface PewGiftTransaction {
  id: string
  sender_id: string
  recipient_id: string
  gift_id: string
  gift_name: string
  quantity: number
  total_cost: number
  created_at: string
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
}

interface SendReceipt {
  newBalance: number
  transactionId?: string
  totalCost?: number
}

const TIER_ORDER: GiftTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']

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

  const normalise = (row: Partial<PewGiftType>): PewGiftType => {
    const cost = Number(row.cost_credits ?? 0)
    return {
      id: String(row.id),
      name: row.name ?? 'Gift',
      cost_credits: cost,
      tier: (row.tier as GiftTier) ?? 'BRONZE',
      icon_url: row.icon_url ?? null,
      animation: row.animation ?? (cost >= 5 ? 'fullscreen' : 'light')
    }
  }

  const loadGiftTypes = async (tier?: GiftTier) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<ApiEnvelope<PewGiftType[]>>('/api/pewgift/types', {
        query: tier ? { tier } : {}
      })
      giftTypes.value = (response.data ?? []).map(normalise)
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to load gift types'
      giftTypes.value = []
    } finally {
      loading.value = false
    }
  }

  const loadBalance = async () => {
    try {
      const response = await $fetch<ApiEnvelope<PewGiftBalance>>('/api/pewgift/balance')
      balance.value = response.data ?? null
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to load balance'
    }
  }

  const totalCost = computed(() =>
    selectedGift.value ? selectedGift.value.cost_credits * quantity.value : 0
  )

  const canAffordGift = computed(() => {
    if (!selectedGift.value || !balance.value) return false
    return balance.value.balance >= totalCost.value
  })

  const resetForm = () => {
    selectedGift.value = null
    quantity.value = 1
    message.value = ''
    isAnonymous.value = false
  }

  const clearMessages = () => {
    error.value = null
    success.value = null
  }

  const send = async (url: string, body: Record<string, unknown>, okMessage: string) => {
    if (!selectedGift.value) {
      error.value = 'Please select a gift'
      return false
    }
    if (!canAffordGift.value) {
      error.value = 'Insufficient balance'
      return false
    }

    loading.value = true
    error.value = null
    success.value = null

    try {
      const response = await $fetch<ApiEnvelope<SendReceipt>>(url, {
        method: 'POST',
        body: {
          giftTypeId: selectedGift.value.id,
          quantity: quantity.value,
          message: message.value || undefined,
          isAnonymous: isAnonymous.value,
          ...body
        }
      })

      if (balance.value && typeof response.data?.newBalance === 'number') {
        balance.value.balance = response.data.newBalance
        balance.value.totalBalance = response.data.newBalance + balance.value.lockedBalance
      }

      success.value = okMessage
      resetForm()
      return true
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to send gift'
      return false
    } finally {
      loading.value = false
    }
  }

  const sendGiftToPost = (postId: string, recipientId: string) =>
    send('/api/pewgift/send-to-posts', { postId, recipientId, targetType: 'post' }, 'Gift sent!')

  const sendGiftToComment = (commentId: string, recipientId: string, postId: string) =>
    send(
      '/api/pewgift/send',
      { commentId, recipientId, postId, targetType: 'comment' },
      'Gift sent to comment!'
    )

  const sendGiftToStream = (streamId: string, streamerId: string) =>
    send(
      '/api/pewgift/send-to-stream',
      { streamId, streamerId, targetType: 'stream' },
      'Gift sent to streamer!'
    )

  const sendGiftToChat = (chatId: string, recipientId: string) =>
    send('/api/pewgift/send-to-chat', { chatId, recipientId, targetType: 'chat' }, 'Gift sent!')

  const loadTransactionHistory = async (limit = 20, offset = 0) => {
    try {
      const response = await $fetch<ApiEnvelope<PewGiftTransaction[]>>('/api/pewgift/history', {
        query: { limit, offset }
      })
      transactions.value = response.data ?? []
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to load history'
    }
  }

  const tiers = computed(() =>
    TIER_ORDER.filter((tier) => giftTypes.value.some((gift) => gift.tier === tier))
  )

  const getGiftsByTier = (tier: GiftTier) =>
    giftTypes.value.filter((gift) => gift.tier === tier)

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
    tiers,
    getGiftsByTier,
    canAffordGift,
    totalCost,
    resetForm,
    clearMessages
  }
}
