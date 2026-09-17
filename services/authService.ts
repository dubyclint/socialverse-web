// services/authService.ts
export const authService = {
  async getSession() {
    const client = useSupabaseClient()
    return await client.auth.getSession()
  },

  async signIn(email: string, password: string) {
    const client = useSupabaseClient()
    return await client.auth.signInWithPassword({ email, password })
  },

  async signOut() {
    const client = useSupabaseClient()
    return await client.auth.signOut()
  }
}
