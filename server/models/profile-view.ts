// server/models/profile-view.ts
// Profile View Model - Track profile visits

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ProfileView {
  id: string
  profile_id: string
  viewer_id: string
  created_at: string
}

export interface CreateProfileViewInput {
  profileId: string
  viewerId: string
}

export class ProfileViewModel {
  static async create(input: CreateProfileViewInput): Promise<ProfileView> {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .insert({
          profile_id: input.profileId,
          viewer_id: input.viewerId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as ProfileView
    } catch (error) {
      console.error('[ProfileViewModel] Create error:', error)
      throw error
    }
  }

  static async getProfileViews(profileId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, count, error } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact' })
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { views: (data as ProfileView[]) || [], total: count || 0 }
    } catch (error) {
      console.error('[ProfileViewModel] Get profile views error:', error)
      throw error
    }
  }

  static async getViewCount(profileId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[ProfileViewModel] Get view count error:', error)
      throw error
    }
  }

  static async getRecentViewers(profileId: string, limit: number = 10): Promise<ProfileView[]> {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as ProfileView[]) || []
    } catch (error) {
      console.error('[ProfileViewModel] Get recent viewers error:', error)
      throw error
    }
  }
}

export default ProfileViewModel
