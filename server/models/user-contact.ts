import { getSupabaseClient } from '~/server/utils/database'

export interface UserContact {
  id: string
  user_id: string
  contact_name: string
  contact_phone?: string
  contact_email?: string
  is_registered?: boolean
  registered_user_id?: string
  created_at?: string
}

export const UserContact: any = {
  async create(payload: any) {
    try {
      const supabase = await getSupabaseClient()
      const { data, error } = await supabase
        .from('user_contacts')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      return data
    } catch (err) {
      console.error('[UserContact adapter] create error', err)
      throw err
    }
  },

  async findAll(opts: any) {
    try {
      const supabase = await getSupabaseClient()
      let q = supabase.from('user_contacts').select('*')
      if (opts?.where?.user_id) q = q.eq('user_id', opts.where.user_id)
      const { data, error } = await q.order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('[UserContact adapter] findAll error', err)
      throw err
    }
  }
}
