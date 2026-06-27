// ============================================================================
// FILE: /composables/use-ml-feed.ts
// Description: ML Feed Composable - Handles algorithmic feeds and user telemetry tracking.
// ============================================================================
import { ref, readonly } from 'vue'
import type { Ref } from 'vue'
import { useNuxtApp } from '#app'

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
  feedItems: Ref<readonly FeedItem[]>
  isLoading: Ref<readonly boolean>
  error: Ref<readonly any>
  hasMore: Ref<readonly boolean>
  nextCursor: Ref<readonly string | null>
  refreshToken: Ref<readonly string | null>
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

  /**
   * Safe parser for evaluating standard client device categories
   */
  const getDeviceType = (): string => {
    // ✅ SSR Guard: Prevent compilation or server exceptions if window/navigator isn't present
    if (typeof navigator === 'undefined') return 'desktop'
    
    const userAgent = navigator.userAgent.toLowerCase()
    if (/mobile|android|iphone/.test(userAgent)) return 'mobile'
    if (/tablet|ipad/.test(userAgent)) return 'tablet'
    return 'desktop'
  }

  /**
   * Retrieve fallback values if upstream ML inference models time out or err
   */
  const getFallbackFeed = async (): Promise<FeedItem[]> => {
    try {
      const { $fetch } = useNuxtApp()
      const result = await $fetch<any>('/api/feed/fallback')
      return result.data?.feed || []
    } catch (err) {
      console.error('[ML Feed] Error fetching fallback feed:', err)
      return []
    }
  }

  /**
   * Requests feed updates from the recommendation matrix
   */
  const generateFeed = async (options: FeedGenerationOptions = {}): Promise<any> => {
    isLoading.value = true
    error.value = null

    try {
      const { $fetch } = useNuxtApp()
      const response = await $fetch<any>('/api/ml/feed', {
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

      const data = response?.data || response

      if (options.append && feedItems.value.length > 0) {
        feedItems.value.push(...(data.feed || []))
      } else {
        feedItems.value = data.feed || []
      }

      nextCursor.value = data.nextCursor || null
      refreshToken.value = data.refreshToken || null
      hasMore.value = !!data.nextCursor

      return data
    } catch (err: any) {
      error.value = err
      console.error('[ML Feed] Feed generation engine exception:', err)

      if (!options.append) {
        feedItems.value = await getFallbackFeed()
      }

      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Paginate downstream feed sets using target page states
   */
  const loadMore = async (): Promise<any> => {
    if (!hasMore.value || isLoading.value) return
    return await generateFeed({
      append: true,
      cursor: nextCursor.value || undefined
    })
  }

  /**
   * Wipe active cursors and restart target sequence
   */
  const refresh = async (): Promise<any> => {
    nextCursor.value = null
    return await generateFeed()
  }

  /**
   * Feed back user retention parameters into model logs
   */
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
      console.error('[ML Feed] Telemetry tracing failure:', err)
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
