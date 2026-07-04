// stores/auth.ts - TEMPORARY BRIDGE
import { useUserStore } from '~/stores/user'

export const useAuthStore = () => {
  const userStore = useUserStore()
  // Map the new user store structure to the old AuthStore expectations
  // This allows the rest of your app to continue working while you migrate
  return {
    ...userStore,
    // Add any specific aliases here if the property names differ
    user: userStore.currentUser 
  }
}
