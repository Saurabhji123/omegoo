import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import chatRoutes from './routes/chat';
import moderationRoutes from './routes/moderation';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Import services
import { SocketService } from './services/socket';
import { ServiceFactory } from './services/serviceFactory';

// Load environment variables
dotenv.config();

const app: express.Application = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint for frontend connection test
app.get('/', (req, res) => {
  res.json({
    message: 'Omegoo Backend API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/moderation', authenticateToken, moderationRoutes);
app.use('/api/payment', authenticateToken, paymentRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize services
async function initializeServices() {
  try {
    // Initialize database service using factory
    const DatabaseServiceClass = ServiceFactory.DatabaseService;
    await (DatabaseServiceClass as any).initialize();

    // Initialize Redis service using factory  
    const RedisServiceClass = ServiceFactory.RedisService;
    await (RedisServiceClass as any).initialize();

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

// Start the server
startServer();

export default app;