// services/verificationService.ts
export const verificationService = {
  async getStatus() {
    return await $fetch('/api/verified/status')
  },

  async submitRequest(data: { name: string, socialLink: string, docUrl?: string }) {
    return await $fetch('/api/verified/request', {
      method: 'POST',
      body: data
    })
  }
}
