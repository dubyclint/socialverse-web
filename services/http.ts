// ============================================================================
// FILE: /services/http.ts - CENTRALIZED NETWORK ORCHESTRATOR
// ============================================================================
// Authentication is carried by the Supabase SSR cookie, which the browser
// attaches to these same-origin `/api/*` requests automatically. No bearer
// token is injected here — the cookie is the single source of truth.
// ============================================================================
import { ofetch } from 'ofetch'

export const api = ofetch.create({
  baseURL: '/api',
  credentials: 'same-origin',
  async onResponseError({ response }) {
    if (response.status === 401) {
      const { useUserStore } = await import('~/stores/user')
      await useUserStore().logout()
    }

    if (response.status >= 500) {
      console.error('[API] Server error:', response._data?.message || 'Internal Server Error')
    }
  }
})

/** Unwraps `{ data: T }` envelopes returned by the backend, passing through bare `T`. */
export const unwrap = <T>(res: unknown): T => {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: T }).data
  }
  return res as T
}
