// ============================================================================
// FILE: /composables/useSocialFeed.ts 
// ============================================================================
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { navigateTo } from '#app'
import { useSupabaseClient } from '~/composables/useSupabaseClient' // ADDED IMPORT

export const useSocialFeed = () => {
  const route = useRoute()
  const router = useRouter()
  const supabase = useSupabaseClient() // INITIALIZED CLIENT

  // LAZY MODULE RESOLVERS
  let _cachedAuthStore: any = null
  let _cachedProfileStore: any = null
  let _cachedAuthComposable: any = null
  let _cachedFetchWithAuth: any = null

  const getAuthStore = async () => {
    if (_cachedAuthStore) return _cachedAuthStore
    const { useAuthStore } = await import('~/stores/auth')
    _cachedAuthStore = useAuthStore()
    return _cachedAuthStore
  }

  const getProfileStore = async () => {
    if (_cachedProfileStore) return _cachedProfileStore
    const { useProfileStore } = await import('~/stores/profile')
    _cachedProfileStore = useProfileStore()
    return _cachedProfileStore
  }

  const getAuthComposable = async () => {
    if (_cachedAuthComposable) return _cachedAuthComposable
    const { useAuth } = await import('~/composables/use-auth')
    _cachedAuthComposable = useAuth()
    return _cachedAuthComposable
  }

  const getFetchWithAuth = async () => {
    if (_cachedFetchWithAuth) return _cachedFetchWithAuth
    const { useFetchWithAuth } = await import('~/composables/use-fetch')
    _cachedFetchWithAuth = useFetchWithAuth()
    return _cachedFetchWithAuth
  }

  const getAuthStoreSync = () => _cachedAuthStore
  const getProfileStoreSync = () => _cachedProfileStore

  // REACTIVE STATE
  const sidebarOpen = ref(false)
  const isLiveStreaming = ref(false)
  const posts = ref<any[]>([])
  const postsLoading = ref(true)
  const loadingMore = ref(false)
  const hasMorePosts = ref(true)
  const currentPage = ref(1)
  const activeTab = ref('for-you')
  const activePostMenu = ref<string | null>(null)
  const suggestedUsers = ref<any[]>([])
  const suggestedUsersLoading = ref(false)
  const trendingTopics = ref<any[]>([])
  const trendingLoading = ref(false)
  const searchQuery = ref('')
  const unreadNotifications = ref(0)
  const unreadMessages = ref(0)
  const walletBalance = ref('$0.00')
  const isVerified = ref(false)
  const profileLoading = ref(true)
  const profileError = ref<string | null>(null)
  const profileComplete = ref(false)
  const profileSyncing = ref(false)
  const lastProfileSync = ref<Date | null>(null)
  const initialized = ref(false)
  const fetchedStatuses = ref<any[]>([])
  const statusLoading = ref(false)
  const activeSelectedStatus = ref<any>(null)
  const isGifting = ref<Record<string, boolean>>({})

  const feedTabs = [
    { id: 'for-you', label: 'For You', icon: 'home' },
    { id: 'following', label: 'Following', icon: 'users' },
    { id: 'trending', label: 'Trending', icon: 'trending-up' }
  ]

  const ensureAuthenticatedOrRedirect = async (): Promise<boolean> => {
    const authStore = await getAuthStore()
    const profileStore = await getProfileStore()
    if (!authStore?.token || !authStore?.user?.id) {
      try { profileStore.clearProfile?.(); authStore.clearAuth?.() } catch {}
      await navigateTo('/signin', { replace: true })
      return false
    }
    return true
  }

  // --- Realtime Wallet Listener ---
  const setupWalletListener = async () => {
    const authStore = await getAuthStore()
    const userId = authStore?.user?.id
    if (!userId) return

    supabase
      .channel('wallet_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newBalance = payload.new.balance
          walletBalance.value = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
          }).format(newBalance)
          console.log('[Feed] Wallet updated via realtime:', newBalance)
        }
      )
      .subscribe()
  }

  // COMPUTED PROPERTIES
  const currentUser = computed(() => getAuthStoreSync()?.user || null)
  const userName = computed(() => getProfileStoreSync()?.profile?.full_name || currentUser.value?.user_metadata?.full_name || 'User')
  
  // CORE TIMELINE & ACTION METHODS
  const sendPewGift = async (postId: string, amount: number) => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      isGifting.value[postId] = true
      const fetchWithAuth = await getFetchWithAuth()
      const result: any = await fetchWithAuth(`/api/posts/${postId}/pewgift`, { method: 'POST', body: { amount } })
      if (result.success || result.status === 200) {
        const post = posts.value.find(p => p.id === postId)
        if (post) post.gifts_count = (post.gifts_count || 0) + 1
        await fetchProfileData()
      } else { throw new Error(result.message || 'Transaction failed') }
    } catch (error: any) { console.error('[Feed] PewGift failed:', error); alert(error.message || 'Failed to send gift.') }
    finally { isGifting.value[postId] = false }
  }

  const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
  const handleLogout = async () => { 
    sidebarOpen.value = false
    const profileStore = await getProfileStore()
    const { logout } = await getAuthComposable()
    profileStore.clearProfile()
    const res = await logout()
    if (res.success) router.push('/signin')
  }

  const fetchProfileData = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const profileStore = await getProfileStore()
      profileLoading.value = true
      await profileStore.fetchProfile()
      if (profileStore.profile?.wallet_balance !== undefined) {
        walletBalance.value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(profileStore.profile.wallet_balance)
      }
    } finally { profileLoading.value = false }
  }

  const fetchPosts = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      const result: any = await fetchWithAuth('/api/posts/feed', { method: 'GET', query: { page: currentPage.value } })
      posts.value = currentPage.value === 1 ? result.posts : [...posts.value, ...result.posts]
    } catch (e) { console.error(e) } finally { postsLoading.value = false }
  }

  const initPipeline = async () => {
    if (initialized.value) return
    initialized.value = true
    await fetchProfileData()
    await fetchPosts()
    await setupWalletListener() // RECONCILED: Start listening
  }

  return {
    sidebarOpen, isLiveStreaming, posts, postsLoading, loadingMore, hasMorePosts, activeTab, 
    activePostMenu, suggestedUsers, suggestedUsersLoading, trendingTopics, trendingLoading, 
    searchQuery, unreadNotifications, unreadMessages, walletBalance, isVerified, profileLoading, 
    profileError, fetchedStatuses, statusLoading, activeSelectedStatus, isGifting,
    currentUser, userName, toggleSidebar, handleLogout, sendPewGift, fetchProfileData, 
    fetchPosts, initPipeline
  }
}
