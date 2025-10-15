// server/routes/streamRecordingRoutes.js
import { Router } from 'express'
import { StreamRecordingController } from '../controllers/streamRecordingController.js'

const router = Router()
const recordingController = new StreamRecordingController()

// Start recording
router.post('/start', async (req, res) => {
  const { streamId, streamUrl, userId } = req.body
  const result = await recordingController.startRecording(streamId, streamUrl, userId)
  res.json(result)
})

// Stop recording
router.post('/stop/:recordingId', async (req, res) => {
  const result = await recordingController.stopRecording(req.params.recordingId)
  res.json(result)
})

// Create highlight clip
router.post('/highlight', async (req, res) => {
  const { recordingId, startTime, endTime, title } = req.body
  const result = await recordingController.createHighlight(recordingId, startTime, endTime, title)
  res.json(result)
})

// Get VOD library
router.get('/vod/:userId', async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const result = await recordingController.getVODLibrary(req.params.userId, parseInt(page), parseInt(limit))
  res.json(result)
})

export default router
