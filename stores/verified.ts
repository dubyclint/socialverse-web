import { defineStore } from 'pinia'

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
    getStatus: (state) => (userId: string): VerificationStatus => {
      return state.statusMap[userId] || 'none'
    },
    
    getPendingCount: (state) => state.pendingRequests.length
  },

  actions: {
    async fetchStatus(userId: string): Promise<VerificationStatus> {
      if (this.statusMap[userId]) {
        return this.statusMap[userId]
      }

      try {
        this.loading = true
        this.error = null
        
        const response = await fetch(`/api/verified/status?userId=${encodeURIComponent(userId)}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch verification status: ${response.statusText}`)
        }
        
        const data = await response.json()
        this.statusMap[userId] = data.status || 'none'
        return this.statusMap[userId]
      } catch (error) {
        console.error('Failed to fetch badge status:', error)
        this.error = (error as any).message || 'Failed to fetch verification status'
        this.statusMap[userId] = 'none'
        return 'none'
      } finally {
        this.loading = false
      }
    },

    async submitRequest(requestData: { name: string; socialLink: string; docUrl?: string }): Promise<void> {
      try {
        this.loading = true
        this.error = null
        
        const response = await fetch('/api/verified/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })
        
        if (!response.ok) {
          throw new Error(`Failed to submit verification request: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        const authStore = useAuthStore()
        if (authStore.user?.id) {
          this.statusMap[authStore.user.id] = 'pending'
        }
        
        return result
      } catch (error) {
        console.error('Error submitting verification request:', error)
        this.error = (error as any).message || 'Failed to submit verification request'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchPendingRequests(): Promise<void> {
      try {
        this.loading = true
        this.error = null
        
        const response = await fetch('/api/verified/status?pending=true')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pending requests: ${response.statusText}`)
        }
        
        this.pendingRequests = await response.json()
      } catch (error) {
        console.error('Error fetching pending requests:', error)
        this.error = (error as any).message || 'Failed to fetch pending requests'
        this.pendingRequests = []
      } finally {
        this.loading = false
      }
    },

    async approveRequest(requestId: string, approve: boolean): Promise<void> {
      try {
        this.loading = true
        this.error = null
        
        const response = await fetch('/api/verified/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: requestId, approve })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to ${approve ? 'approve' : 'reject'} request: ${response.statusText}`)
        }
        
        this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId)
        
        const request = this.pendingRequests.find(req => req.id === requestId)
        if (request) {
          this.statusMap[request.userId] = approve ? 'approved' : 'rejected'
        }
        
      } catch (error) {
        console.error(`Error ${approve ? 'approving' : 'rejecting'} request:`, error)
        this.error = (error as any).message || `Failed to ${approve ? 'approve' : 'reject'} request`
        throw error
      } finally {
        this.loading = false
      }
    },

    setStatus(userId: string, status: VerificationStatus): void {
      this.statusMap[userId] = status
    },

    clearError(): void {
      this.error = null
    },

    clearCache(): void {
      this.statusMap = {}
      this.pendingRequests = []
    }
  }
})

