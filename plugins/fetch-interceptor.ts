// /plugins/fetch-interceptor.ts
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  // Intercept all $fetch calls to add Authorization header
  $fetch.create({
    onRequest({ request, options }) {
      console.log('[Fetch Interceptor] Request:', request)
      
      // Add Authorization header if token exists
      if (authStore.token && !options.headers?.Authorization) {
        if (!options.headers) {
          options.headers = {}
        }
        options.headers.Authorization = `Bearer ${authStore.token}`
        console.log('[Fetch Interceptor] ✅ Authorization header added')
      }
    },
    onResponseError({ response }) {
      console.error('[Fetch Interceptor] Response error:', response.status, response.statusText)
      
      // Handle 401 - redirect to login
      if (response.status === 401) {
        console.error('[Fetch Interceptor] ❌ Unauthorized - redirecting to login')
        authStore.logout()
        navigateTo('/login')
      }
    }
  })
})
