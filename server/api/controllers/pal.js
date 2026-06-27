// FILE: /server/api/controllers/pal.js
// REFACTORED: Using lazy-loaded models

import * as Pal from '~/server/models/pal'
import * as Profile from '~/server/models/profile'

export class PalController {
  /**
   * Send pal request
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async sendPalRequest(req, res) {
    try {
      const { requester_id, requested_id, message } = req.body

      if (requester_id === requested_id) {
        return res.status(400).json({
          error: 'Cannot send pal request to yourself'
        })
      }

      // Check if request already exists
      const existingRequest = await Pal.findBetweenUsers(
        requester_id,
        requested_id
      )

      if (existingRequest) {
        if (existingRequest.status === 'accepted') {
          return res.status(400).json({ error: 'You are already pals' })
        } else if (existingRequest.status === 'pending') {
          return res.status(400).json({
            error: 'Pal request already pending'
          })
        }
      }

      // Verify requested user exists
      const requestedProfile = await Profile.findById(requested_id)

      if (!requestedProfile) {
        return res.status(404).json({ error: 'Requested user not found' })
      }

      const palRequest = await Pal.create({
        requester_id,
        requested_id,
        message,
        status: 'pending',
        created_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'Pal request sent successfully',
        data: palRequest
      })
    } catch (error) {
      console.error('Error sending pal request:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to send pal request'
      })
    }
  }

  /**
   * Accept pal request
   */
  static async acceptPalRequest(req, res) {
    try {
      const { pal_id } = req.params

      const pal = await Pal.findById(pal_id)

      if (!pal) {
        return res.status(404).json({ error: 'Pal request not found' })
      }

      if (pal.status !== 'pending') {
        return res.status(400).json({
          error: 'Only pending requests can be accepted'
        })
      }

      const updatedPal = await Pal.update(pal_id, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Pal request accepted',
        data: updatedPal
      })
    } catch (error) {
      console.error('Error accepting pal request:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to accept pal request'
      })
    }
  }

  /**
   * Reject pal request
   */
  static async rejectPalRequest(req, res) {
    try {
      const { pal_id } = req.params

      const pal = await Pal.findById(pal_id)

      if (!pal) {
        return res.status(404).json({ error: 'Pal request not found' })
      }

      if (pal.status !== 'pending') {
        return res.status(400).json({
          error: 'Only pending requests can be rejected'
        })
      }

      const updatedPal = await Pal.update(pal_id, {
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Pal request rejected',
        data: updatedPal
      })
    } catch (error) {
      console.error('Error rejecting pal request:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to reject pal request'
      })
    }
  }
}
