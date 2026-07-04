// ============================================================================
// FILE: /services/profileService.ts - BUSINESS LOGIC LAYER
// ============================================================================
import { api, unwrap } from './api'
import type { Profile, ProfileUpdateInput } from '~/types/profile'

export const profileService = {
  // Fetch current user via our centralized API fetcher
  async getMe(): Promise<Profile> {
    return unwrap<Profile>(await api('/profile/me'))
  },

  // Update profile via centralized API
  async update(payload: ProfileUpdateInput): Promise<Profile> {
    return unwrap<Profile>(await api('/profile/update', { 
      method: 'POST', 
      body: payload 
    }))
  },

  // Upload user avatar
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('avatar', file)

    // Note: Do not manually set Content-Type; 
    // the browser will set it with the correct boundary for FormData.
    const response = await api('/profile/avatar', {
      method: 'POST',
      body: formData
    })

    const result = unwrap<{ avatar_url: string }>(response)
    return result.avatar_url
  },

  // Direct Supabase interaction for specific settings
  async updateStreamConfig(userId: string, data: { title: string; quality: string }) {
    const client = useSupabaseClient()
    const { data: updated, error } = await client
      .from('profiles')
      .update({
        default_stream_title: data.title,
        stream_quality: data.quality
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return updated
  }
}
