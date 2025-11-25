// server/models/pal.ts
// Pal (Friend) Model - User relationships

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface Pal {
  id: string
  user_id: string
  pal_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at: string
}

export interface CreatePalInput {
  userId: string
  palId: string
}

export class PalModel {
  static async create(input: CreatePalInput): Promise<Pal> {
    try {
      const { data, error } = await supabase
        .from('pals')
        .insert({
          user_id: input.userId,
          pal_id: input.palId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as Pal
    } catch (error) {
      console.error('[PalModel] Create error:', error)
      throw error
    }
  }

  static async accept(userId: string, palId: string): Promise<Pal> {
    try {
      const { data, error } = await supabase
        .from('pals')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pal_id', palId)
        .select()
        .single()

      if (error) throw error
      return data as Pal
    } catch (error) {
      console.error('[PalModel] Accept error:', error)
      throw error
    }
  }

  static async block(userId: string, palId: string): Promise<Pal> {
    try {
      const { data, error } = await supabase
        .from('pals')
        .update({
          status: 'blocked',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pal_id', palId)
        .select()
        .single()

      if (error) throw error
      return data as Pal
    } catch (error) {
      console.error('[PalModel] Block error:', error)
      throw error
    }
  }

  static async remove(userId: string, palId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pals')
        .delete()
        .eq('user_id', userId)
        .eq('pal_id', palId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[PalModel] Remove error:', error)
      throw error
    }
  }

  static async getPals(userId: string, status: string = 'accepted', limit: number = 50): Promise<Pal[]> {
    try {
      const { data, error } = await supabase
        .from('pals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as Pal[]) || []
    } catch (error) {
      console.error('[PalModel] Get pals error:', error)
      throw error
    }
  }

  static async getPendingRequests(userId: string): Promise<Pal[]> {
    try {
      const { data, error } = await supabase
        .from('pals')
        .select('*')
        .eq('pal_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as Pal[]) || []
    } catch (error) {
      console.error('[PalModel] Get pending requests error:', error)
      throw error
    }
  }

  static async arePals(userId1: string, userId2: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('pals')
        .select('id')
        .eq('user_id', userId1)
        .eq('pal_id', userId2)
        .eq('status', 'accepted')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return !!data
    } catch (error) {
      console.error('[PalModel] Are pals error:', error)
      throw error
    }
  }

  static async getCount(userId: string, status: string = 'accepted'): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('pals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', status)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[PalModel] Get count error:', error)
      throw error
    }
  }
}

export default PalModel
