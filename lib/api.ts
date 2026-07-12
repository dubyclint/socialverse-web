import { useUserStore } from '~/stores/user'
import { useUiStore } from '~/stores/ui'

// Define the custom fetch instance
const customFetch = $fetch.create({
  baseURL: '/api',
  async onRequest({ options }: { options: any }) {
    // 1. Auth Header Injection via userStore
    const userStore = useUserStore()
    
    if (userStore.token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${userStore.token}`,
      }
    }
  },
  async onResponseError({ response }: { response: any }) {
    // 2. Centralized Error Handling
    const uiStore = useUiStore()
    const message = response._data?.message || 'An unexpected error occurred'
    
    uiStore.notify(message, 'error')
    console.error(`[API Error] ${response.status}:`, message)
    
    // Optional: Handle 401s centrally here
    if (response.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
    }
  }
})

// 3. Response Unwrapping
export const api = async <T>(url: string, options: any = {}): Promise<T> => {
  // Call the custom instance defined above
  const response = await customFetch(url, options)
  return response as T
}
