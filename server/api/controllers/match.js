// FILE: /server/api/controllers/match.js
// REFACTORED: Using lazy-loaded models

import * as MatchRequest from '~/server/models/match-request'
import * as Profile from '~/server/models/profile'

export class MatchController {
  /**
   * Create match request
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async createMatchRequest(req, res) {
    try {
      const {
        requester_id,
        target_user_id,
        match_type,
        location,
        preferred_date,
        preferred_time,
        activity_type,
        message,
        budget_range
      } = req.body

      if (requester_id === target_user_id) {
        return res.status(400).json({
          error: 'Cannot send match request to yourself'
        })
      }

      // Check if there's already a pending match request
      const existingRequest = await MatchRequest.findPendingBetweenUsers(
        requester_id,
        target_user_id
      )

      if (existingRequest) {
        return res.status(400).json({
          error: 'Match request already exists between these users'
        })
      }

      // Verify target user exists
      const targetProfile = await Profile.findById(target_user_id)

      if (!targetProfile) {
        return res.status(404).json({ error: 'Target user not found' })
      }

      // Create match request
      const matchRequest = await MatchRequest.create({
        requester_id,
        target_user_id,
        match_type,
        location,
        preferred_date,
        preferred_time,
        activity_type,
        message,
        budget_range,
        status: 'pending',
        created_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'Match request created successfully',
        data: matchRequest
      })
    } catch (error) {
      console.error('Error creating match request:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create match request'
      })
    }
  }

  /**
   * Accept match request
   */
  static async acceptMatchRequest(req, res) {
    try {
      const { request_id } = req.params

      const matchRequest = await MatchRequest.findById(request_id)

      if (!matchRequest) {
        return res.status(404).json({ error: 'Match request not found' })
      }

      if (matchRequest.status !== 'pending') {
        return res.status(400).json({
          error: 'Only pending requests can be accepted'
        })
      }

      const updatedRequest = await MatchRequest.update(request_id, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Match request accepted',
        data: updatedRequest
      })
    } catch (error) {
      console.error('Error accepting match request:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to accept match request'
      })
    }
  }

  /**
   * Reject match request
   */
  static async rejectMatchRequest(req, res) {
    try {
      const { request_id } = req.params

      const matchRequest = await MatchRequest.findById(request_id)

      if (!matchRequest) {
        return res.status(404).json({ error: 'Match request not found' })
      }

      if (matchRequest.status !== 'pending') {
        return res.status(400).json({
          error: 'Only pending requests can be rejected'
        })
      }

      const updatedRequest = await MatchRequest.update(request_id, {
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Match request rejected',
        data: updatedRequest
      })
    } catch (error) {
      console.error('Error rejecting match request:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to reject match request'
      })
    }
  }
}
