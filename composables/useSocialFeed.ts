// ============================================================================
// FILE: /composables/useSocialFeed.ts
// Description: Core pipeline coordinator for timelines, engagement hooks,
//              and profile synchronizations with lazy dependency tracking.
// ============================================================================
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { navigateTo } from '#app'
import { useSupabaseClient } from '~/composables/useSupabaseClient'

export const useSocialFeed = () => {
  const route = useRoute()
  const router = useRouter()
  const supabase = useSupabaseClient()

  // ============================================================================
  // LAZY MODULE RESOLVERS (Eliminates module-level dependency loops)
  // ============================================================================
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

  // Synchronous safe grabbers for reactive getters
  const getAuthStoreSync = () => _cachedAuthStore
  const getProfileStoreSync = () => _cachedProfileStore

  // ============================================================================
  // REACTIVE STATE
  // ============================================================================
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

  const feedTabs = [
    { id: 'for-you', label: 'For You', icon: 'home' },
    { id: 'following', label: 'Following', icon: 'users' },
    { id: 'trending', label: 'Trending', icon: 'trending-up' }
  ]

  // ============================================================================
  // AUTH GUARD HELPER
  // ============================================================================
  const ensureAuthenticatedOrRedirect = async (): Promise<boolean> => {
    const authStore = await getAuthStore()
    const profileStore = await getProfileStore()

    if (!authStore?.token || !authStore?.user?.id) {
      try {
        profileStore.clearProfile?.()
        authStore.clearAuth?.()
      } catch {}
      await navigateTo('/signin', { replace: true })
      return false
    }
    return true
  }

  // ============================================================================
  // COMPUTED PROPERTIES
  // ============================================================================
  const currentUser = computed(() => getAuthStoreSync()?.user || null)

  const userName = computed(() => {
    const profileStore = getProfileStoreSync()
    return (
      profileStore?.profile?.full_name ||
      currentUser.value?.user_metadata?.full_name ||
      currentUser.value?.full_name ||
      'User'
    )
  })

  const userUsername = computed(() => {
    const profileStore = getProfileStoreSync()
    const username =
      profileStore?.profile?.username ||
      currentUser.value?.user_metadata?.username ||
      currentUser.value?.username ||
      ''
    return !username || username === 'username' || username === 'user' ? '' : username
  })

  const userAvatar = computed(() => {
    const profileStore = getProfileStoreSync()
    return (
      profileStore?.profile?.avatar_url ||
      currentUser.value?.user_metadata?.avatar_url ||
      currentUser.value?.avatar_url ||
      '/default-avatar.svg'
    )
  })

  const userFollowers = computed(() => {
    const profileStore = getProfileStoreSync()
    return (
      profileStore?.profile?.followers_count ||
      currentUser.value?.user_metadata?.followers_count ||
      0
    )
  })

  const userFollowing = computed(() => {
    const profileStore = getProfileStoreSync()
    return (
      profileStore?.profile?.following_count ||
      currentUser.value?.user_metadata?.following_count ||
      0
    )
  })

  const userPosts = computed(() => {
    const profileStore = getProfileStoreSync()
    return (
      profileStore?.profile?.posts_count ||
      currentUser.value?.user_metadata?.posts_count ||
      0
    )
  })

  const userStatus = computed(() => {
    const profileStore = getProfileStoreSync()
    return profileStore?.profile?.status || currentUser.value?.user_metadata?.status || 'online'
  })

  const authStoreProxy = computed(() => getAuthStoreSync() || {})

  // ============================================================================
  // CORE TIMELINE & ACTION METHODS
  // ============================================================================
  const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }

  const handleLogout = async () => {
    try {
      sidebarOpen.value = false
      const profileStore = await getProfileStore()
      const { logout } = await getAuthComposable()
      profileStore.clearProfile()
      const result = await logout()
      if (result.success) { router.push('/signin') }
    } catch (error) { console.error('[Feed] Error logging out:', error) }
  }

  const retryProfileLoad = async () => {
    profileError.value = null
    profileLoading.value = true
    await fetchProfileData()
  }

  const goToProfilePage = () => {
    if (!currentUser.value?.id) return
    sidebarOpen.value = false
    router.push(`/profile/${currentUser.value.id}`)
  }

  const goToUserProfile = (username: string | undefined, userId?: string | undefined) => {
    const targetIdentity = userId || username
    if (!targetIdentity) return
    sidebarOpen.value = false
    router.push(`/profile/${String(targetIdentity).trim()}`)
  }

  const goToFollowers = () => {
    if (!currentUser.value?.id) return
    router.push(`/profile/${currentUser.value.id}?tab=followers`)
  }

  const goToFollowing = () => {
    if (!currentUser.value?.id) return
    router.push(`/profile/${currentUser.value.id}?tab=following`)
  }

  const goToUserPosts = () => {
    if (!currentUser.value?.id) return
    router.push(`/profile/${currentUser.value.id}?tab=posts`)
  }

  const goToCreatePost = () => {
    sidebarOpen.value = false
    router.push('/posts/create')
  }

  const goToSettingsProfile = () => {
    sidebarOpen.value = false
    router.push('/settings')
  }

  const shareProfile = async () => {
    if (!currentUser.value?.id) return
    try {
      const profileUrl = `${window.location.origin}/profile/${currentUser.value.id}`
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${userName.value}`,
          text: `Follow ${userName.value} on SocialVerse!`,
          url: profileUrl
        })
      } else { await navigator.clipboard.writeText(profileUrl) }
    } catch (error) { console.error('[Feed] Error sharing profile:', error) }
  }

  const togglePostMenu = (postId: string) => {
    activePostMenu.value = activePostMenu.value === postId ? null : postId
  }

  const likePost = async (postId: string) => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      await fetchWithAuth(`/api/posts/${postId}/like`, { method: 'POST' })
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.liked_by_me = !post.liked_by_me
        post.likes_count = post.liked_by_me ? (post.likes_count || 0) + 1 : Math.max(0, (post.likes_count || 1) - 1)
      }
    } catch (error) { console.error('[Feed] Error liking post:', error) }
  }

  const commentPost = (postId: string) => {
    sidebarOpen.value = false
    router.push(`/posts/${postId}`)
  }

  const sharePost = async (postId: string) => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const post = posts.value.find(p => p.id === postId)
      if (!post) return
      const postUrl = `${window.location.origin}/posts/${postId}`
      if (navigator.share) {
        await navigator.share({ title: 'Check out this post', text: post.content, url: postUrl })
      } else { await navigator.clipboard.writeText(postUrl) }
      const fetchWithAuth = await getFetchWithAuth()
      await fetchWithAuth(`/api/posts/${postId}/share`, { method: 'POST' })
      post.shares_count = (post.shares_count || 0) + 1
    } catch (error) { console.error('[Feed] Error sharing post:', error) }
  }

  const savePost = async (postId: string) => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      await fetchWithAuth(`/api/posts/${postId}/save`, { method: 'POST' })
      const post = posts.value.find(p => p.id === postId)
      if (post) post.saved_by_me = !post.saved_by_me
    } catch (error) { console.error('[Feed] Error saving post:', error) }
  }

  const reportPost = async (postId: string) => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      await fetchWithAuth(`/api/posts/${postId}/report`, { method: 'POST', body: { reason: 'inappropriate' } })
      activePostMenu.value = null
    } catch (error) { console.error('[Feed] Error reporting post:', error) }
  }

  const deletePost = async (postId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this post?')) return
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      await fetchWithAuth(`/api/posts/${postId}`, { method: 'DELETE' })
      posts.value = posts.value.filter(p => p.id !== postId)
      activePostMenu.value = null
    } catch (error) { console.error('[Feed] Error deleting post:', error) }
  }

  const copyPostLink = async (postId: string) => {
    try {
      const postUrl = `${window.location.origin}/posts/${postId}`
      await navigator.clipboard.writeText(postUrl)
      activePostMenu.value = null
    } catch (error) { console.error('[Feed] Error copying link:', error) }
  }

  const viewPostLikes = (postId: string) => { sidebarOpen.value = false; router.push(`/posts/${postId}/likes`) }
  const viewPostComments = (postId: string) => { sidebarOpen.value = false; router.push(`/posts/${postId}`) }
  const viewPostShares = (postId: string) => { sidebarOpen.value = false; router.push(`/posts/${postId}/shares`) }
  const openMediaViewer = (mediaUrl: string) => { window.open(mediaUrl, '_blank') }

  const followUser = async (userId: string) => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      await fetchWithAuth(`/api/users/${userId}/follow`, { method: 'POST' })
      const user = suggestedUsers.value.find(u => u.id === userId)
      if (user) user.following = !user.following
    } catch (error) { console.error('[Feed] Error following user:', error) }
  }

  const performSearch = async () => {
    if (!searchQuery.value.trim()) return
    sidebarOpen.value = false
    router.push(`/explore?q=${encodeURIComponent(searchQuery.value)}`)
  }

  const refreshFeed = async () => {
    if (!(await ensureAuthenticatedOrRedirect())) return
    currentPage.value = 1
    posts.value = []
    postsLoading.value = true
    await fetchPosts()
  }

  const refreshSuggestedUsers = async () => { if (!(await ensureAuthenticatedOrRedirect())) return; await fetchSuggestedUsers() }
  const refreshTrending = async () => { if (!(await ensureAuthenticatedOrRedirect())) return; await fetchTrendingTopics() }
  const loadMorePosts = async () => {
    if (!(await ensureAuthenticatedOrRedirect())) return
    currentPage.value++
    loadingMore.value = true
    await fetchPosts()
    loadingMore.value = false
  }

  const triggerStatusViewer = (statusItem: any) => { activeSelectedStatus.value = statusItem }
  const closeStatusViewer = () => { activeSelectedStatus.value = null }

  const formatTime = (date: string | Date) => {
    try {
      const d = new Date(date)
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      if (minutes < 1) return 'just now'
      if (minutes < 60) return `${minutes}m ago`
      if (hours < 24) return `${hours}h ago`
      if (days < 7) return `${days}d ago`
      if (days < 30) return `${Math.floor(days / 7)}w ago`
      return d.toLocaleDateString()
    } catch { return 'unknown' }
  }

  // ============================================================================
  // PIPELINE API FETCHERS
  // ============================================================================
  const fetchPosts = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      const endpoint = activeTab.value === 'for-you' ? '/api/posts/feed' : activeTab.value === 'following' ? '/api/posts/following' : '/api/posts/trending'
      const result: any = await fetchWithAuth(endpoint, { method: 'GET', query: { page: currentPage.value, limit: 10 } })
      const nextPosts = result?.data?.posts ?? result?.posts ?? []
      const nextHasMore = result?.data?.hasMore ?? result?.has_more ?? false
      if (currentPage.value === 1) { posts.value = nextPosts } else { posts.value.push(...nextPosts) }
      hasMorePosts.value = !!nextHasMore
    } catch (error: any) {
      if (error?.statusCode !== 401 && error?.statusCode !== 403) { console.error('[Feed] Error loading posts:', error) }
      if (currentPage.value === 1) posts.value = []
    } finally { postsLoading.value = false }
  }

  const fetchSuggestedUsers = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      suggestedUsersLoading.value = true
      const result: any = await fetchWithAuth('/api/users/suggested', { method: 'GET', query: { limit: 5 } })
      suggestedUsers.value = result?.data || []
    } catch (error: any) { console.error('[Feed] Error loading suggested users:', error) } finally { suggestedUsersLoading.value = false }
  }

  const fetchTrendingTopics = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      trendingLoading.value = true
      const result: any = await fetchWithAuth('/api/trending', { method: 'GET', query: { limit: 5 } })
      trendingTopics.value = result?.data || []
    } catch (error: any) { console.error('[Feed] Error loading trending topics:', error) } finally { trendingLoading.value = false }
  }

  const fetchNotifications = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      const result: any = await fetchWithAuth('/api/user/notifications', { method: 'GET', query: { limit: 10, unread_only: true } })
      unreadNotifications.value = result?.total || 0
    } catch { unreadNotifications.value = 0 }
  }

  const fetchMessages = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      const result: any = await fetchWithAuth('/api/messages', { method: 'GET', query: { unread_only: true } })
      unreadMessages.value = result?.total || 0
    } catch { unreadMessages.value = 0 }
  }

  const fetchProfileData = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const profileStore = await getProfileStore()
      profileLoading.value = true
      profileSyncing.value = true
      await profileStore.fetchProfile()
      if (!profileStore.profile) {
        if (profileStore.profileMissing) { await router.replace('/profile/complete'); return }
        isVerified.value = false; profileComplete.value = false; walletBalance.value = '$0.00'; return
      }
      isVerified.value = profileStore.profile.is_verified || false
      profileComplete.value = !!(profileStore.profile.username && profileStore.profile.full_name)
      if (profileStore.profile.wallet_balance !== undefined) {
        walletBalance.value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(profileStore.profile.wallet_balance)
      }
      profileError.value = null; lastProfileSync.value = new Date()
    } catch (error: any) { profileError.value = error.message || 'Failed to sync layout configuration.' } finally { profileLoading.value = false; profileSyncing.value = false }
  }

  const checkLiveStatus = async () => {
    try {
      if (!(await ensureAuthenticatedOrRedirect())) return
      const fetchWithAuth = await getFetchWithAuth()
      const response: any = await fetchWithAuth('/api/stream/active-status', { method: 'GET' })
      isLiveStreaming.value = response?.is_live || false
    } catch {}
  }

  const initializeFeedData = async () => {
    if (!(await ensureAuthenticatedOrRedirect())) return
    await Promise.all([fetchProfileData(), fetchPosts(), fetchSuggestedUsers(), fetchTrendingTopics(), fetchNotifications(), fetchMessages(), checkLiveStatus()])
  }

  const initPipeline = async () => {
    if (initialized.value) return
    initialized.value = true
    await new Promise((resolve) => setTimeout(resolve, 50))
    const authStore = await getAuthStore()
    if (!authStore.token || !authStore.user?.id) { await navigateTo('/signin', { replace: true }); return }
    await initializeFeedData()
  }

  if (process.client) {
    getAuthStore().then(() => getProfileStore()).catch(() => console.warn('[Social Feed] Store layout hydration deferred.'))
  }

  return {
    sidebarOpen, isLiveStreaming, posts, postsLoading, loadingMore, hasMorePosts, activeTab, activePostMenu, suggestedUsers, suggestedUsersLoading, trendingTopics, trendingLoading, searchQuery, unreadNotifications, unreadMessages, walletBalance, isVerified, profileLoading, profileError, fetchedStatuses, statusLoading, activeSelectedStatus, feedTabs, currentUser, userName, userUsername, userAvatar, userFollowers, userFollowing, userPosts, userStatus, authStore: authStoreProxy, toggleSidebar, handleLogout, retryProfileLoad, goToProfilePage, goToUserProfile, goToFollowers, goToFollowing, goToUserPosts, goToCreatePost, goToSettingsProfile, shareProfile, togglePostMenu, likePost, commentPost, sharePost, savePost, reportPost, deletePost, copyPostLink, viewPostLikes, viewPostComments, viewPostShares, openMediaViewer, followUser, performSearch, refreshFeed, refreshSuggestedUsers, refreshTrending, loadMorePosts, triggerStatusViewer, closeStatusViewer, formatTime, initPipeline
  }
}
