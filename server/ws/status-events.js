// server/ws/statusEvents.js
const UserStatus = require('../../models/userStatus');
const StatusView = require('../../models/statusView');
const statusService = require('../../services/statusService');

class StatusEvents {
  static setupStatusEvents(io, socket) {
    // Join status room for real-time updates
    socket.on('join_status_feed', async () => {
      try {
        const userId = socket.userId;
        socket.join(`status_feed_${userId}`);
        socket.emit('joined_status_feed', { success: true });
      } catch (error) {
        console.error('Join status feed error:', error);
        socket.emit('joined_status_feed', { success: false, error: error.message });
      }
    });

    // View status with real-time update
    socket.on('view_status', async (data) => {
      try {
        const { statusId } = data;
        const viewerId = socket.userId;

        // Check if already viewed
        const existingView = await StatusView.findOne({
          where: { statusId, view
// server/ws/statusEvents.js (continued)
const UserStatus = require('../../models/userStatus');
const StatusView = require('../../models/statusView');
const statusService = require('../../services/statusService');

class StatusEvents {
  static setupStatusEvents(io, socket) {
    // Join status room for real-time updates
    socket.on('join_status_feed', async () => {
      try {
        const userId = socket.userId;
        socket.join(`status_feed_${userId}`);
        socket.emit('joined_status_feed', { success: true });
      } catch (error) {
        console.error('Join status feed error:', error);
        socket.emit('joined_status_feed', { success: false, error: error.message });
      }
    });

    // View status with real-time update
    socket.on('view_status', async (data) => {
      try {
        const { statusId } = data;
        const viewerId = socket.userId;

        // Check if already viewed
        const existingView = await StatusView.findOne({
          where: { statusId, viewerId }
        });

        if (!existingView) {
          // Create view record
          await StatusView.create({
            statusId,
            viewerId,
            viewedAt: new Date()
          });

          // Get status details
          const status = await UserStatus.findByPk(statusId);
          if (status) {
            // Update view count
            await status.increment('viewCount');

            // Notify status owner of new view
            io.to(`user_${status.userId}`).emit('status_viewed', {
              statusId,
              viewerId,
              viewerUsername: socket.username,
              newViewCount: status.viewCount + 1
            });

            // Update status feed for viewer
            socket.emit('status_view_recorded', {
              statusId,
              success: true
            });
          }
        }

      } catch (error) {
        console.error('View status error:', error);
        socket.emit('status_view_recorded', {
          statusId: data.statusId,
          success: false,
          error: error.message
        });
      }
    });

    // Status typing indicator (for text status creation)
    socket.on('status_typing', (data) => {
      try {
        const { isTyping } = data;
        const userId = socket.userId;

        // Broadcast to user's pals that they're creating a status
        socket.broadcast.to(`status_feed_${userId}`).emit('user_creating_status', {
          userId,
          username: socket.username,
          isTyping
        });

      } catch (error) {
        console.error('Status typing error:', error);
      }
    });

    // Request status updates for specific user
    socket.on('request_user_statuses', async (data) => {
      try {
        const { targetUserId } = data;
        const requesterId = socket.userId;

        // Check if requester can view target's statuses
        const canView = await statusService.canViewStatus(requesterId, targetUserId);
        
        if (!canView) {
          socket.emit('user_statuses_response', {
            targetUserId,
            success: false,
            error: 'Not authorized to view statuses'
          });
          return;
        }

        // Get target user's active statuses
        const statuses = await UserStatus.findAll({
          where: {
            userId: targetUserId,
            isActive: true,
            expiresAt: { [Op.gt]: new Date() }
          },
          include: [{
            model: User,
            attributes: ['id', 'username', 'avatar', 'isVerified']
          }],
          order: [['createdAt', 'ASC']]
        });

        // Check which statuses have been viewed
        const statusesWithViewStatus = await Promise.all(
          statuses.map(async (status) => {
            const hasViewed = await StatusView.findOne({
              where: { statusId: status.id, viewerId: requesterId }
            });

            return {
              ...status.toJSON(),
              hasViewed: !!hasViewed
            };
          })
        );

        socket.emit('user_statuses_response', {
          targetUserId,
          success: true,
          statuses: statusesWithViewStatus
        });

      } catch (error) {
        console.error('Request user statuses error:', error);
        socket.emit('user_statuses_response', {
          targetUserId: data.targetUserId,
          success: false,
          error: error.message
        });
      }
    });

    // Mark all statuses from user as viewed
    socket.on('mark_all_statuses_viewed', async (data) => {
      try {
        const { statusOwnerId } = data;
        const viewerId = socket.userId;

        const viewedCount = await statusService.markAllStatusesViewed(viewerId, statusOwnerId);

        socket.emit('all_statuses_marked_viewed', {
          statusOwnerId,
          viewedCount,
          success: true
        });

        // Update blue dot indicator
        socket.emit('status_indicator_update', {
          userId: statusOwnerId,
          hasUnviewed: false
        });

      } catch (error) {
        console.error('Mark all statuses viewed error:', error);
        socket.emit('all_statuses_marked_viewed', {
          statusOwnerId: data.statusOwnerId,
          success: false,
          error: error.message
        });
      }
    });

    // Get unviewed status indicators
    socket.on('get_status_indicators', async () => {
      try {
        const userId = socket.userId;
        const unviewedUsers = await statusService.getUnviewedStatusUsers(userId);

        socket.emit('status_indicators_response', {
          success: true,
          unviewedUsers
        });

      } catch (error) {
        console.error('Get status indicators error:', error);
        socket.emit('status_indicators_response', {
          success: false,
          error: error.message
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Leave status feed room
      socket.leave(`status_feed_${socket.userId}`);
    });
  }
}

module.exports = StatusEvents;
