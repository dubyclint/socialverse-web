// FILE 1: server/api/stream/settings.get.ts - GET USER STREAM SETTINGS
// ============================================================================
// RETRIEVE USER'S STREAM SETTINGS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Get user settings
    const { data: settings, error } = await supabase
      .from('stream_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Return default settings if not found
    if (!settings) {
      return {
        success: true,
        data: {
          user_id: user.id,
          defaultTitle: 'My Stream',
          defaultCategory: 'just-chatting',
          defaultPrivacy: 'public',
          defaultQuality: '720p',
          autoRecord: true,
          enableChat: true,
          microphone: 'default',
          camera: 'default',
          micVolume: 80,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          bitrate: 2500,
          frameRate: 30,
          resolution: '1280x720',
          hardwareAcceleration: true,
          adaptiveBitrate: true,
          notifyViewerJoined: true,
          notifyViewerLeft: false,
          notifyGiftReceived: true,
          notifyFollowerJoined: true,
          notifyMilestones: true,
          allowComments: true,
          allowGifts: true,
          requireFollowToChat: false,
          slowMode: false,
          slowModeDelay: 5,
          enableModeration: true,
          blockBots: true,
          streamKey: `sk_${user.id}_${Date.now()}`,
          rtmpServer: 'rtmp://stream.socialverse.com/live',
          enableWebRTC: true,
          enableHLS: true,
          enableDASH: false
        }
      }
    }

    return {
      success: true,
      data: settings
    }
  } catch (error: any) {
    console.error('Get settings error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get settings'
    })
  }
})
