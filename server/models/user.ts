// Minimal User adapter to satisfy legacy controllers during TS remediation
import { getSupabaseClient } from '~/server/utils/database'

export interface User {
  id: string
  username?: string
  phone?: string
  email?: string
}

export const User: any = {
  async findOne(opts: any) {
    const where = opts?.where || {}
    const supabase = await getSupabaseClient()
    try {
      let q = supabase.from('users').select('*')
      if (where.phone) q = q.eq('phone', where.phone)
      if (where.email) q = q.eq('email', where.email)
      if (where.id) q = q.eq('id', where.id)
      const { data, error } = await q.maybeSingle()
      if (error) throw error
      return data || null
    } catch (err) {
      console.error('[User adapter] findOne error', err)
      throw err
    }
  }
}
