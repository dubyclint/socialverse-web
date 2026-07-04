import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user' // Unified store

export const useSocialFeed = () => {
  const router = useRouter()
  const userStore = useUserStore() // Central source of truth

  // UI State (keep these)
  const sidebarOpen = ref(false)
  const posts = ref<any[]>([])
  const postsLoading = ref(true)
  const walletBalance = ref('$0.00')

  // COMPUTED PROPERTIES (Simplified)
  const currentUser = computed(() => userStore.user)
  const userName = computed(() => userStore.profile?.full_name || 'User')

  // ACTIONS
  const handleLogout = async () => {
    sidebarOpen.value = false
    await userStore.logout() // One call handles clearing everything
    router.push('/signin')
  }

  const fetchProfileData = async () => {
    try {
      await userStore.refreshProfile() // Simplified: userStore knows how to fetch its own profile
      if (userStore.profile?.wallet_balance !== undefined) {
        walletBalance.value = new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(userStore.profile.wallet_balance)
      }
    } catch (e) {
      console.error('[Feed] Profile sync failed', e)
    }
  }

  const initPipeline = async () => {
    // 1. Ensure session is ready
    if (!userStore.isAuthenticated) {
      router.push('/signin')
      return
    }
    
    // 2. Load data
    await Promise.all([
      fetchProfileData(),
      // Add a simple fetchPosts() call here
    ])
  }

  return {
    // ... expose necessary state and methods
    currentUser,
    userName,
    handleLogout,
    initPipeline
  }
}
