export interface StreamSettings {
  defaultTitle: string
  defaultCategory: string
  defaultPrivacy: string
  defaultQuality: string
  autoRecord: boolean
  enableChat: boolean
  microphone: string
  camera: string
  micVolume: number
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
  bitrate: number
  frameRate: number
  resolution: string
  hardwareAcceleration: boolean
  adaptiveBitrate: boolean
  notifyViewerJoined: boolean
  notifyViewerLeft: boolean
  notifyGiftReceived: boolean
  notifyFollowerJoined: boolean
  notifyMilestones: boolean
  allowComments: boolean
  allowGifts: boolean
  requireFollowToChat: boolean
  slowMode: boolean
  slowModeDelay: number
  enableModeration: boolean
  blockBots: boolean
  enableWebRTC: boolean
  enableHLS: boolean
  enableDASH: boolean
}

export const DEFAULT_STREAM_SETTINGS: StreamSettings = {
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
  enableWebRTC: true,
  enableHLS: true,
  enableDASH: false
}

/** The host's saved preferences for a stream (chat and gift switches). */
export const loadHostStreamPrefs = async (streamId: string): Promise<{ hostId: string | null, settings: StreamSettings }> => {
  const { getServiceClient } = await import('~/server/utils/supabase-admin')
  const db = getServiceClient()
  const { data: stream } = await db.from('streams').select('creator_id').eq('id', streamId).maybeSingle()
  const hostId = (stream as { creator_id?: string } | null)?.creator_id ?? null
  if (!hostId) return { hostId: null, settings: DEFAULT_STREAM_SETTINGS }
  const { data } = await db.from('stream_settings').select('settings').eq('user_id', hostId).maybeSingle()
  return { hostId, settings: { ...DEFAULT_STREAM_SETTINGS, ...((data?.settings ?? {}) as Partial<StreamSettings>) } }
}
