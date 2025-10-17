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
