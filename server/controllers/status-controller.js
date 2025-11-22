// server/controllers/status-controller.js
const UserStatus = require('../models/userStatus');
const StatusView = require('../models/statusView');
const UserContact = require('../models/userContact');
const { User } = require('../models/user');
const { supabase } = require('../utils/supabase');
const { Op } = require('sequelize');
const gun = require('../utils/gunInstance');
const multer = require('multer');
const path = require('path');

class StatusController {
  // Upload and create status
  async createStatus(req, res) {
    try {
      const { 
        content, 
        mediaType = 'text', 
        backgroundColor = '#000000', 
        textColor = '#ffffff' 
      } = req.body;
      const userId = req.user.id;

      // Check user's current active status count
      const activeStatusCount = await UserStatus.count({
        where: {
          userId,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        }
      });

      if (activeStatusCount >= 30) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 30 active statuses allowed'
        });
      }

      // Validate content based on media type
      if (mediaType === 'text' && (!content || content.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'Text content is required for text status'
        });
      }

      if (mediaType === 'text' && content.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Text status must be 500 characters or less'
        });
      }

      let mediaUrl = null;
      let mediaMetadata = {};

      // Handle media upload
      if (req.file && ['image', 'video', 'audio'].includes(mediaType)) {
        mediaUrl = await this.processMediaFile(req.file, mediaType);
        mediaMetadata = await this.getMediaMetadata(req.file, mediaType);
      }

      // Validate media constraints
      if (mediaType === 'video' && mediaMetadata.duration > 10) {
        return res.status(400).json({
          success: false,
          error: 'Video status must be 10 seconds or less'
        });
      }

      if (mediaType === 'audio' && mediaMetadata.duration > 30) {
        return res.status(400).json({
          success: false,
          error: 'Audio status must be 30 seconds or less'
        });
      }

      // Set expiration time (30 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 30);

      // Create status
      const status = await UserStatus.create({
        userId,
        content: content?.trim() || null,
        mediaUrl,
        mediaType,
        mediaMetadata,
        backgroundColor,
        textColor,
        expiresAt
      });

      // Sync with Gun.js for real-time updates
      const gunStatus = gun.get('statuses').get(status.id);
      gunStatus.put({
        id: status.id,
        userId,
        content: status.content,
        mediaUrl: status.mediaUrl,
        mediaType: status.mediaType,
        backgroundColor: status.backgroundColor,
        textColor: status.textColor,
        createdAt: status.createdAt.toISOString(),
        expiresAt: status.expiresAt.toISOString(),
        viewCount: 0
      });

      // Notify user's pals about new status
      await this.notifyPalsNewStatus(userId, status.id);

      // Emit to Socket.io
      req.io.to(`user_${userId}`).emit('status_created', {
        status: {
          ...status.toJSON(),
          user: {
            id: req.user.id,
            username: req.user.username,
            avatar: req.user.avatar
          }
        }
      });

      res.json({
        success: true,
        status,
        message: 'Status created successfully!'
      });

    } catch (error) {
      console.error('Create status error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get user's own statuses
  async getMyStatuses(req, res) {
    try {
      const userId = req.user.id;

      const statuses = await UserStatus.findAll({
        where: {
          userId,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        include: [{
          model: StatusView,
          include: [{
            model: User,
            attributes: ['id', 'username', 'avatar']
          }]
        }],
        order: [['createdAt', 'DESC']]
      });

      // Add view statistics
      const statusesWithStats = statuses.map(status => ({
        ...status.toJSON(),
        viewCount: status.StatusViews?.length || 0,
        viewers: status.StatusViews?.map(view => view.User) || []
      }));

      res.json({
        success: true,
        statuses: statusesWithStats
      });

    } catch (error) {
      console.error('Get my statuses error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get pals' statuses for status feed
  async getPalsStatuses(req, res) {
    try {
      const userId = req.user.id;

      // Get user's pals
      const { data: pals } = await supabase
        .from('pals')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      const palIds = pals.map(pal => 
        pal.requester_id === userId ? pal.addressee_id : pal.requester_id
      );

      if (palIds.length === 0) {
        return res.json({ success: true, statuses: [] });
      }

      // Get pals' active statuses
      const statuses = await UserStatus.findAll({
        where: {
          userId: { [Op.in]: palIds },
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar', 'isVerified']
        }],
        order: [['createdAt', 'DESC']]
      });

      // Group statuses by user and check view status
      const statusesByUser = {};
      
      for (const status of statuses) {
        const statusUserId = status.userId;
        
        if (!statusesByUser[statusUserId]) {
          statusesByUser[statusUserId] = {
            user: status.User,
            statuses: [],
            hasUnviewed: false,
            totalCount: 0,
            viewedCount: 0
          };
        }

        // Check if current user has viewed this status
        const hasViewed = await StatusView.findOne({
          where: { statusId: status.id, viewerId: userId }
        });

        const statusData = {
          ...status.toJSON(),
          hasViewed: !!hasViewed
        };

        statusesByUser[statusUserId].statuses.push(statusData);
        statusesByUser[statusUserId].totalCount++;
        
        if (!hasViewed) {
          statusesByUser[statusUserId].hasUnviewed = true;
        } else {
          statusesByUser[statusUserId].viewedCount++;
        }
      }

      // Convert to array and sort by unviewed first, then by latest status
      const sortedStatuses = Object.values(statusesByUser).sort((a, b) => {
        // Unviewed statuses first
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        
        // Then by latest status time
        const aLatest = new Date(a.statuses[0]?.createdAt || 0);
        const bLatest = new Date(b.statuses[0]?.createdAt || 0);
        return bLatest - aLatest;
      });

      res.json({
        success: true,
        statuses: sortedStatuses
      });

    } catch (error) {
      console.error('Get pals statuses error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // View a specific status
  async viewStatus(req, res) {
    try {
      const { statusId } = req.params;
      const viewerId = req.user.id;

      const status = await UserStatus.findOne({
        where: {
          id: statusId,
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar', 'isVerified']
        }]
      });

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Status not found or expired'
        });
      }

      // Check if viewer is allowed to see this status
      const canView = await this.canViewStatus(viewerId, status.userId);
      if (!canView) {
        return res.status(403).json({
          success: false,
          error: 'You are not allowed to view this status'
        });
      }

      // Record view if not already viewed
      const existingView = await StatusView.findOne({
        where: { statusId, viewerId }
      });

      if (!existingView) {
        await StatusView.create({
          statusId,
          viewerId,
          viewedAt: new Date()
        });

        // Update view count
        await status.increment('viewCount');

        // Sync with Gun.js
        const gunStatus = gun.get('statuses').get(statusId);
        gunStatus.put({
          viewCount: status.viewCount + 1
        });

        // Notify status owner of new view (if not own status)
        if (status.userId !== viewerId) {
          await this.notifyStatusView(status.userId, viewerId, statusId);
        }
      }

      res.json({
        success: true,
        status: {
          ...status.toJSON(),
          hasViewed: true
        }
      });

    } catch (error) {
      console.error('View status error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Delete status
  async deleteStatus(req, res) {
    try {
      const { statusId } = req.params;
      const userId = req.user.id;

      const status = await UserStatus.findOne({
        where: { id: statusId, userId }
      });

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Status not found'
        });
      }

      // Soft delete
      await status.update({ isActive: false });

      // Delete media file if exists
      if (status.mediaUrl) {
        await this.deleteMediaFile(status.mediaUrl);
      }

      // Sync with Gun.js
      const gunStatus = gun.get('statuses').get(statusId);
      gunStatus.put({
        isActive: false,
        deletedAt: new Date().toISOString()
      });

      // Emit to Socket.io
      req.io.to(`user_${userId}`).emit('status_deleted', { statusId });

      res.json({
        success: true,
        message: 'Status deleted successfully'
      });

    } catch (error) {
      console.error('Delete status error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get status viewers
  async getStatusViewers(req, res) {
    try {
      const { statusId } = req.params;
      const userId = req.user.id;

      // Verify status belongs to user
      const status = await UserStatus.findOne({
        where: { id: statusId, userId }
      });

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Status not found'
        });
      }

      const viewers = await StatusView.findAll({
        where: { statusId },
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar', 'isVerified']
        }],
        order: [['viewedAt', 'DESC']]
      });

      res.json({
        success: true,
        viewers: viewers.map(view => ({
          ...view.User.toJSON(),
          viewedAt: view.viewedAt
        }))
      });

    } catch (error) {
      console.error('Get status viewers error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get users with unviewed statuses (for blue dot indicator)
  async getUnviewedStatusUsers(req, res) {
    try {
      const userId = req.user.id;

      // Get user's pals
      const { data: pals } = await supabase
        .from('pals')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      const palIds = pals.map(pal => 
        pal.requester_id === userId ? pal.addressee_id : pal.requester_id
      );

      if (palIds.length === 0) {
        return res.json({ success: true, users: [] });
      }

      // Get pals with active statuses
      const usersWithStatuses = await User.findAll({
        where: { id: { [Op.in]: palIds } },
        include: [{
          model: UserStatus,
          where: {
            isActive: true,
            expiresAt: { [Op.gt]: new Date() }
          },
          required: true
        }],
        attributes: ['id', 'username', 'avatar']
      });

      // Check which users have unviewed statuses
      const usersWithUnviewed = [];

      for (const user of usersWithStatuses) {
        const unviewedCount = await UserStatus.count({
          where: {
            userId: user.id,
            isActive: true,
            expiresAt: { [Op.gt]: new Date() }
          },
          include: [{
            model: StatusView,
            where: { viewerId: userId },
            required: false
          }],
          having: sequelize.literal('COUNT(StatusViews.id) = 0')
        });

        if (unviewedCount > 0) {
          usersWithUnviewed.push({
            ...user.toJSON(),
            unviewedCount
          });
        }
      }

      res.json({
        success: true,
        users: usersWithUnviewed
      });

    } catch (error) {
      console.error('Get unviewed status users error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Helper methods
  async processMediaFile(file, mediaType) {
    try {
      // Upload to your storage service (AWS S3, Cloudinary, etc.)
      // This is a placeholder implementation
      const fileName = `status_${Date.now()}_${file.originalname}`;
      const uploadPath = path.join('uploads/status', fileName);
      
      // Move file to upload directory
      await file.mv(uploadPath);
      
      return `/uploads/status/${fileName}`;
    } catch (error) {
      console.error('Process media file error:', error);
      throw new Error('Failed to process media file');
    }
  }

  async getMediaMetadata(file, mediaType) {
    const metadata = {
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname
    };

    if (mediaType === 'video' || mediaType === 'audio') {
      // Use ffprobe or similar to get duration
      // This is a placeholder - implement actual media analysis
      metadata.duration = 5; // seconds
    }

    if (mediaType === 'image') {
      // Get image dimensions
      metadata.width = 1080;
      metadata.height = 1920;
    }

    return metadata;
  }

  async deleteMediaFile(mediaUrl) {
    try {
      // Delete file from storage
      // This is a placeholder implementation
      console.log(`Deleting media file: ${mediaUrl}`);
    } catch (error) {
      console.error('Delete media file error:', error);
    }
  }

  async canViewStatus(viewerId, statusOwnerId) {
    try {
      // Users can always view their own status
      if (viewerId === statusOwnerId) {
        return true;
      }

      // Check if they are pals
      const { data: palRelation } = await supabase
        .from('pals')
        .select('*')
        .or(`and(requester_id.eq.${viewerId},addressee_id.eq.${statusOwnerId}),and(requester_id.eq.${statusOwnerId},addressee_id.eq.${viewerId})`)
        .eq('status', 'accepted')
        .single();

      return !!palRelation;
    } catch (error) {
      console.error('Can view status error:', error);
      return false;
    }
  }

  async notifyPalsNewStatus(userId, statusId) {
    try {
      // Get user's pals
      const { data: pals } = await supabase
        .from('pals')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      const palIds = pals.map(pal => 
        pal.requester_id === userId ? pal.addressee_id : pal.requester_id
      );

      if (palIds.length === 0) return;

      // Get user details
      const { data: user } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

      // Create notifications for pals
      const notifications = palIds.map(palId => ({
        user_id: palId,
        type: 'new_status',
        title: 'New Status',
        message: `${user.username} posted a new status`,
        data: {
          statusId,
          statusOwnerId: userId,
          statusOwnerUsername: user.username,
          statusOwnerAvatar: user.avatar_url
        }
      }));

      await supabase.from('notifications').insert(notifications);

    } catch (error) {
      console.error('Notify pals new status error:', error);
    }
  }

  async notifyStatusView(statusOwnerId, viewerId, statusId) {
    try {
      const { data: viewer } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', viewerId)
        .single();

      await supabase
        .from('notifications')
        .insert([{
          user_id: statusOwnerId,
          type: 'status_viewed',
          title: 'Status Viewed',
          message: `${viewer.username} viewed your status`,
          data: {
            statusId,
            viewerId,
            viewerUsername: viewer.username,
            viewerAvatar: viewer.avatar_url
          }
        }]);

    } catch (error) {
      console.error('Notify status view error:', error);
    }
  }
}

module.exports = new StatusController();
