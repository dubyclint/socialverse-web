// FILE : server/api/stream/settings.post.ts - SAVE USER STREAM SETTINGS
// ============================================================================
// SAVE/UPDATE USER'S STREAM SETTINGS
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface StreamSettings {
  defaultTitle?: string
  defaultCategory?: string
  defaultPrivacy?: string
  defaultQuality?: string
  autoRecord?: boolean
  enableChat?: boolean
  microphone?: string
  camera?: string
  micVolume?: number
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  bitrate?: number
  frameRate?: number
  resolution?: string
  hardwareAcceleration?: boolean
  adaptiveBitrate?: boolean
  notifyViewerJoined?: boolean
  notifyViewerLeft?: boolean
  notifyGiftReceived?: boolean
  notifyFollowerJoined?: boolean
  notifyMilestones?: boolean
  allowComments?: boolean
  allowGifts?: boolean
  requireFollowToChat?: boolean
  slowMode?: boolean
  slowModeDelay?: number
  enableModeration?: boolean
  blockBots?: boolean
  enableWebRTC?: boolean
  enableHLS?: boolean
  enableDASH?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<StreamSettings>(event)
    const supabase = await serverSupabaseClient(event)

    // Validate settings
    if (body.bitrate && (body.bitrate < 500 || body.bitrate > 5000)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bitrate must be between 500 and 5000 kbps'
      })
    }

    if (body.frameRate && ![24, 30, 60].includes(body.frameRate)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Frame rate must be 24, 30, or 60'
      })
    }

    if (body.micVolume && (body.micVolume < 0 || body.micVolume > 100)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Microphone volume must be between 0 and 100'
      })
    }

    if (body.slowModeDelay && (body.slowModeDelay < 1 || body.slowModeDelay > 60)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Slow mode delay must be between 1 and 60 seconds'
      })
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('stream_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const settingsData = {
      ...body,
      user_id: user.id,
      updated_at: new Date().toISOString()
    }

    let result

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('stream_settings')
        .update(settingsData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('stream_settings')
        .insert({
          ...settingsData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return {
      success: true,
      data: result,
      message: 'Settings saved successfully'
    }
  } catch (error: any) {
    console.error('Save settings error:', error)
    throw error
  }
})
