// server/ws/socketServer.js - COMPLETE UPDATED VERSION
// WITH GIFT AND TRANSLATION EVENTS

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { supabase } = require('../utils/supabase');
const ChatEvents = require('./chatEvents');
const GroupChatEvents = require('./groupChatEvents');
const StatusEvents = require('./statusEvents');
const ContactEvents = require('./contactEvents');
const CallEvents = require('./callEvents');
const NotificationEvents = require('./notificationEvents');
const GiftEvents = require('./giftEvents'); // NEW
const TranslationEvents = require('./translationEvents'); // NEW

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
          .from('profiles')
          .select('id, username, email, avatar_url, is_verified')
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
    GiftEvents.setupGiftEvents(this.io, socket); // NEW - Gift events
    TranslationEvents.setupTranslationEvents(this.io, socket); // NEW - Translation events

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
        const { status, customMessage } = data;
        
        // Update in database
        await supabase
          .from('profiles')
          .update({
            status: status || 'online',
            custom_status: customMessage
          })
          .eq('id', socket.userId);

        // Broadcast to all connected users
        this.io.emit('user_presence_updated', {
          userId: socket.userId,
          username: socket.username,
          status: status || 'online',
          customMessage: customMessage
        });
      } catch (error) {
        console.error('Update presence error:', error);
      }
    });

    // Get online users
    socket.on('get_online_users', () => {
      const onlineUsers = Array.from(this.userSockets.values()).map(user => ({
        userId: user.userId,
        username: user.username,
        avatar: user.avatar,
        isVerified: user.isVerified
      }));

      socket.emit('online_users', onlineUsers);
    });
  }

  setupTypingEvents(socket) {
    // User is typing
    socket.on('user_typing', (data) => {
      const { chatId, isTyping } = data;
      
      this.io.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping: isTyping,
        timestamp: Date.now()
      });
    });
  }

  async updateUserOnlineStatus(userId, isOnline) {
    try {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);

      // Broadcast online status change
      this.io.emit('user_online_status_changed', {
        userId,
        isOnline,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Update online status error:', error);
    }
  }

  async joinUserChatRooms(socket, userId) {
    try {
      // Get all chats the user is part of
      const { data: chats, error } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user chats:', error);
        return;
      }

      // Join each chat room
      if (chats && chats.length > 0) {
        chats.forEach(chat => {
          socket.join(`chat:${chat.chat_id}`);
        });
      }
    } catch (error) {
      console.error('Join user chat rooms error:', error);
    }
  }

  async sendInitialData(socket, userId) {
    try {
      // Get user's chats
      const { data: chats } = await supabase
        .from('chats')
        .select('*')
        .or(`creator_id.eq.${userId},id.in(select chat_id from chat_participants where user_id='${userId}')`)
        .order('updated_at', { ascending: false });

      // Get user's balance
      const { data: balance } = await supabase
        .from('pewgift_balance')
        .select('balance')
        .eq('user_id', userId)
        .single();

      // Send initial data to client
      socket.emit('initial_data', {
        chats: chats || [],
        balance: balance?.balance || 0,
        userId: userId,
        username: socket.username
      });
    } catch (error) {
      console.error('Send initial data error:', error);
    }
  }

  async notifyPalsOnlineStatus(userId, isOnline) {
    try {
      // Get user's pals/contacts
      const { data: contacts } = await supabase
        .from('user_contacts')
        .select('contact_id')
        .eq('user_id', userId);

      if (contacts && contacts.length > 0) {
        contacts.forEach(contact => {
          // Notify each pal
          this.io.to(`user_${contact.contact_id}`).emit('pal_online_status', {
            userId: userId,
            isOnline: isOnline,
            timestamp: Date.now()
          });
        });
      }
    } catch (error) {
      console.error('Notify pals online status error:', error);
    }
  }

  async handleDisconnection(socket) {
    try {
      const userId = socket.userId;
      const username = socket.username;

      console.log(`User disconnected: ${username} (${userId})`);

      // Remove from connected users
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);

      // Update user online status
      await this.updateUserOnlineStatus(userId, false);

      // Notify pals that user is offline
      await this.notifyPalsOnlineStatus(userId, false);

    } catch (error) {
      console.error('Handle disconnection error:', error);
    }
  }

  async trackUserActivity(userId, activity, metadata) {
    try {
      // Track user activity in database if needed
      console.log(`User ${userId} activity: ${activity}`, metadata);
    } catch (error) {
      console.error('Track user activity error:', error);
    }
  }

  getIO() {
    return this.io;
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.entries()).map(([userId, socketId]) => ({
      userId,
      socketId
    }));
  }

  getUserSocket(userId) {
    return this.connectedUsers.get(userId);
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = SocketServer;
