// Shared API response envelope used by server routes and client composables.
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  total?: number
}

export interface PaginatedResult<T> {
  posts?: T[]
  items?: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
