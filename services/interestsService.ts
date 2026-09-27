import { api } from './http'
import type { Interest } from '~/types/interests'

interface InterestListResponse {
  success: boolean
  data: Interest[]
}

interface UserInterestsResponse {
  success: boolean
  interests: Interest[]
  grouped: Record<string, Interest[]>
  total: number
}

interface MutationResponse {
  success: boolean
  message?: string
  error?: string
}

export const interestsService = {
  async fetchAll(): Promise<Interest[]> {
    const res = await api<InterestListResponse>('/interests/list')
    return res.data ?? []
  },

  async fetchUserInterests(): Promise<Interest[]> {
    const res = await api<UserInterestsResponse>('/interests/user')
    return res.interests ?? []
  },

  async add(interestId: string): Promise<MutationResponse> {
    return await api<MutationResponse>('/interests/add', {
      method: 'POST',
      body: { interestId }
    })
  },

  async remove(interestId: string): Promise<MutationResponse> {
    return await api<MutationResponse>('/interests/remove', {
      method: 'POST',
      body: { interestId }
    })
  }
}
