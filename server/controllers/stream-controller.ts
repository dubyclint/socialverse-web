// server/controllers/stream-controller.ts
// CORRECTED - Import and use StreamModel

import type { H3Event } from 'h3'
import { StreamModel } from '../models/stream'
import { NotificationModel } from '../models/notification'
import { RankModel } from '../models/rank'

export class StreamController {
  /**
   * Create stream
   */
  static async createStream(event: H3Event, data: any) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE StreamModel
      const stream = await StreamModel.create({
        userId,
        title: data.title,
        description: data.description,
        category: data.category,
        isLive: false
      })

      // ✅ USE RankModel - Award points
      await RankModel.addPoints(userId, 25)

      return {
        success: true,
        data: stream,
        message: 'Stream created'
      }
    } catch (error) {
      console.error('[StreamController] Create stream error:', error)
      throw error
    }
  }

  /**
   * Start stream
   */
  static async startStream(event: H3Event, streamId: string) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE StreamModel
      const stream = await StreamModel.startStream(streamId, userId)

      // ✅ Notify followers
      const { data: followers } = await supabase
        .from('pals')
        .select('user_id')
        .eq('pal_id', userId)
        .eq('status', 'accepted')

      if (followers) {
        for (const follower of followers) {
          await NotificationModel.create({
            userId: follower.user_id,
            actorId: userId,
            type: 'stream',
            title: 'Stream Started',
            message: `${stream.title} is now live!`,
            data: { streamId }
          })
        }
      }

      return {
        success: true,
        data: stream,
        message: 'Stream started'
      }
    } catch (error) {
      console.error('[StreamController] Start stream error:', error)
      throw error
    }
  }

  /**
   * End stream
   */
  static async endStream(event: H3Event, streamId: string) {
    try {
      const userId = event.context.user?.id

      if (!userId) {
        throw new Error('Not authenticated')
      }

      // ✅ USE StreamModel
      const stream = await StreamModel.endStream(streamId, userId)

      return {
        success: true,
        data: stream,
        message: 'Stream ended'
      }
    } catch (error) {
      console.error('[StreamController] End stream error:', error)
      throw error
    }
  }

  /**
   * Get stream details
   */
  static async getStream(event: H3Event, streamId: string) {
    try {
      // ✅ USE StreamModel
      const stream = await StreamModel.getById(streamId)

      if (!stream) {
        return { success: false, error: 'Stream not found' }
      }

      return {
        success: true,
        data: stream,
        message: 'Stream retrieved'
      }
    } catch (error) {
      console.error('[StreamController] Get stream error:', error)
      throw error
    }
  }

  /**
   * Get live streams
   */
  static async getLiveStreams(event: H3Event) {
    try {
      // ✅ USE StreamModel
      const streams = await StreamModel.getLiveStreams()

      return {
        success: true,
        data: streams,
        message: 'Live streams retrieved'
      }
    } catch (error) {
      console.error('[StreamController] Get live streams error:', error)
      throw error
    }
  }
}

export default StreamController
