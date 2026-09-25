// services/rolesService.ts
import { getSupabaseClient } from '~/lib/supabase-factory'

export const rolesService = {
  async fetchAllRoles() {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase client not initialized')
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('level', { ascending: true })
    if (error) throw error
    return data
  },

  async fetchAllPermissions() {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase client not initialized')
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('resource', { ascending: true })
    if (error) throw error
    return data
  }
}
