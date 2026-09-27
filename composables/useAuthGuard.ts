// composables/useAuthGuard.ts
export const useAuthGuard = () => {
  const userStore = useUserStore() // Assuming you have a user store

  const canAccessFinancials = () => {
    // Check if user is verified or premium
    return userStore.user?.is_verified || userStore.user?.is_premium
  }

  const checkCompliance = async () => {
    // Logic to ensure T&C are met
    const { accepted } = await $fetch<{ accepted: boolean }>('/api/auth/check-terms')
    return accepted
  }

  return { canAccessFinancials, checkCompliance }
}
