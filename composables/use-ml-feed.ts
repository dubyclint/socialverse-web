// composables/use-ml-feed.ts
import { ref, readonly } from 'vue'
import type { Ref } from 'vue'

interface FeedItem {
  id: string
  type: string
  content: any
  score: number
  timestamp: string
}

interface FeedGenerationOptions {
  feedType?: string
  location?: string
  sessionLength?: number
  previousActions?: any[]
  lastRefresh?: string
  cursor?: string | null
  append?: boolean
}

interface InteractionData {
  itemId: string
  itemType: string
  type: string
  duration: number
  position: number
}

interface MLFeedReturn {
  feedItems: Ref<FeedItem[]>
  isLoading: Ref<boolean>
  error: Ref<any>
  hasMore: Ref<boolean>
  nextCursor: Ref<string | null>
  refreshToken: Ref<string | null>
  generateFeed: (options?: FeedGenerationOptions) => Promise<any>
  loadMore: () => Promise<any>
  refresh: () => Promise<any>
  trackInteraction: (interaction: InteractionData) => Promise<void>
}

export const useMLFeed = (): MLFeedReturn => {
  const feedItems = ref<FeedItem[]>([])
  const isLoading = ref(false)
  const error = ref<any>(null)
  const hasMore = ref(true)
  const nextCursor = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)

  const getDeviceType = (): string => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/mobile|android|iphone/.test(userAgent)) return 'mobile'
    if (/tablet|ipad/.test(userAgent)) return 'tablet'
    return 'desktop'
  }

  const getFallbackFeed = async (): Promise<FeedItem[]> => {
    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch('/api/feed/fallback')
      return result.data?.feed || []
    } catch (err) {
      console.error('Error fetching fallback feed:', err)
      return []
    }
  }

  const generateFeed = async (options: FeedGenerationOptions = {}): Promise<any> => {
    isLoading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const { data } = await $fetch('/api/ml/feed', {
        method: 'POST',
        body: {
          feedType: options.feedType || 'home',
          location: options.location,
          sessionLength: options.sessionLength || 0,
          previousActions: options.previousActions || [],
          lastRefresh: options.lastRefresh,
          cursor: options.cursor || nextCursor.value
        }
      })

      if (options.append && feedItems.value.length > 0) {
        feedItems.value.push(...data.feed)
      } else {
        feedItems.value = data.feed
      }

      nextCursor.value = data.nextCursor
      refreshToken.value = data.refreshToken
      hasMore.value = !!data.nextCursor

      return data
    } catch (err: any) {
      error.value = err
      console.error('Feed generation error:', err)

      if (!options.append) {
        feedItems.value = await getFallbackFeed()
      }

      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = async (): Promise<any> => {
    if (!hasMore.value || isLoading.value) return
    return await generateFeed({
      append: true,
      cursor: nextCursor.value || undefined
    })
  }

  const refresh = async (): Promise<any> => {
    nextCursor.value = null
    return await generateFeed()
  }

  const trackInteraction = async (interaction: InteractionData): Promise<void> => {
    try {
      const { $fetch } = useNuxtApp()
      await $fetch('/api/ml/interaction', {
        method: 'POST',
        body: {
          itemId: interaction.itemId,
          itemType: interaction.itemType,
          type: interaction.type,
          duration: interaction.duration,
          position: interaction.position,
          deviceType: getDeviceType()
        }
      })
    } catch (err) {
      console.error('Error tracking interaction:', err)
    }
  }

  return {
    feedItems: readonly(feedItems),
    isLoading: readonly(isLoading),
    error: readonly(error),
    hasMore: readonly(hasMore),
    nextCursor: readonly(nextCursor),
    refreshToken: readonly(refreshToken),
    generateFeed,
    loadMore,
    refresh,
    trackInteraction
  }
}
