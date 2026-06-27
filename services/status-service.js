// services/statusService.js
const UserStatus = require('../models/userStatus');
const StatusView = require('../models/statusView');
const { Op } = require('sequelize');
const cron = require('node-cron');

class StatusService {
  // Initialize status cleanup job
  initializeStatusCleanup() {
    // Run every hour to clean up expired statuses
    cron.schedule('0 * * * *', async () => {
      await this.cleanupExpiredStatuses();
    });

    console.log('Status cleanup job initialized');
  }

  // Clean up expired statuses
  async cleanupExpiredStatuses() {
    try {
      const now = new Date();
      
      // Find expired statuses
      const expiredStatuses = await UserStatus.findAll({
        where: {
          isActive: true,
          expiresAt: { [Op.lt]: now }
        }
      });

      console.log(`Found ${expiredStatuses.length} expired statuses to cleanup`);

      // Deactivate expired statuses
      await UserStatus.update(
        { isActive: false },
        {
          where: {
            isActive: true,
            expiresAt: { [Op.lt]: now }
          }
        }
      );

      // Delete associated media files
      for (const status of expiredStatuses) {
        if (status.mediaUrl) {
          await this.deleteMediaFile(status.mediaUrl);
        }
      }

      // Clean up old status views (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await StatusView.destroy({
        where: {
          viewedAt: { [Op.lt]: sevenDaysAgo }
        }
      });

      console.log(`Cleaned up expired statuses and old views`);

    } catch (error) {
      console.error('Cleanup expired statuses error:', error);
    }
  }

  // Get status statistics for user
  async getStatusStats(userId) {
    try {
      const [totalStatuses, activeStatuses, totalViews] = await Promise.all([
        UserStatus.count({
          where: { userId }
        }),
        UserStatus.count({
          where: {
            userId,
            isActive: true,
            expiresAt: { [Op.gt]: new Date() }
          }
        }),
        UserStatus.sum('viewCount', {
          where: { userId }
        })
      ]);

      return {
        totalStatuses,
        activeStatuses,
        totalViews: totalViews || 0,
        remainingSlots: 30 - activeStatuses
      };

    } catch (error) {
      console.error('Get status stats error:', error);
      return {
        totalStatuses: 0,
        activeStatuses: 0,
        totalViews: 0,
        remainingSlots: 30
      };
    }
  }

  // Get trending statuses (most viewed in last 24h)
  async getTrendingStatuses(limit = 10) {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const trendingStatuses = await UserStatus.findAll({
        where: {
          isActive: true,
          expiresAt: { [Op.gt]: new Date() },
          createdAt: { [Op.gte]: twentyFourHoursAgo }
        },
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar', 'isVerified']
        }],
        order: [['viewCount', 'DESC']],
        limit
      });

      return trendingStatuses;

    } catch (error) {
      console.error('Get trending statuses error:', error);
      return [];
    }
  }

  // Check if user has unviewed statuses from specific user
  async hasUnviewedStatusesFrom(viewerId, statusOwnerId) {
    try {
      const unviewedCount = await UserStatus.count({
        where: {
          userId: statusOwnerId,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        include: [{
          model: StatusView,
          where: { viewerId },
          required: false
        }],
        having: sequelize.literal('COUNT(StatusViews.id) = 0')
      });

      return unviewedCount > 0;

    } catch (error) {
      console.error('Has unviewed statuses from error:', error);
      return false;
    }
  }

  // Mark all statuses from user as viewed
  async markAllStatusesViewed(viewerId, statusOwnerId) {
    try {
      const unviewedStatuses = await UserStatus.findAll({
        where: {
          userId: statusOwnerId,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        include: [{
          model: StatusView,
          where: { viewerId },
          required: false
        }],
        having: sequelize.literal('COUNT(StatusViews.id) = 0')
      });

      const viewsToCreate = unviewedStatuses.map(status => ({
        statusId: status.id,
        viewerId,
        viewedAt: new Date()
      }));

      if (viewsToCreate.length > 0) {
        await StatusView.bulkCreate(viewsToCreate);
        
        // Update view counts
        await Promise.all(unviewedStatuses.map(status => 
          status.increment('viewCount')
        ));
      }

      return viewsToCreate.length;

    } catch (error) {
      console.error('Mark all statuses viewed error:', error);
      return 0;
    }
  }

  // Get status engagement metrics
  async getStatusEngagement(statusId) {
    try {
      const status = await UserStatus.findByPk(statusId, {
        include: [{
          model: StatusView,
          include: [{
            model: User,
            attributes: ['id', 'username', 'avatar']
          }]
        }]
      });

      if (!status) return null;

      const viewsByHour = {};
      const now = new Date();

      // Group views by hour for the last 24 hours
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
        const hourKey = hour.getHours();
        viewsByHour[hourKey] = 0;
      }

      status.StatusViews.forEach(view => {
        const viewHour = new Date(view.viewedAt).getHours();
        if (viewsByHour.hasOwnProperty(viewHour)) {
          viewsByHour[viewHour]++;
        }
      });

      return {
        totalViews: status.viewCount,
        uniqueViewers: status.StatusViews.length,
        viewsByHour,
        recentViewers: status.StatusViews
          .slice(0, 10)
          .map(view => view.User),
        engagementRate: status.StatusViews.length / Math.max(status.viewCount, 1) * 100
      };

    } catch (error) {
      console.error('Get status engagement error:', error);
      return null;
    }
  }

  // Delete media file helper
  async deleteMediaFile(mediaUrl) {
    try {
      // Implement actual file deletion logic
      // This could be local file system, AWS S3, etc.
      console.log(`Deleting media file: ${mediaUrl}`);
    } catch (error) {
      console.error('Delete media file error:', error);
    }
  }
}

module.exports = new StatusService();
