import { api } from './http'
import type { FeedTab, RankedPost } from '~/server/utils/feed-ranker'

interface PostsFeedResponse {
  success: boolean
  data: {
    posts: RankedPost[]
    tab: FeedTab
    page: number
    limit: number
    hasMore: boolean
  }
}

interface CreatePostResponse {
  success: boolean
  post?: { id: string }
  message?: string
}

export const postService = {
  /** Ranked posts without ad slots. `/api/feed` is the ad-aware variant. */
  async fetchFeed(tab: FeedTab = 'for-you', page = 1) {
    const res = await api<PostsFeedResponse>('/posts/feed', { query: { tab, page } })
    return res.data
  },

  async createPost(content: string, options: { privacy?: string, tags?: string[] } = {}) {
    return await api<CreatePostResponse>('/posts/create', {
      method: 'POST',
      body: { content, privacy: options.privacy ?? 'public', tags: options.tags ?? [] }
    })
  }
}
