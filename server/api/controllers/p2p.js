// FILE: /server/api/controllers/p2p.js
// REFACTORED: Using lazy-loaded models

import * as P2PProfile from '~/server/models/p2p-profile'
import * as UserWallet from '~/server/models/user-wallet'

export class P2PController {
  /**
   * Create P2P profile
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
  static async createP2PProfile(req, res) {
    try {
      const {
        user_id,
        display_name,
        bio,
        payment_methods,
        verification_level,
        trading_preferences,
        time_zone,
        languages
      } = req.body

      // Check if profile already exists
      const existingProfile = await P2PProfile.findByUserId(user_id)

      if (existingProfile) {
        return res.status(400).json({
          error: 'P2P profile already exists for this user'
        })
      }

      const profile = await P2PProfile.create({
        user_id,
        display_name,
        bio,
        payment_methods,
        verification_level: verification_level || 'basic',
        trading_preferences,
        time_zone,
        languages,
        reputation_score: 0,
        total_trades: 0,
        created_at: new Date().toISOString()
      })

      return res.status(201).json({
        success: true,
        message: 'P2P profile created successfully',
        data: profile
      })
    } catch (error) {
      console.error('Error creating P2P profile:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create P2P profile'
      })
    }
  }

  /**
   * Get P2P profile
   */
  static async getP2PProfile(req, res) {
    try {
      const { user_id } = req.params

      const profile = await P2PProfile.findByUserId(user_id)

      if (!profile) {
        return res.status(404).json({ error: 'P2P profile not found' })
      }

      return res.status(200).json({
        success: true,
        data: profile
      })
    } catch (error) {
      console.error('Error fetching P2P profile:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch P2P profile'
      })
    }
  }

  /**
   * Update P2P profile
   */
  static async updateP2PProfile(req, res) {
    try {
      const { user_id } = req.params
      const updates = req.body

      const profile = await P2PProfile.updateByUserId(user_id, updates)

      return res.status(200).json({
        success: true,
        message: 'P2P profile updated successfully',
        data: profile
      })
    } catch (error) {
      console.error('Error updating P2P profile:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update P2P profile'
      })
    }
  }
}
