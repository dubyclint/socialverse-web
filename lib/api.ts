// lib/api.ts
import { useAuthStore } from '~/stores/auth'
import { useUiStore } from '~/stores/ui'

const api = $fetch.create({
  baseURL: '/api',
  async onRequest({ options }) {
    const authStore = useAuthStore()
    // 1. Auth Header Injection
    if (authStore.token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${authStore.token}`,
      }
    }
  },
  async onResponseError({ response }) {
    // 2. Centralized Error Handling
    const uiStore = useUiStore()
    const message = response._data?.message || 'An unexpected error occurred'
    
    // Notify user globally
    uiStore.notify(message, 'error')
    
    // Log for monitoring (can be hooked into Sentry here)
    console.error(`[API Error] ${response.status}:`, message)
  }
})

// 3. Response Unwrapping
export const api = async <T>(url: string, options: any = {}): Promise<T> => {
  const response = await api(url, options)
  return response as T
}
