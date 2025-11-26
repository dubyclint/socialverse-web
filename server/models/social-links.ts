// FILE: /server/models/social-links.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export type SocialPlatform = 'TWITTER' | 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'YOUTUBE' | 'TIKTOK' | 'GITHUB' | 'DISCORD'

export interface SocialLink {
  id: string
  userId: string
  platform: SocialPlatform
  username: string
  url: string
  isVerified: boolean
  followers?: number
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class SocialLinksModel {
  static async addSocialLink(userId: string, platform: SocialPlatform, username: string, url: string): Promise<SocialLink> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('social_links')
        .insert({
          userId,
          platform,
          username,
          url,
          isVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as SocialLink
    } catch (error) {
      console.error('[SocialLinksModel] Error adding social link:', error)
      throw error
    }
  }

  static async getUserSocialLinks(userId: string): Promise<SocialLink[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('userId', userId)

      if (error) throw error
      return (data || []) as SocialLink[]
    } catch (error) {
      console.error('[SocialLinksModel] Error fetching social links:', error)
      throw error
    }
  }

  static async removeSocialLink(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[SocialLinksModel] Error removing social link:', error)
      throw error
    }
  }

  static async verifySocialLink(id: string): Promise<SocialLink> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('social_links')
        .update({
          isVerified: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SocialLink
    } catch (error) {
      console.error('[SocialLinksModel] Error verifying social link:', error)
      throw error
    }
  }

  static async updateFollowerCount(id: string, followers: number): Promise<SocialLink> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('social_links')
        .update({
          followers,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SocialLink
    } catch (error) {
      console.error('[SocialLinksModel] Error updating follower count:', error)
      throw error
    }
  }
}
