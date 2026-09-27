export interface DiscoveryItem {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  kind: 'stream' | 'user'
  stream_id?: string
  viewers?: number
  isOnline?: boolean
}

export interface DiscoveryFeedResponse {
  strategy: 'live' | 'social' | 'external'
  items: DiscoveryItem[]
}
