// FILE: /composables/useSupabase.js
export const useSupabase = () => {
  if (!process.client) {
    return null
  }

  try {
    return useSupabaseClient()
  } catch (error) {
    console.warn('[useSupabase] useSupabaseClient not available yet:', error.message)
    return null
  }
}
