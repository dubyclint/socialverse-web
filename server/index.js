const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const winston = require('winston');
require('dotenv').config();

const logger = require('./config/logger');
const routes = require('./routes');
const { connectDatabase } = require('./database/connection');
const { connectRedis } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Redis client
let redisClient;

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    redisClient = await connectRedis();
    
    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    
    app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // Session configuration
    app.use(session({
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SESSION_SECRET || 'your-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        service: 'Compliance Gateway',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
      });
    });
    
    // API routes
    app.use('/api/v1', routes);
    
    // Dashboard routes (if enabled)
    if (process.env.ENABLE_DASHBOARD === 'true') {
      app.set('view engine', 'ejs');
      app.set('views', './src/dashboard/views');
      app.use('/dashboard', express.static('./src/dashboard/public'));
      app.use('/dashboard', require('./routes/dashboard'));
    }
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });
    
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
      });
    });
    
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Compliance Gateway running on port ${PORT}`);
      console.log(`🔒 Compliance Gateway API: http://0.0.0.0:${PORT}`);
      console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
      if (process.env.ENABLE_DASHBOARD === 'true') {
        console.log(`🎛️  Dashboard: http://0.0.0.0:${PORT}/dashboard`);
      }
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

startServer();

module.exports = app;
