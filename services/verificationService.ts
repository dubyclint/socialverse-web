// services/verificationService.ts
import type { BadgeRequest, VerificationStatusResponse } from '~/types/verification'

export const verificationService = {
  async getStatus(): Promise<VerificationStatusResponse> {
    return await $fetch<VerificationStatusResponse>('/api/verified/status')
  },

  async submitRequest(data: { name: string, socialLink: string, docUrl?: string }): Promise<BadgeRequest> {
    return await $fetch<BadgeRequest>('/api/verified/request', {
      method: 'POST',
      body: data
    })
  }
}
