import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Load environment variables FIRST before any other imports
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import chatRoutes from './routes/chat';
import moderationRoutes from './routes/moderation';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import reportsRoutes from './routes/reports';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Import services (AFTER dotenv.config)
import { SocketService } from './services/socket';
import { ServiceFactory } from './services/serviceFactory';

const app: express.Application = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://omegoo.vercel.app',
          'https://saurabhji123.github.io', 
          'https://saurabhji123.github.io/omegoo'
        ]
      : process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://omegoo.vercel.app',
        'https://saurabhji123.github.io', 
        'https://saurabhji123.github.io/omegoo'
      ]
    : process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Added PATCH method
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check endpoint with enhanced monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    connections: SocketService.getConnectedUserCount(),
    version: '1.0.0'
  });
});

// Keepalive endpoint to prevent cold starts
app.get('/keepalive', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Root endpoint for frontend connection test
app.get('/', (req, res) => {
  res.json({
    message: 'Omegoo Backend API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent')
  });
});

// Test endpoint for socket connection debugging
app.get('/test-connection', (req, res) => {
  res.json({
    message: 'Backend reachable',
    socketConnections: SocketService.getConnectedUserCount(),
    timestamp: new Date().toISOString(),
    origin: req.get('Origin')
  });
});

// Stricter rate limiting for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 login attempts per minute per IP
  message: {
    success: false,
    error: 'Too many login attempts from this IP. Please try again after 1 minute.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API routes
app.use('/api/auth/login', authLimiter); // 🔒 Rate limit login endpoint
app.use('/api/auth/register', authLimiter); // 🔒 Rate limit register endpoint
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes); // Public reports endpoint
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/moderation', authenticateToken, moderationRoutes);
app.use('/api/payment', authenticateToken, paymentRoutes);
app.use('/api/admin', adminRoutes); // Admin routes handle their own authentication

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Run database migrations
async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // MongoDB doesn't need SQL migrations - schema is defined in models
    // activeDeviceToken and lastLoginDevice fields are already in UserSchema
    
    console.log('✅ Database migrations completed (MongoDB schema-based)');
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't exit - continue server startup even if migration fails
  }
}

// Initialize services
async function initializeServices() {
  try {
    // Initialize database service using factory
    const DatabaseServiceClass = ServiceFactory.DatabaseService;
    await (DatabaseServiceClass as any).initialize();

    // Initialize Redis service using factory  
    const RedisServiceClass = ServiceFactory.RedisService;
    await (RedisServiceClass as any).initialize();

    // Run migrations after database initialization
    await runMigrations();

    // Initialize socket service
    SocketService.initialize(io);
    console.log('✅ Socket.IO initialized');

    console.log('🚀 All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      console.log(`🌟 Omegoo Backend Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}`);
      console.log(`🛡️ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    const DatabaseServiceClass = ServiceFactory.DatabaseService;
    const RedisServiceClass = ServiceFactory.RedisService;
    
    if ((DatabaseServiceClass as any).close) {
      await (DatabaseServiceClass as any).close();
    }
    if ((RedisServiceClass as any).close) {
      await (RedisServiceClass as any).close();
    }
    
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    const DatabaseServiceClass = ServiceFactory.DatabaseService;
    const RedisServiceClass = ServiceFactory.RedisService;
    
    if ((DatabaseServiceClass as any).close) {
      await (DatabaseServiceClass as any).close();
    }
    if ((RedisServiceClass as any).close) {
      await (RedisServiceClass as any).close();
    }
    
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Keep server alive with periodic self-ping (Render free tier workaround)
function keepServerAlive() {
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_SERVICE_NAME) {
    const https = require('https');
    
    const selfPing = () => {
      const url = `https://${process.env.RENDER_SERVICE_NAME}.onrender.com/keepalive`;
      https.get(url, (res: any) => {
        // Silent ping - just consume response
        res.on('data', () => {});
      }).on('error', () => {
        // Silent error - keep-alive should not crash server
      });
    };
    
    // Ping every 10 minutes to prevent sleep
    setInterval(selfPing, 10 * 60 * 1000);
    console.log('🔄 Keep-alive mechanism enabled for Render deployment');
  }
}

// Start the server
startServer();

// Initialize keep-alive after server starts
setTimeout(keepServerAlive, 5000);

export default app;