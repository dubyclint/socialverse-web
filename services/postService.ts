// services/postService.ts
import { api } from '~/lib/api' // Assuming a centralized api orchestrator

export const postService = {
  async fetchFeed(feedType: string, page: number) {
    return await api(`/api/posts/feed/${feedType}?page=${page}`)
  },
  async createPost(content: string) {
    return await api('/api/posts/create', { method: 'POST', body: { content } })
  },
  async likePost(postId: string) {
    return await api(`/api/posts/${postId}/like`, { method: 'POST' })
  }
}
