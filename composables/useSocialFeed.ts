import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useUserStore } from '~/stores/user' // Unified store

const PAGE_SIZE = 12

export interface FeedAuthor {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  verified: boolean
}

export interface FeedPost {
  id: string
  content: string
  created_at: string
  media: string[]
  hashtags: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  liked_by_me: boolean
  author: FeedAuthor | null
}

export interface FeedStatus {
  id: string
  media_url: string | null
  media_type: 'image' | 'video' | 'text'
  content: string | null
  created_at: string
  author: FeedAuthor | null
}

export interface SuggestedUser extends FeedAuthor {
  following: boolean
}

export type FeedTab = 'for-you' | 'following' | 'trending'

export interface FeedAd {
  id: string
  title: string
  creativeUrl: string | null
  destinationUrl: string | null
  advertiserId: string
}

export type FeedItem =
  | { type: 'post', post: FeedPost }
  | { type: 'ad', ad: FeedAd }
  | { type: 'external_ad', slotRef: string, provider: string, clientId: string, slotId: string }

export interface TrendingTopic {
  id: string
  title: string
  category: string
  count: number
}

interface UserRow {
  user_id: string
  username: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean | null
}

interface StatusRow {
  id: string
  user_id: string
  media_url: string | null
  caption: string | null
  created_at: string
}

const toAuthor = (row: UserRow | undefined): FeedAuthor | null => {
  if (!row) return null
  return {
    id: row.user_id,
    username: row.username || 'user',
    full_name: row.full_name || row.display_name || row.username || 'User',
    avatar_url: row.avatar_url,
    verified: row.is_verified === true,
  }
}

const guessMediaType = (url: string | null): 'image' | 'video' | 'text' => {
  if (!url) return 'text'
  return /\.(mp4|webm|mov|m3u8)$/i.test(url) ? 'video' : 'image'
}

export const useSocialFeed = () => {
  const router = useRouter()
  const userStore = useUserStore()
  const supabase = useSupabaseClient()
  const supabaseUser = useSupabaseUser()

  // UI state
  const sidebarOpen = ref(false)
  const walletBalance = ref('$0.00')

  // Feed state
  const feedItems = ref<FeedItem[]>([])
  const posts = computed<FeedPost[]>(() =>
    feedItems.value.flatMap(item => (item.type === 'post' ? [item.post] : []))
  )
  const postsLoading = ref(false)
  const loadingMore = ref(false)
  const hasMorePosts = ref(false)
  const page = ref(0)
  const activeTab = ref<FeedTab>('for-you')

  // Statuses
  const fetchedStatuses = ref<FeedStatus[]>([])
  const statusLoading = ref(false)
  const activeSelectedStatus = ref<FeedStatus | null>(null)

  // Right rail
  const suggestedUsers = ref<SuggestedUser[]>([])
  const suggestedUsersLoading = ref(false)
  const trendingTopics = ref<TrendingTopic[]>([])
  const trendingLoading = ref(false)

  // Profile
  const profileLoading = ref(false)
  const profileError = ref<string | null>(null)

  // Counters
  const unreadMessages = ref(0)
  const unreadNotifications = ref(0)
  const isLiveStreaming = ref(false)

  const currentUser = computed(() => userStore.user)
  const currentUserId = computed<string | null>(
    () => supabaseUser.value?.id ?? userStore.user?.id ?? null
  )
  const userName = computed(
    () => userStore.profile?.full_name || userStore.profile?.username || 'User'
  )
  const userUsername = computed(() => userStore.profile?.username || '')
  const userAvatar = computed(() => userStore.profile?.avatar_url || '/default-avatar.svg')
  const userStatus = computed(() => (currentUserId.value ? 'online' : 'offline'))
  const isVerified = computed(() => userStore.profile?.is_verified === true)
  const userFollowers = computed(() => userStore.profile?.followers_count ?? 0)
  const userFollowing = computed(() => userStore.profile?.following_count ?? 0)
  const userPosts = computed(() => userStore.profile?.posts_count ?? 0)

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const handleLogout = async () => {
    sidebarOpen.value = false
    await userStore.logout()
    router.push('/signin')
  }

  const loadAuthors = async (userIds: string[]): Promise<Map<string, UserRow>> => {
    const authors = new Map<string, UserRow>()
    const ids = Array.from(new Set(userIds.filter(Boolean)))
    if (ids.length === 0) return authors

    const { data, error } = await supabase
      .from('user')
      .select('user_id,username,display_name,full_name,avatar_url,is_verified')
      .in('user_id', ids)

    if (error) {
      console.error('[Feed] Author lookup failed', error.message)
      return authors
    }

    for (const row of (data ?? []) as UserRow[]) {
      authors.set(row.user_id, row)
    }
    return authors
  }

  /**
   * Single ranked feed source: in-app ads take their reserved slots, ranked
   * posts fill the rest, and the external network only backfills ad slots the
   * in-app inventory could not.
   */
  const loadFeed = async (targetPage: number): Promise<FeedItem[]> => {
    const response = await $fetch<{
      success: boolean
      data: { items: FeedItem[]; hasMore: boolean }
    }>('/api/feed', {
      query: { page: targetPage, limit: PAGE_SIZE, tab: activeTab.value },
    })

    hasMorePosts.value = response.data?.hasMore ?? false
    return response.data?.items ?? []
  }

  const refreshFeed = async (tab: FeedTab = activeTab.value) => {
    activeTab.value = tab
    postsLoading.value = true
    try {
      page.value = 0
      feedItems.value = await loadFeed(0)
    } catch (e) {
      console.error('[Feed] Loading feed failed', e)
      feedItems.value = []
      hasMorePosts.value = false
    } finally {
      postsLoading.value = false
    }
  }

  const loadMorePosts = async () => {
    if (loadingMore.value || !hasMorePosts.value) return
    loadingMore.value = true
    try {
      const next = page.value + 1
      const more = await loadFeed(next)
      feedItems.value = [...feedItems.value, ...more]
      page.value = next
    } catch (e) {
      console.error('[Feed] Loading more feed items failed', e)
    } finally {
      loadingMore.value = false
    }
  }

  const fetchStatuses = async () => {
    statusLoading.value = true
    try {
      const { data, error } = await supabase
        .from('user_statuses')
        .select('id,user_id,media_url,caption,created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message)

      const rows = (data ?? []) as StatusRow[]
      const authors = await loadAuthors(rows.map((row) => row.user_id))

      fetchedStatuses.value = rows.map((row) => ({
        id: row.id,
        media_url: row.media_url,
        media_type: guessMediaType(row.media_url),
        content: row.caption,
        created_at: row.created_at,
        author: toAuthor(authors.get(row.user_id)),
      }))
    } catch (e) {
      console.error('[Feed] Loading statuses failed', e)
      fetchedStatuses.value = []
    } finally {
      statusLoading.value = false
    }
  }

  const triggerStatusViewer = (status: FeedStatus) => {
    activeSelectedStatus.value = status
  }

  const refreshSuggestedUsers = async () => {
    suggestedUsersLoading.value = true
    try {
      const query = supabase
        .from('user')
        .select('user_id,username,display_name,full_name,avatar_url,is_verified')
        .limit(5)

      const { data, error } = currentUserId.value
        ? await query.neq('user_id', currentUserId.value)
        : await query

      if (error) throw new Error(error.message)

      const rows = (data ?? []) as UserRow[]

      let followingIds = new Set<string>()
      if (currentUserId.value && rows.length > 0) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId.value)
          .in('following_id', rows.map((row) => row.user_id))

        followingIds = new Set(
          ((follows ?? []) as { following_id: string }[]).map((f) => f.following_id)
        )
      }

      suggestedUsers.value = rows.flatMap((row) => {
        const author = toAuthor(row)
        return author ? [{ ...author, following: followingIds.has(row.user_id) }] : []
      })
    } catch (e) {
      console.error('[Feed] Loading suggested users failed', e)
      suggestedUsers.value = []
    } finally {
      suggestedUsersLoading.value = false
    }
  }

  const followUser = async (userId: string) => {
    if (!currentUserId.value) return

    const target = suggestedUsers.value.find((u) => u.id === userId)
    if (!target) return

    try {
      if (target.following) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId.value)
          .eq('following_id', userId)
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUserId.value, following_id: userId })
      }
      target.following = !target.following
    } catch (e) {
      console.error('[Feed] Follow toggle failed', e)
    }
  }

  const refreshTrending = async () => {
    trendingLoading.value = true
    try {
      const { data, error } = await supabase
        .from('trending_hashtags')
        .select('id,hashtag,count')
        .order('count', { ascending: false })
        .limit(6)

      if (error) throw new Error(error.message)

      trendingTopics.value = ((data ?? []) as { id: string; hashtag: string; count: number | null }[]).map(
        (row) => ({
          id: row.id,
          title: row.hashtag,
          category: 'Trending',
          count: row.count ?? 0,
        })
      )
    } catch (e) {
      console.error('[Feed] Loading trending failed', e)
      trendingTopics.value = []
    } finally {
      trendingLoading.value = false
    }
  }

  const refreshCounters = async () => {
    if (!currentUserId.value) return

    try {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', currentUserId.value)
        .eq('is_read', false)

      unreadNotifications.value = count ?? 0
    } catch (e) {
      console.error('[Feed] Notification count failed', e)
    }

    try {
      const { data: liveStreams } = await supabase
        .from('streams')
        .select('id')
        .eq('creator_id', currentUserId.value)
        .eq('broadcast_status', 'LIVE')
        .limit(1)

      isLiveStreaming.value = ((liveStreams ?? []) as { id: string }[]).length > 0
    } catch (e) {
      console.error('[Feed] Live stream lookup failed', e)
    }
  }

  const fetchProfileData = async () => {
    profileLoading.value = true
    profileError.value = null
    try {
      await userStore.refreshProfile()

      if (currentUserId.value) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance,currency')
          .eq('user_id', currentUserId.value)
          .maybeSingle()

        const row = wallet as { balance: number | null; currency: string | null } | null
        walletBalance.value = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: row?.currency || 'USD',
        }).format(row?.balance ?? 0)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Profile sync failed'
      profileError.value = message
      console.error('[Feed] Profile sync failed', e)
    } finally {
      profileLoading.value = false
    }
  }

  const retryProfileLoad = async () => {
    await fetchProfileData()
  }

  const initPipeline = async () => {
    if (!userStore.isAuthenticated) {
      router.push('/signin')
      return
    }

    await Promise.allSettled([
      fetchProfileData(),
      refreshFeed(),
      fetchStatuses(),
      refreshSuggestedUsers(),
      refreshTrending(),
      refreshCounters(),
    ])
  }

  const likePost = async (postId: string): Promise<boolean> => {
    if (!currentUserId.value) return false

    const post = posts.value.find((p) => p.id === postId)

    try {
      if (post?.liked_by_me) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId.value)
        if (error) throw new Error(error.message)

        post.liked_by_me = false
        post.likes_count = Math.max(0, post.likes_count - 1)
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: currentUserId.value })
        if (error) throw new Error(error.message)

        if (post) {
          post.liked_by_me = true
          post.likes_count += 1
        }
      }
      return true
    } catch (e) {
      console.error('[Feed] Like failed', e)
      return false
    }
  }

  const commentPost = (postId: string) => {
    router.push(`/posts/${postId}`)
  }

  /** Gift value is server-controlled; the client only names the catalog gift. */
  const sendPewGift = async (postId: string, giftTypeId: string, quantity = 1): Promise<boolean> => {
    const post = posts.value.find((p) => p.id === postId)
    if (!currentUserId.value || !post?.author) return false

    try {
      await $fetch('/api/pewgift/send-to-posts', {
        method: 'POST',
        body: {
          postId,
          recipientId: post.author.id,
          giftTypeId,
          quantity,
          targetType: 'post',
        },
      })
      return true
    } catch (e) {
      console.error('[Feed] Gift failed', e)
      return false
    }
  }

  const goToFollowers = () => router.push('/followers')
  const goToFollowing = () => router.push('/following')
  const goToUserPosts = () =>
    router.push(userUsername.value ? `/profile/${userUsername.value}` : '/profile')

  return {
    // posts
    posts,
    feedItems,
    postsLoading,
    hasMorePosts,
    loadingMore,
    loadMorePosts,
    refreshFeed,
    initPipeline,

    // identity
    currentUser,
    userName,
    userAvatar,
    userUsername,
    userStatus,
    walletBalance,
    isVerified,
    authStore: userStore,

    // statuses
    fetchedStatuses,
    statusLoading,
    triggerStatusViewer,
    activeSelectedStatus,

    // discovery
    suggestedUsers,
    suggestedUsersLoading,
    refreshSuggestedUsers,
    followUser,
    trendingTopics,
    trendingLoading,
    refreshTrending,

    // shell
    sidebarOpen,
    toggleSidebar,
    handleLogout,
    unreadMessages,
    unreadNotifications,
    isLiveStreaming,

    // profile
    profileLoading,
    profileError,
    retryProfileLoad,
    userFollowers,
    userFollowing,
    userPosts,
    goToFollowers,
    goToFollowing,
    goToUserPosts,

    // interactions
    likePost,
    commentPost,
    sendPewGift,
  }
}
