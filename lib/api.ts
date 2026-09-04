import { useUiStore } from '~/stores/ui'

// Same-origin `/api/*` requests carry the Supabase SSR cookie automatically,
// so no Authorization header is injected here.
const customFetch = $fetch.create({
  baseURL: '/api',
  credentials: 'same-origin',
  async onResponseError({ response }: { response: any }) {
    // Centralized Error Handling
    const uiStore = useUiStore()
    const message = response._data?.message || 'An unexpected error occurred'
    
    uiStore.notify(message, 'error')
    console.error(`[API Error] ${response.status}:`, message)
    // A 401 is not signed out: route middleware owns session state, and tearing
    // the session down here logs the user out on any single unauthorized call.
  }
})

// 3. Response Unwrapping
export const api = async <T>(url: string, options: any = {}): Promise<T> => {
  // Call the custom instance defined above
  const response = await customFetch(url, options)
  return response as T
}
