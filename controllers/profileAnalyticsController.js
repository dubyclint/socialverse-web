// controllers/profileAnalyticsController.js - Profile Analytics Management Controller
import { ProfileView } from '../models/profileView.js';
import { ProfileAnalytics } from '../models/profileAnalytics.js';
import { ProfilePrivacySettings } from '../models/profilePrivacySettings.js';
import { PremiumFeature } from '../models/premiumFeature.js';

export class ProfileAnalyticsController {
  
  /**
   * Record a profile view
   * POST /api/profile-analytics/view
   */
  static async recordView(req, res) {
    try {
      const { profileId, viewType, viewSource } = req.body;
      const viewerId = req.user?.id;
      const viewerIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      // Don't record self-views
      if (viewerId === profileId) {
        return res.json({
          success: true,
          message: 'Self-view ignored'
        });
      }

      // Check if profile owner blocks anonymous views
      if (!viewerId) {
        const blocksAnonymous = await ProfilePrivacySettings.blocksAnonymousViews(profileId);
        if (blocksAnonymous) {
          return res.status(403).json({
            success: false,
            message: 'Anonymous views are blocked for this profile'
          });
        }
      }

      // Record the view
      const viewId = await ProfileView.recordView({
        profileOwnerId: profileId,
        viewerId: viewerId,
        viewType: viewType || 'PROFILE',
        viewSource: viewSource || 'DIRECT',
        viewerIP: viewerIP,
        userAgent: userAgent,
        deviceInfo: req.deviceInfo || {},
        locationData: req.locationData || {},
        referrerUrl: req.headers.referer
      });

      res.json({
        success: true,
        message: 'Profile view recorded',
        data: { viewId }
      });
    } catch (error) {
      console.error('Error recording profile view:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording profile view'
      });
    }
  }

  /**
   * Get profile analytics
   * GET /api/profile-analytics/:profileId/analytics
   */
  static async getAnalytics(req, res) {
    try {
      const { profileId } = req.params;
      const requesterId = req.user?.id;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      // Check if requester can view analytics
      const canView = await ProfileView.canViewAnalytics(profileId, requesterId);
      if (!canView) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these analytics'
        });
      }

      // Check if user has premium feature access
      if (requesterId !== profileId) {
        const hasAccess = await PremiumFeature.hasAccess(requesterId, 'profile_analytics');
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Profile analytics requires premium subscription',
            code: 'PREMIUM_REQUIRED'
          });
        }
      }

      const [analytics, insights, completenessScore] = await Promise.all([
        ProfileAnalytics.getAnalytics(profileId),
        ProfileAnalytics.getViewerInsights(profileId),
        ProfileAnalytics.getProfileCompletenessScore(profileId)
      ]);

      res.json({
        success: true,
        data: {
          analytics,
          insights,
          completenessScore,
          lastUpdated: analytics.last_calculated_at
        }
      });
    } catch (error) {
      console.error('Error getting profile analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving profile analytics'
      });
    }
  }

  /**
   * Get profile viewers
   * GET /api/profile-analytics/:profileId/viewers
   */
  static async getViewers(req, res) {
    try {
      const { profileId } = req.params;
      const requesterId = req.user?.id;
      const { limit = 50, offset = 0, recent = false } = req.query;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      // Only profile owner can view their viewers
      if (profileId !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own profile viewers'
        });
      }

      // Check privacy settings
      const allowsViewerList = await ProfilePrivacySettings.allowsViewerList(profileId);
      if (!allowsViewerList) {
        return res.status(403).json({
          success: false,
          message: 'Viewer list is disabled in privacy settings'
        });
      }

      let viewers;
      if (recent === 'true') {
        viewers = await ProfileView.getRecentViewers(profileId, parseInt(limit));
      } else {
        viewers = await ProfileView.getProfileViewers(profileId, parseInt(limit), parseInt(offset));
      }

      res.json({
        success: true,
        data: {
          viewers,
          total: viewers.length,
          hasMore: viewers.length === parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error getting profile viewers:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving profile viewers'
      });
    }
  }

  /**
   * Get view statistics
   * GET /api/profile-analytics/:profileId/statistics
   */
  static async getStatistics(req, res) {
    try {
      const { profileId } = req.params;
      const requesterId = req.user?.id;
      const { timeframe = '30d' } = req.query;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      // Only profile owner can view their statistics
      if (profileId !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own profile statistics'
        });
      }

      const [statistics, trends, engagementMetrics] = await Promise.all([
        ProfileView.getViewStatistics(profileId, timeframe),
        ProfileView.getViewTrends(profileId, this.getTimeframeDays(timeframe)),
        ProfileAnalytics.getEngagementMetrics(profileId, this.getTimeframeDays(timeframe))
      ]);

      res.json({
        success: true,
        data: {
          statistics,
          trends,
          engagementMetrics,
          timeframe
        }
      });
    } catch (error) {
      console.error('Error getting view statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving view statistics'
      });
    }
  }

  /**
   * Generate insights
   * POST /api/profile-analytics/:profileId/insights/generate
   */
  static async generateInsights(req, res) {
    try {
      const { profileId } = req.params;
      const requesterId = req.user?.id;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      // Only profile owner can generate their insights
      if (profileId !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'You can only generate insights for your own profile'
        });
      }

      const insights = await ProfileAnalytics.generateInsights(profileId);

      res.json({
        success: true,
        message: 'Insights generated successfully',
        data: {
          insights,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating insights'
      });
    }
  }

  /**
   * Get comparative analytics
   * GET /api/profile-analytics/:profileId/comparative
   */
  static async getComparativeAnalytics(req, res) {
    try {
      const { profileId } = req.params;
      const requesterId = req.user?.id;

      if (!profileId) {
        return res.status(400).json({
          success: false,
          message: 'Profile ID is required'
        });
      }

      // Only profile owner can view comparative analytics
      if (profileId !== requesterId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own comparative analytics'
        });
      }

      // Check premium access
      const hasAccess = await PremiumFeature.hasAccess(requesterId, 'profile_analytics');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Comparative analytics requires premium subscription',
          code: 'PREMIUM_REQUIRED'
        });
      }

      const comparativeData = await ProfileAnalytics.getComparativeAnalytics(profileId, true);

      res.json({
        success: true,
        data: comparativeData
      });
    } catch (error) {
      console.error('Error getting comparative analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving comparative analytics'
      });
    }
  }

  /**
   * Export analytics data
   * GET /api/profile-analytics/:profileId/export
   */
  static async exportAnalytics(req,*
