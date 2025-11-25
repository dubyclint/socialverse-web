// server/models/social-links.ts
// Social Links Model

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type SocialPlatform = 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'twitch' | 'facebook' | 'linkedin'

export interface SocialLink {
  id: string
  user_id: string
  platform: SocialPlatform
  username: string
  url: string
  verified: boolean
  created_at: string
  updated_at: string
}

export interface CreateSocialLinkInput {
  userId: string
  platform: SocialPlatform
  username: string
  url: string
}

export class SocialLinksModel {
  static async create(input: CreateSocialLinkInput): Promise<SocialLink> {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .insert({
          user_id: input.userId,
          platform: input.platform,
          username: input.username,
          url: input.url,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SocialLink
    } catch (error) {
      console.error('[SocialLinksModel] Create error:', error)
      throw error
    }
  }

  static async getUserLinks(userId: string): Promise<SocialLink[]> {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as SocialLink[]) || []
    } catch (error) {
      console.error('[SocialLinksModel] Get user links error:', error)
      throw error
    }
  }

  static async verify(linkId: string): Promise<SocialLink> {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .update({
          verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', linkId)
        .select()
        .single()

      if (error) throw error
      return data as SocialLink
    } catch (error) {
      console.error('[SocialLinksModel] Verify error:', error)
      throw error
    }
  }

  static async delete(linkId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', linkId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[SocialLinksModel] Delete error:', error)
      throw error
    }
  }
}

export default SocialLinksModel
