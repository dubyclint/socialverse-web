// ============================================================================
// FILE: ~/stores/verified.ts
// Standardized on useUserStore as the Single Source of Truth.
// ============================================================================
import { defineStore } from 'pinia'
import { useUserStore } from '~/stores/user'

type VerificationStatus = 'approved' | 'pending' | 'rejected' | 'none'

interface VerificationRequest {
  id: string
  userId: string
  name: string
  socialLink: string
  docUrl?: string
  status: VerificationStatus
  createdAt: string
  updatedAt?: string
}

interface VerifiedState {
  statusMap: Record<string, VerificationStatus>
  pendingRequests: VerificationRequest[]
  loading: boolean
  error: string | null
}

export const useVerifiedStore = defineStore('verified', {
  state: (): VerifiedState => ({
    statusMap: {},
    pendingRequests: [],
    loading: false,
    error: null
  }),

  getters: {
    getStatus: (state) => (userId: string): VerificationStatus => state.statusMap[userId] || 'none',
    getPendingCount: (state) => state.pendingRequests.length,
    isVerified: (state) => (userId: string): boolean => state.statusMap[userId] === 'approved',
    isPending: (state) => (userId: string): boolean => state.statusMap[userId] === 'pending',
    isRejected: (state) => (userId: string): boolean => state.statusMap[userId] === 'rejected'
  },

  actions: {
    async fetchStatus(userId: string): Promise<VerificationStatus> {
      if (this.statusMap[userId]) return this.statusMap[userId] as VerificationStatus

      try {
        this.loading = true
        this.error = null
        const response = await fetch(`/api/verified/status?userId=${encodeURIComponent(userId)}`)
        if (!response.ok) throw new Error(`Failed to fetch status: ${response.statusText}`)

        const data = await response.json()
        this.statusMap[userId] = data?.status || 'none'
  return this.statusMap[userId] as VerificationStatus
      } catch (error) {
        this.error = (error as any)?.message || 'Failed to fetch verification status'
        return 'none'
      } finally {
        this.loading = false
      }
    },

    async submitRequest(requestData: { name: string; socialLink: string; docUrl?: string }): Promise<void> {
      const userStore = useUserStore()
      try {
        this.loading = true
        this.error = null

        const response = await fetch('/api/verified/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        })

        if (!response.ok) throw new Error(`Failed to submit: ${response.statusText}`)

        const uid = (userStore as any).user?.id || (userStore as any).user?.user_id
        if (uid) {
          this.statusMap[uid] = 'pending'
        }
      } catch (error) {
        this.error = (error as any)?.message || 'Failed to submit'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPendingRequests(): Promise<void> {
      try {
        this.loading = true
        this.error = null
        const response = await fetch('/api/verified/pending')
        if (!response.ok) throw new Error(`Failed to fetch pending requests`)
        this.pendingRequests = await response.json()
      } catch (error) {
        this.error = (error as any)?.message || 'Failed to fetch pending requests'
      } finally {
        this.loading = false
      }
    },

    async approveRequest(requestId: string, approve: boolean): Promise<void> {
      try {
        this.loading = true
        const response = await fetch('/api/verified/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: requestId, approve })
        })
        if (!response.ok) throw new Error('Approval action failed')

        const request = this.pendingRequests.find(req => req.id === requestId)
        if (request) {
          this.statusMap[request.userId] = approve ? 'approved' : 'rejected'
          this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId)
        }
      } catch (error) {
        this.error = (error as any)?.message || 'Failed to update request'
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError() { this.error = null },
    clearCache() {
      this.statusMap = {}
      this.pendingRequests = []
    }
  }
})
