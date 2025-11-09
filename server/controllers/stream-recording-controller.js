// server/controllers/streamRecordingController.js
import { createClient } from '@supabase/supabase-js'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs/promises'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export class StreamRecordingController {
  // Start automatic recording when stream begins
  async startRecording(streamId, streamUrl, userId) {
    try {
      const recordingId = `rec_${streamId}_${Date.now()}`
      const outputPath = `recordings/${recordingId}.mp4`
      
      // Create recording entry in database
      const { data: recording } = await supabase
        .from('stream_recordings')
        .insert({
          id: recordingId,
          stream_id: streamId,
          user_id: userId,
          status: 'recording',
          started_at: new Date().toISOString(),
          file_path: outputPath
        })
        .select()
        .single()

      // Start FFmpeg recording process
      const ffmpegProcess = ffmpeg(streamUrl)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-preset fast',
          '-crf 23',
          '-maxrate 2M',
          '-bufsize 4M'
        ])
        .output(outputPath)
        .on('start', () => {
          console.log(`Recording started: ${recordingId}`)
        })
        .on('end', async () => {
          await this.finalizeRecording(recordingId)
        })
        .on('error', async (err) => {
          console.error('Recording error:', err)
          await this.handleRecordingError(recordingId, err.message)
        })

      ffmpegProcess.run()
      
      // Store process reference for later control
      global.activeRecordings = global.activeRecordings || new Map()
      global.activeRecordings.set(recordingId, ffmpegProcess)

      return { success: true, recordingId }
    } catch (error) {
      console.error('Start recording error:', error)
      return { success: false, error: error.message }
    }
  }

  // Stop recording and process for VOD
  async stopRecording(recordingId) {
    try {
      const process = global.activeRecordings?.get(recordingId)
      if (process) {
        process.kill('SIGTERM')
        global.activeRecordings.delete(recordingId)
      }

      await supabase
        .from('stream_recordings')
        .update({
          status: 'processing',
          ended_at: new Date().toISOString()
        })
        .eq('id', recordingId)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Create highlight clips from recordings
  async createHighlight(recordingId, startTime, endTime, title) {
    try {
      const { data: recording } = await supabase
        .from('stream_recordings')
        .select('file_path')
        .eq('id', recordingId)
        .single()

      const highlightId = `highlight_${Date.now()}`
      const outputPath = `highlights/${highlightId}.mp4`

      return new Promise((resolve, reject) => {
        ffmpeg(recording.file_path)
          .seekInput(startTime)
          .duration(endTime - startTime)
          .output(outputPath)
          .on('end', async () => {
            const { data } = await supabase
              .from('stream_highlights')
              .insert({
                id: highlightId,
                recording_id: recordingId,
                title,
                start_time: startTime,
                end_time: endTime,
                file_path: outputPath,
                created_at: new Date().toISOString()
              })
              .select()
              .single()

            resolve({ success: true, highlight: data })
          })
          .on('error', (err) => {
            reject({ success: false, error: err.message })
          })
          .run()
      })
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get VOD library for user
  async getVODLibrary(userId, page = 1, limit = 20) {
    try {
      const { data: recordings, count } = await supabase
        .from('stream_recordings')
        .select('*, stream_highlights(*)', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      return {
        success: true,
        recordings,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async finalizeRecording(recordingId) {
    try {
      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(recordingId)
      
      // Get file stats
      const { data: recording } = await supabase
        .from('stream_recordings')
        .select('file_path')
        .eq('id', recordingId)
        .single()

      const stats = await fs.stat(recording.file_path)
      
      await supabase
        .from('stream_recordings')
        .update({
          status: 'completed',
          file_size: stats.size,
          thumbnail_path: thumbnailPath,
          processed_at: new Date().toISOString()
        })
        .eq('id', recordingId)

    } catch (error) {
      console.error('Finalize recording error:', error)
    }
  }

  async generateThumbnail(recordingId) {
    const { data: recording } = await supabase
      .from('stream_recordings')
      .select('file_path')
      .eq('id', recordingId)
      .single()

    const thumbnailPath = `thumbnails/${recordingId}.jpg`
    
    return new Promise((resolve, reject) => {
      ffmpeg(recording.file_path)
        .screenshots({
          timestamps: ['10%'],
          filename: `${recordingId}.jpg`,
          folder: 'thumbnails/',
          size: '320x180'
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', reject)
    })
  }
}
