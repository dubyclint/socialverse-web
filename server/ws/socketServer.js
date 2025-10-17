// server/ws/socketServer.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const ChatEvents = require('./chatEvents');
const GroupChatEvents = require('./groupChatEvents');
const StatusEvents = require('./statusEvents');
const ContactEvents = require('./contactEvents');
const CallEvents = require('./callEvents');
const NotificationEvents = require('./notificationEvents');

class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.connectedUsers = new Map(); // userId -> socketId mapping
    this.userSockets = new Map(); // socketId -> user data mapping
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details from Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('id, username, email, avatar_url, is_verified, is_online, last_seen')
          .eq('id', decoded.userId)
          .single();

        if (error || !user) {
          return next(new Error('Invalid user'));
        }

        // Attach user data to socket
        socket.userId = user.id;
        socket.username = user.username;
        socket.userEmail = user.email;
        socket.userAvatar = user.avatar_url;
        socket.isVerified = user.is_verified;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      socket.rateLimiter = {
        messages: { count: 0, resetTime: Date.now() + 60000 }, // 60 messages per minute
        events: { count: 0, resetTime: Date.now() + 10000 }     // 100 events per 10 seconds
      };
      next();
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      this.setupSocketEvents(socket);
    });
  }

  async handleConnection(socket) {
    try {
      const userId = socket.userId;
      const username = socket.username;

      console.log(`User connected: ${username} (${userId})`);

      // Store user connection
      this.connectedUsers.set(userId, socket.id);
      this.userSockets.set(socket.id, {
        userId,
        username,
        email: socket.userEmail,
        avatar: socket.userAvatar,
        isVerified: socket.isVerified,
        connectedAt: new Date()
      });

      // Update user online status
      await this.updateUserOnlineStatus(userId, true);

      // Join user's personal room
      socket.join(`user_${userId}`);

      // Join user's chat rooms
      await this.joinUserChatRooms(socket, userId);

      // Send initial data
      await this.sendInitialData(socket, userId);

      // Notify user's pals that they're online
      await this.notifyPalsOnlineStatus(userId, true);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

    } catch (error) {
      console.error('Handle connection error:', error);
      socket.emit('connection_error', { error: error.message });
    }
  }

  setupSocketEvents(socket) {
    // Set up all event handlers
    ChatEvents.setupChatEvents(this.io, socket);
    GroupChatEvents.setupGroupEvents(this.io, socket);
    StatusEvents.setupStatusEvents(this.io, socket);
    ContactEvents.setupContactEvents(this.io, socket);
    CallEvents.setupCallEvents(this.io, socket);
    NotificationEvents.setupNotificationEvents(this.io, socket);

    // General events
    this.setupGeneralEvents(socket);
    this.setupPresenceEvents(socket);
    this.setupTypingEvents(socket);
  }

  setupGeneralEvents(socket) {
    // Heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // User activity tracking
    socket.on('user_activity', async (data) => {
      try {
        const { activity, metadata } = data;
        await this.trackUserActivity(socket.userId, activity, metadata);
      } catch (error) {
        console.error('User activity tracking error:', error);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.username}:`, error);
    });
  }

  setupPresenceEvents(socket) {
    // Update user presence
    socket.on('update_presence', async (data) => {
      try {
        const { status, customMessage } = data; // 'online', 'away', 'busy', 'invisible'
        await this.updateUserPresence(socket.userId, status, customMessage);
        
        // Notify pals of presence change
        await this.notifyPalsPresenceChange(socket.userId, status, customMessage);
      } catch (error) {
        console.error('Update presence error:', error);
      }
    });

    // Get online pals
    socket.on('get_online_pals', async () => {
      try {
        const onlinePals = await this.getOnlinePals(socket.userId);
        socket.emit('online_pals_response', { pals: onlinePals });
      } catch (error) {
        console.error('Get online pals error:', error);
        socket.emit('online_pals_response', { error: error.message });
      }
    });
  }

  setupTypingEvents(socket) {
    // Typing indicators for direct chats
    socket.on('typing', async (data) => {
      try {
        if (!this.checkRateLimit(socket, 'events')) return;

        const { chatId, isTyping } = data;
        
        // Verify user is in chat
        const isParticipant = await this.verifyUserInChat(socket.userId, chatId);
        if (!isParticipant) return;

        // Broadcast typing status to other chat participants
        socket.to(`chat_${chatId}`).emit('user_typing', {
          chatId,
          userId: socket.userId,
          username: socket.username,
          isTyping
        });

      } catch (error) {
        console.error('Typing event error:', error);
      }
    });

    // Stop typing (cleanup)
    socket.on('stop_typing', (data) => {
      try {
        const { chatId } = data;
        socket.to(`chat_${chatId}`).emit('user_typing', {
          chatId,
          userId: socket.userId,
          username: socket.username,
          isTyping: false
        });
      } catch (error) {
        console.error('Stop typing error:', error);
      }
    });
  }

  async handleDisconnection(socket) {
    try {
      const userId = socket.userId;
      const username = socket.username;

      console.log(`User disconnected: ${username} (${userId})`);

      // Remove from connected users
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);

      // Update user offline status
      await this.updateUserOnlineStatus(userId, false);

      // Notify user's pals that they're offline
      await this.notifyPalsOnlineStatus(userId, false);

      // Leave all rooms
      socket.leave(`user_${userId}`);

    } catch (error) {
      console.error('Handle disconnection error:', error);
    }
  }

  // Helper methods
  async joinUserChatRooms(socket, userId) {
    try {
      // Get user's active chats
      const { data: chats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      // Join each chat room
      for (const chat of chats) {
        socket.join(`chat_${chat.chat_id}`);
      }

    } catch (error) {
      console.error('Join user chat rooms error:', error);
    }
  }

  async sendInitialData(socket, userId) {
    try {
      // Send unread message counts
      const unreadCounts = await this.getUnreadCounts(userId);
      socket.emit('initial_unread_counts', unreadCounts);

      // Send online pals
      const onlinePals = await this.getOnlinePals(userId);
      socket.emit('online_pals', { pals: onlinePals });

      // Send pending notifications
      const notifications = await this.getPendingNotifications(userId);
      socket.emit('pending_notifications', { notifications });

    } catch (error) {
      console.error('Send initial data error:', error);
    }
  }

  async updateUserOnlineStatus(userId, isOnline) {
    try {
      const updateData = {
        is_online: isOnline,
        last_seen: new Date().toISOString()
      };

      await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

    } catch (error) {
      console.error('Update user online status error:', error);
    }
  }

  async updateUserPresence(userId, status, customMessage = null) {
    try {
      await supabase
        .from('users')
        .update({
          presence_status: status,
          presence_message: customMessage,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);

    } catch (error) {
      console.error('Update user presence error:', error);
    }
  }

  async notifyPalsOnlineStatus(userId, isOnline) {
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

      // Notify online pals
      for (const palId of palIds) {
        const palSocketId = this.connectedUsers.get(palId);
        if (palSocketId) {
          this.io.to(palSocketId).emit('pal_online_status', {
            userId,
            isOnline,
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      console.error('Notify pals online status error:', error);
    }
  }

  async notifyPalsPresenceChange(userId, status, customMessage) {
    try {
      // Get user details
      const { data: user } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

      // Get user's pals
      const { data: pals } = await supabase
        .from('pals')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      const palIds = pals.map(pal => 
        pal.requester_id === userId ? pal.addressee_id : pal.requester_id
      );

      // Notify online pals
      for (const palId of palIds) {
        const palSocketId = this.connectedUsers.get(palId);
        if (palSocketId) {
          this.io.to(palSocketId).emit('pal_presence_change', {
            userId,
            username: user.username,
            avatar: user.avatar_url,
            status,
            customMessage,
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      console.error('Notify pals presence change error:', error);
    }
  }

  async getOnlinePals(userId) {
    try {
      // Get user's pals
      const { data: pals } = await supabase
        .from('pals')
        .select(`
          requester_id,
          addressee_id,
          requester:requester_id(id, username, avatar_url, is_online, presence_status, presence_message, last_seen),
          addressee:addressee_id(id, username, avatar_url, is_online, presence_status, presence_message, last_seen)
        `)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      const onlinePals = pals
        .map(pal => {
          const friend = pal.requester_id === userId ? pal.addressee : pal.requester;
          return friend;
        })
        .filter(friend => friend.is_online)
        .map(friend => ({
          id: friend.id,
          username: friend.username,
          avatar: friend.avatar_url,
          isOnline: friend.is_online,
          presenceStatus: friend.presence_status,
          presenceMessage: friend.presence_message,
          lastSeen: friend.last_seen
        }));

      return onlinePals;

    } catch (error) {
      console.error('Get online pals error:', error);
      return [];
    }
  }

  async getUnreadCounts(userId) {
    try {
      // Get unread message counts for each chat
      const { data: chats } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          last_read_at,
          chats:chat_id(type, name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      const unreadCounts = {};
      
      for (const chat of chats) {
        const { data: unreadMessages } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('chat_id', chat.chat_id)
          .gt('created_at', chat.last_read_at)
          .neq('sender_id', userId);

        unreadCounts[chat.chat_id] = unreadMessages?.length || 0;
      }

      return unreadCounts;

    } catch (error) {
      console.error('Get unread counts error:', error);
      return {};
    }
  }

  async getPendingNotifications(userId) {
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      return notifications || [];

    } catch (error) {
      console.error('Get pending notifications error:', error);
      return [];
    }
  }

  async verifyUserInChat(userId, chatId) {
    try {
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .eq('is_active', true)
        .single();

      return !!participant;

    } catch (error) {
      return false;
    }
  }

  async trackUserActivity(userId, activity, metadata = {}) {
    try {
      await supabase
        .from('user_activities')
        .insert([{
          user_id: userId,
          activity_type: activity,
          metadata,
          created_at: new Date().toISOString()
        }]);

    } catch (error) {
      console.error('Track user activity error:', error);
    }
  }

  checkRateLimit(socket, type) {
    const now = Date.now();
    const limiter = socket.rateLimiter[type];

    if (now > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = now + (type === 'messages' ? 60000 : 10000);
    }

    limiter.count++;
    const limit = type === 'messages' ? 60 : 100;

    if (limiter.count > limit) {
      socket.emit('rate_limit_exceeded', { type, limit });
      return false;
    }

    return true;
  }

  // Public methods for other parts of the application
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToChat(chatId, event, data) {
    this.io.to(`chat_${chatId}`).emit(event, data);
  }

  emitToAllUsers(event, data) {
    this.io.emit(event, data);
  }

  getConnectedUserCount() {
    return this.connectedUsers.size;
  }

  getConnectedUsers() {
    return Array.from(this.userSockets.values());
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = SocketServer;
