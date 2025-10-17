// server/index.ts
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { setupStreamingWebSocket } from './ws/streaming'

// Import route handlers
import streamRecordingRoutes from './routes/streamRecordingRoutes'
import streamAnalyticsRoutes from './routes/streamAnalyticsRoutes'
import streamModerationRoutes from './routes/streamModerationRoutes'
import streamRoutes from './routes/streamRoutes'
import userRoutes from './routes/userRoutes'
import authRoutes from './routes/authRoutes'

// Import existing controllers
import { escrowRoutes } from '../escrowRoutes'
import { pewGiftRoutes } from '../pewGiftRoutes'
import { palRoutes } from '../palRoutes'
import { postRoutes } from '../postRoutes'
import { tradeRoutes } from '../tradeRoutes'
import { walletRoutes } from '../walletRoutes'
import { notificationRoutes } from '../notificationRoutes'
import { universeRoutes } from '../universeRoutes'
import { matchRoutes } from '../matchRoutes'
import { p2pRoutes } from '../p2pRoutes'
import { swapRoutes } from '../swapRoutes'
import { giftRoutes } from '../giftRoutes'

const app = express()
const server = createServer(app)

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.APP_URL || 'https://your-domain.com']
      : ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
})

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.APP_URL || 'https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/streams', streamRoutes)
app.use('/api/recordings', streamRecordingRoutes)
app.use('/api/analytics', streamAnalyticsRoutes)
app.use('/api/moderation', streamModerationRoutes)

// Existing routes
app.use('/api/escrow', escrowRoutes)
app.use('/api/pewgift', pewGiftRoutes)
app.use('/api/pal', palRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/trade', tradeRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/universe', universeRoutes)
app.use('/api/match', matchRoutes)
app.use('/api/p2p', p2pRoutes)
app.use('/api/swap', swapRoutes)
app.use('/api/gifts', giftRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack, details: err })
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
})

// Setup WebSocket namespaces
setupStreamingWebSocket(io)

// Setup general WebSocket for other features
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  // Handle general app events
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`)
    console.log(`User ${userId} joined their personal room`)
  })
  
  socket.on('leave-user-room', (userId) => {
    socket.leave(`user-${userId}`)
    console.log(`User ${userId} left their personal room`)
  })
  
  // Handle notifications
  socket.on('mark-notification-read', async (data) => {
    const { notificationId, userId } = data
    // Update notification status in database
    // Broadcast to user's other sessions
    socket.to(`user-${userId}`).emit('notification-updated', {
      notificationId,
      status: 'read'
    })
  })
  
  // Handle typing indicators for chat
  socket.on('typing-start', (data) => {
    const { roomId, userId, username } = data
    socket.to(roomId).emit('user-typing', { userId, username })
  })
  
  socket.on('typing-stop', (data) => {
    const { roomId, userId } = data
    socket.to(roomId).emit('user-stopped-typing', { userId })
  })
  
  socket.on('disconnect', (reason) => {
    console.log(`Client ${socket.id} disconnected:`, reason)
  })
})

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

const PORT = process.env.PORT || 8080
const HOST = process.env.HOST || '0.0.0.0'

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`)
  console.log(`📡 WebSocket server ready`)
  console.log(`🎥 Streaming namespace: /streaming`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})
// server/index.ts (updated to include socket integration)
import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import { setupStreamingWebSocket } from './ws/streaming'
import SocketServer from './ws/socketServer'

// Import route handlers
import streamRecordingRoutes from './routes/streamRecordingRoutes'
import streamAnalyticsRoutes from './routes/streamAnalyticsRoutes'
import streamModerationRoutes from './routes/streamModerationRoutes'
import streamRoutes from './routes/streamRoutes'
import userRoutes from './routes/userRoutes'
import chatRoutes from './routes/chatRoutes'
import groupChatRoutes from './routes/groupChatRoutes'
import statusRoutes from './routes/statusRoutes'
import contactSyncRoutes from './routes/contactSyncRoutes'

const app = express()
const httpServer = createServer(app)

// Initialize Socket.io server
const socketServer = new SocketServer(httpServer)

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Make socket.io available to routes
app.use((req, res, next) => {
  req.io = socketServer.io
  req.socketServer = socketServer
  next()
})

// Routes
app.use('/api/streams', streamRoutes)
app.use('/api/stream-recording', streamRecordingRoutes)
app.use('/api/stream-analytics', streamAnalyticsRoutes)
app.use('/api/stream-moderation', streamModerationRoutes)
app.use('/api/users', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/groups', groupChatRoutes)
app.use('/api/status', statusRoutes)
app.use('/api/contacts', contactSyncRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connectedUsers: socketServer.getConnectedUserCount()
  })
})

// Setup streaming WebSocket (existing)
setupStreamingWebSocket(httpServer)

const PORT = process.env.PORT || 8080
const HOST = process.env.HOST || '0.0.0.0'

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`)
  console.log(`📡 Socket.io server initialized`)
  console.log(`👥 Ready for real-time connections`)
})

export default app

export { io }
