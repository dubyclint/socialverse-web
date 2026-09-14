// services/userService.ts
const getSupabase = () => {
  const nuxtApp = useNuxtApp()
  return nuxtApp.$supabase?.client || (nuxtApp as any).$supabase
}

export const userService = {
  async getSession() {
    const supabase = getSupabase()
    if (!supabase) return { session: null, error: 'Supabase not initialized' }
    return await supabase.auth.getSession()
  },

  async getProfile(targetUserId: string) {
    const supabase = getSupabase()
    if (!supabase) return { data: null, error: 'Supabase not initialized' }
    return await supabase.from('profiles').select('*').eq('user_id', targetUserId).maybeSingle()
  },

  async signOut() {
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
  }
}
