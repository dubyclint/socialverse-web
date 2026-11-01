// services/authService.ts
export const authService = {
  async getSession() {
    const client = useSupabaseClient()
    return await client.auth.getSession()
  },

  /** Signs in through the server so account lockout and IP rate limits apply, then adopts the session. */
  async signIn(email: string, password: string) {
    const client = useSupabaseClient()
    try {
      const tokens = await $fetch<{ access_token: string, refresh_token: string }>('/api/auth/login', { method: 'POST', body: { email, password } })
      return await client.auth.setSession(tokens)
    } catch (err) {
      const message = (err as { data?: { statusMessage?: string }, statusMessage?: string })?.data?.statusMessage
        || (err as { statusMessage?: string })?.statusMessage || 'Sign in failed'
      return { data: { user: null, session: null }, error: new Error(message) }
    }
  },

  async signUp(email: string, password: string, options?: { data?: Record<string, unknown> }) {
    const client = useSupabaseClient()
    return await client.auth.signUp({ email, password, options })
  },

  async signOut() {
    const client = useSupabaseClient()
    return await client.auth.signOut()
  }
}
