// composables/use-fetch.ts
import { useAuthStore } from '~/stores/auth'

export const useFetchWithAuth = () => {
  const authStore = useAuthStore()

  return async (url: string, options: any = {}) => {
    const token = authStore.token

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return $fetch(url, {
      ...options,
      headers
    })
  }
}
