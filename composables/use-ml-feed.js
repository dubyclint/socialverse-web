// Nuxt composable for ML-powered feed
export const useMLFeed = () => {
  const feedItems = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const hasMore = ref(true)
  const nextCursor = ref(null)
  const refreshToken = ref(null)

  const generateFeed = async (options = {}) => {
    isLoading.value = true
    error.value = null

    try {
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

    } catch (err) {
      error.value = err
      console.error('Feed generation error:', err)
      
      // Return fallback feed on error
      if (!options.append) {
        feedItems.value = await getFallbackFeed()
      }
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = async () => {
    if (!hasMore.value || isLoading.value) return
    
    return await generateFeed({ 
      append: true, 
      cursor: nextCursor.value 
    })
  }

  const refresh = async () => {
    nextCursor.value = null
    return await generateFeed()
  }

  const trackInteraction = async (interaction) => {
    try {
      await $fetch('/api/ml/interaction', {
        method: 'POST',
        body: {
          itemId: interaction.itemId,
          itemType: interaction.itemType,
          type: interaction.type,
          duration: interaction.duration,
          position: interaction.position,
          deviceType: getDeviceType(),
          sessionId: getSessionId(),
          feedGenerationId: interaction.feedGenerationId,
          banditContext: interaction.banditContext,
          campaignId: interaction.campaignId,
          experimentId: interaction.experimentId,
          experimentAssignment: interaction.experimentAssignment,
          conversionValue: interaction.conversionValue
        }
      })
    } catch (err) {
      console.error('Interaction tracking error:', err)
      // Don't throw - tracking failures shouldn't break UX
    }
  }

  const getRecommendations = async (type, options = {}) => {
    try {
      const { data } = await $fetch(`/api/ml/recommendations/${type}`, {
        query: options
      })
      return data
    } catch (err) {
      console.error('Recommendations error:', err)
      return { [type.replace('-', '_')]: [] }
    }
  }

  return {
    // State
    feedItems: readonly(feedItems),
    isLoading: readonly(isLoading),
    error: readonly(error),
    hasMore: readonly(hasMore),
    
    // Actions
    generateFeed,
    loadMore,
    refresh,
    trackInteraction,
    getRecommendations
  }
}

// Helper functions
function getDeviceType() {
  if (process.client) {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile'
    }
    if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet'
    }
  }
  return 'desktop'
}

function getSessionId() {
  if (process.client) {
    let sessionId = sessionStorage.getItem('ml_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('ml_session_id', sessionId)
    }
    return sessionId
  }
  return null
}

async function getFallbackFeed() {
  // Return popular/trending content as fallback
  try {
    const { data } = await $fetch('/api/posts/trending')
    return data.posts || []
  } catch {
    return []
  }
}
