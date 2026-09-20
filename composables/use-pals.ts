import { ref } from 'vue'

export interface PalProfile {
  id: string
  username: string | null
  name: string
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  last_seen: string | null
}

export interface PalSuggestion extends PalProfile {
  reasons: string[]
  mutuals: number
  fromContacts: boolean
}

export interface PalRequest {
  requestId: string
  createdAt: string
  user: PalProfile | null
}

/** Client access to the PAL (friend) lifecycle: list, requests, suggestions, blocks. */
export const usePals = () => {
  const pals = ref<PalProfile[]>([])
  const incoming = ref<PalRequest[]>([])
  const outgoing = ref<PalRequest[]>([])
  const suggestions = ref<PalSuggestion[]>([])
  const blocked = ref<PalProfile[]>([])
  const loading = ref(false)
  const error = ref('')

  const loadPals = async (): Promise<void> => {
    const response = await $fetch<{ pals: PalProfile[] }>('/api/pals')
    pals.value = response.pals ?? []
  }

  const loadRequests = async (): Promise<void> => {
    const response = await $fetch<{ incoming: PalRequest[], outgoing: PalRequest[] }>(
      '/api/pals/requests'
    )
    incoming.value = response.incoming ?? []
    outgoing.value = response.outgoing ?? []
  }

  const loadSuggestions = async (): Promise<void> => {
    const response = await $fetch<{ suggestions: PalSuggestion[] }>('/api/pals/suggestions')
    suggestions.value = response.suggestions ?? []
  }

  const loadBlocked = async (): Promise<void> => {
    const response = await $fetch<{ blocked: PalProfile[] }>('/api/pals/blocked')
    blocked.value = response.blocked ?? []
  }

  const loadAll = async (): Promise<void> => {
    loading.value = true
    error.value = ''
    try {
      await Promise.all([loadPals(), loadRequests(), loadSuggestions(), loadBlocked()])
    } catch {
      error.value = 'Could not load your PALs'
    } finally {
      loading.value = false
    }
  }

  const sendRequest = async (userId: string): Promise<'pending' | 'accepted'> => {
    const response = await $fetch<{ status: 'pending' | 'accepted' }>('/api/pals/request', {
      method: 'POST',
      body: { userId }
    })
    suggestions.value = suggestions.value.filter(item => item.id !== userId)
    await Promise.all([loadRequests(), response.status === 'accepted' ? loadPals() : Promise.resolve()])
    return response.status
  }

  const respond = async (requestId: string, action: 'accept' | 'decline' | 'cancel'): Promise<void> => {
    await $fetch('/api/pals/respond', { method: 'POST', body: { requestId, action } })
    await Promise.all([loadRequests(), action === 'accept' ? loadPals() : Promise.resolve()])
  }

  const removePal = async (userId: string): Promise<void> => {
    await $fetch('/api/pals/remove', { method: 'POST', body: { userId } })
    pals.value = pals.value.filter(pal => pal.id !== userId)
  }

  const setBlocked = async (userId: string, blockedState: boolean): Promise<void> => {
    await $fetch('/api/pals/block', {
      method: 'POST',
      body: { userId, action: blockedState ? 'block' : 'unblock' }
    })
    await Promise.all([loadBlocked(), loadPals(), loadRequests()])
  }

  return {
    pals,
    incoming,
    outgoing,
    suggestions,
    blocked,
    loading,
    error,
    loadAll,
    loadPals,
    loadRequests,
    loadSuggestions,
    loadBlocked,
    sendRequest,
    respond,
    removePal,
    setBlocked
  }
}
