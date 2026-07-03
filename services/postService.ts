import { api } from '~/lib/api'

export const postService = {
  // We use the generic <T> to get type safety for the responses
  async fetchFeed(feedType: string, page: number) {
    return await api<{ posts: any[] }>(`/posts/feed/${feedType}`, {
      query: { page }
    })
  },
  
  async createPost(content: string) {
    return await api('/posts/create', { 
      method: 'POST', 
      body: { content } 
    })
  }
}
