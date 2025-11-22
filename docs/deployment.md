# Omegoo PWA - Production Deployment Guide

## Prerequisites

### Server Requirements
- **CPU**: 4+ cores (8+ recommended for production)
- **RAM**: 8GB minimum (16GB+ recommended)
- **Storage**: 100GB+ SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Network**: Static IP with ports 80, 443, 22 open

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Nginx (if not using Docker nginx)
- SSL certificates
- Domain name pointing to server

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create omegoo user
sudo useradd -m -s /bin/bash omegoo
sudo usermod -aG docker omegoo
```

### 2. Application Deployment

```bash
# Switch to omegoo user
sudo su - omegoo

# Clone repository
git clone https://github.com/your-org/omegoo.git
cd omegoo

# Copy production environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure environment variables (see configuration section)
nano backend/.env
nano frontend/.env
```

### 3. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot certonly --standalone -d omegoo.app -d www.omegoo.app

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/omegoo.app/fullchain.pem nginx/ssl/omegoo.app.crt
sudo cp /etc/letsencrypt/live/omegoo.app/privkey.pem nginx/ssl/omegoo.app.key
```

#### Option B: Custom SSL Certificates
```bash
# Copy your SSL certificates
cp your-certificate.crt nginx/ssl/omegoo.app.crt
cp your-private-key.key nginx/ssl/omegoo.app.key
```

## Configuration

### Backend Environment Variables

```bash
# backend/.env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://omegoo:YOUR_SECURE_PASSWORD@postgres:5432/omegoo
REDIS_URL=redis://redis:6379

# MongoDB (Required for production - stores reports and user data)
USE_MONGODB=true
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/omegoo?retryWrites=true&w=majority

# Security
JWT_SECRET=YOUR_256_BIT_SECRET_KEY
JWT_EXPIRE=24h
REFRESH_TOKEN_SECRET=YOUR_REFRESH_TOKEN_SECRET
BCRYPT_ROUNDS=12

# CORS
FRONTEND_URL=https://omegoo.app
ALLOWED_ORIGINS=https://omegoo.app,https://www.omegoo.app

# Admin Setup (for initial owner admin creation)
OWNER_ADMIN_EMAIL=admin@omegoo.app
OWNER_ADMIN_PASSWORD=secure_admin_password_change_immediately

# Email Service (for OTP verification)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@omegoo.app

# Third-party APIs
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
SIGHTENGINE_API_USER=your_sightengine_user
SIGHTENGINE_API_SECRET=your_sightengine_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=omegoo-evidence-prod

# Payment
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Monitoring
SENTRY_DSN=your_sentry_dsn

# Text Chat Configuration (optional - uses defaults if not set)
TEXT_CHAT_MATCH_DELAY=150        # milliseconds between match attempts
TEXT_CHAT_RECONNECT_WINDOW=30000  # milliseconds (30 seconds)
TEXT_CHAT_MESSAGE_BUFFER_SIZE=30  # number of messages to buffer
TEXT_CHAT_RATE_LIMIT=10          # messages per window
TEXT_CHAT_RATE_WINDOW=10000      # milliseconds (10 seconds)
```

### Frontend Environment Variables

```bash
# frontend/.env
REACT_APP_BACKEND_URL=https://omegoo.app
REACT_APP_WEBSOCKET_URL=wss://omegoo.app

# Firebase
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_PROJECT_ID=omegoo-prod

# AdMob
REACT_APP_ADMOB_APP_ID=your_admob_app_id
REACT_APP_ADMOB_BANNER_ID=your_banner_id

# Analytics
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX

# App Config
REACT_APP_APP_NAME=Omegoo
GENERATE_SOURCEMAP=false
```

## Deployment Process

### 1. Deploy with Docker Compose

```bash
# Build and start services
docker-compose --profile production up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Database Migration

```bash
# Run database migrations
docker-compose exec backend npm run db:migrate

# MongoDB Indexes Setup (Critical for text chat performance)
docker-compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
db.once('open', async () => {
  // Create indexes for reports collection
  await db.collection('reportedchattranscripts').createIndex({ reportedAt: -1 });
  await db.collection('reportedchattranscripts').createIndex({ reporterId: 1 });
  await db.collection('reportedchattranscripts').createIndex({ reportedUserId: 1 });
  
  // Create indexes for users collection
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ activeDeviceToken: 1 });
  
  console.log('Indexes created successfully');
  process.exit(0);
});
"

# Create initial owner admin (run once)
docker-compose exec backend npm run admin:setup

# Verify admin created
docker-compose exec backend npm run admin:check
```

### 3. Health Checks

```bash
# Check backend health
curl https://omegoo.app/api/health

# Check frontend
curl https://omegoo.app/health

# Check SSL
curl -I https://omegoo.app

# Verify MongoDB connection
docker-compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
  process.exit(0);
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection failed:', err);
  process.exit(1);
});
"

# Test text chat socket connection
node -e "
const io = require('socket.io-client');
const socket = io('https://omegoo.app', {
  transports: ['websocket'],
  auth: { token: 'test-token' }
});
socket.on('connect', () => {
  console.log('Socket connected successfully');
  socket.disconnect();
  process.exit(0);
});
socket.on('connect_error', (err) => {
  console.error('Socket connection failed:', err);
  process.exit(1);
});
"
```

## Monitoring & Maintenance

### 1. Log Management

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check system resources
docker stats

# Disk usage
df -h
docker system df
```

### 2. Database Backup

```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/omegoo/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
docker-compose exec postgres pg_dump -U omegoo omegoo > $BACKUP_DIR/database.sql
gzip $BACKUP_DIR/database.sql

# Keep only last 30 backups
ls -t /home/omegoo/backups/ | tail -n +31 | xargs -I {} rm -rf /home/omegoo/backups/{}
EOF

chmod +x backup-db.sh

# Add to crontab (daily backup)
crontab -e
# Add: 0 2 * * * /home/omegoo/omegoo/backup-db.sh
```

### 3. SSL Certificate Renewal

```bash
# Auto-renewal for Let's Encrypt
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet && systemctl reload nginx
```

### 4. Updates & Patches

```bash
# Update application
git pull origin main
docker-compose --profile production up -d --build

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean old Docker images
docker image prune -f
docker system prune -f
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Deny all other incoming
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### 2. SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# Port 2222 (change from default 22)
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes

sudo systemctl restart sshd
```

### 3. Docker Security

```bash
# Run Docker as non-root user
sudo usermod -aG docker omegoo

# Limit Docker daemon access
sudo nano /etc/docker/daemon.json
{
  "live-restore": true,
  "userland-proxy": false,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Connect to PostgreSQL
\c omegoo

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_device_hash ON users(device_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Analyze tables
ANALYZE;
```

### 2. Redis Configuration

```bash
# Edit Redis config in docker-compose.yml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### 3. Nginx Optimization

```nginx
# Add to nginx.conf
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable HTTP/2
listen 443 ssl http2;

# Enable caching
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose logs postgres
   
   # Restart database
   docker-compose restart postgres
   ```

2. **SSL Certificate Issues**
   ```bash
   # Verify certificate
   openssl x509 -in nginx/ssl/omegoo.app.crt -text -noout
   
   # Check certificate expiry
   openssl x509 -in nginx/ssl/omegoo.app.crt -enddate -noout
   ```

3. **High Memory Usage**
   ```bash
   # Check container memory usage
   docker stats
   
   # Restart services
   docker-compose restart
   ```

4. **Application Not Starting**
   ```bash
   # Check logs
   docker-compose logs
   
   # Verify environment variables
   docker-compose config
   ```

## Rollback Procedure

```bash
# Backup current version
docker tag omegoo_backend:latest omegoo_backend:backup
docker tag omegoo_frontend:latest omegoo_frontend:backup

# Rollback to previous version
git checkout <previous-commit>
docker-compose --profile production up -d --build

# If database rollback needed
docker-compose exec postgres psql -U omegoo -d omegoo -f /path/to/backup.sql
```

## Monitoring & Alerting

### Health Check Endpoints
- Backend: `https://omegoo.app/api/health`
- Frontend: `https://omegoo.app/health`
- Database: Check via backend health endpoint

### Recommended Monitoring Tools
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: ELK Stack, Grafana Loki
- **Metrics**: Prometheus + Grafana
- **Errors**: Sentry
- **Performance**: New Relic, DataDog

## Support & Maintenance

### Regular Tasks
- [ ] Daily: Check application logs
- [ ] Daily: Verify backup completion
- [ ] Daily: Monitor text chat analytics (pairing times, active rooms)
- [ ] Weekly: Update security patches
- [ ] Weekly: Review text chat reports in admin dashboard
- [ ] Monthly: Review performance metrics and load test results
- [ ] Quarterly: Security audit
- [ ] Annually: SSL certificate renewal (if not automated)

---

## Text Chat System - Production Deployment

### Pre-Deployment Checklist

**Backend Setup:**
- [ ] MongoDB connection configured and tested
- [ ] MongoDB indexes created (reports, users)
- [ ] Redis configured (optional but recommended for scaling)
- [ ] Socket.IO CORS configured for production domain
- [ ] Rate limiting configured (10 messages per 10s)
- [ ] Reconnection window set to 30 seconds
- [ ] Message buffer size set to 30 messages

**Frontend Setup:**
- [ ] Backend WebSocket URL updated to production
- [ ] HTTPS/WSS protocol configured
- [ ] Mobile viewport handling tested on iOS/Android
- [ ] Typing indicators debounced (1 second)
- [ ] Reconnection logic enabled with 30s window
- [ ] Report modal integrated and functional

**Monitoring:**
- [ ] Text chat analytics endpoint accessible
- [ ] Queue size monitoring enabled
- [ ] Pairing time metrics tracking (P50/P95/P99)
- [ ] Active rooms count tracking
- [ ] Message delivery rate monitoring
- [ ] Reconnection success rate tracking

**Security:**
- [ ] Input sanitization enabled (XSS prevention)
- [ ] Rate limits enforced server-side
- [ ] Authentication required for all socket events
- [ ] Report system tested with message buffering
- [ ] Admin dashboard accessible for report review

### Load Testing (Before Production)

Run load tests to validate performance targets:

```bash
# Install dependencies
npm install --save-dev socket.io-client

# Run baseline test (100 users)
node docs/test-load.js --users=100 --ramp=10000

# Run production load test (1,000 users)
node docs/test-load.js --users=1000 --ramp=30000

# Run peak load test (10,000 users)
node docs/test-load.js --users=10000 --ramp=60000
```

**Success Criteria:**
- ✅ P95 pairing time <1000ms
- ✅ Message latency <100ms
- ✅ Typing indicator latency <200ms
- ✅ Match success rate >95%
- ✅ Memory usage <2GB
- ✅ CPU usage <50% (on 2-core instance)
- ✅ Reconnection success rate >90%

See [load-testing.md](./load-testing.md) for detailed instructions.

### Production Configuration

**Render.com Deployment:**

```yaml
# render.yaml
services:
  - type: web
    name: omegoo-backend
    env: node
    plan: standard  # or pro for higher traffic
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: USE_MONGODB
        value: true
      - key: MONGODB_URI
        sync: false  # Set in Render dashboard
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        value: https://omegoo.chat
    autoDeploy: true

  - type: web
    name: omegoo-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/build
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: REACT_APP_BACKEND_URL
        value: https://omegoo-backend.onrender.com
```

**Scaling Configuration:**

For horizontal scaling with multiple backend instances:

```javascript
// backend/src/index.ts - Add Redis adapter for Socket.IO
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));

// Replace TextChatQueue in-memory with Redis-backed queue
// See load-testing.md for Redis queue implementation
```

**Memory Management:**

```javascript
// backend/src/services/textChatRoom.ts
// Auto-cleanup runs every 5 minutes
setInterval(() => {
  const now = Date.now();
  const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  for (const [roomId, room] of TextChatRoomService.rooms.entries()) {
    const lastActivity = room.messages[room.messages.length - 1]?.timestamp || room.createdAt;
    
    if (now - lastActivity > INACTIVE_TIMEOUT) {
      TextChatRoomService.cleanupRoom(roomId);
      console.log(`Auto-cleaned inactive room: ${roomId}`);
    }
  }
}, 5 * 60 * 1000);
```

### Post-Deployment Validation

**Smoke Tests:**

```bash
# 1. User registration flow
curl -X POST https://omegoo.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Socket connection test
node -e "
const io = require('socket.io-client');
const socket = io('https://omegoo.app', {
  auth: { token: 'valid-jwt-token' }
});
socket.on('connect', () => {
  console.log('✅ Socket connected');
  
  socket.emit('join_text_queue');
  socket.on('text_queue_joined', (data) => {
    console.log('✅ Queue joined:', data);
    socket.disconnect();
  });
});
"

# 3. Admin dashboard access
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  https://omegoo.app/api/admin/stats
```

**Performance Monitoring:**

```javascript
// Add to backend/src/index.ts for production monitoring
setInterval(() => {
  const stats = TextChatQueueService.getDetailedAnalytics();
  
  // Log to monitoring service (e.g., CloudWatch, Datadog)
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'text-chat',
    metrics: {
      queueSize: stats.queue.currentSize,
      activeRooms: stats.rooms.active,
      pairingMedian: stats.pairing.medianTime,
      underOneSecond: stats.pairing.underOneSecond,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  }));
}, 60000); // Every minute
```

### Monitoring & Alerting

**Critical Alerts:**

Set up alerts for:
- Queue size >1000 (users waiting too long)
- P95 pairing time >1500ms (performance degradation)
- Active rooms >5000 (approaching capacity)
- Memory usage >2GB (memory leak risk)
- CPU usage >70% (overload)
- Reconnection failure rate >20%

**Dashboard Metrics:**

Monitor in real-time:
- Current queue size and wait time
- Active text chat rooms
- Pairing time percentiles (P50, P95, P99)
- Message delivery rate
- Typing indicator latency
- Reconnection success rate
- Rate limit violations

**Log Aggregation:**

```bash
# Backend logs should include:
- User join/leave events with timestamps
- Match creation with pairing time
- Rate limit violations with user IDs
- Reconnection attempts and outcomes
- Report submissions with context
- Errors with stack traces

# Example structured log format:
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "service": "text-chat",
  "event": "match_created",
  "data": {
    "roomId": "text_room_uuid",
    "user1Id": "user_id_1",
    "user2Id": "user_id_2",
    "pairingTime": 450,
    "queueSize": 25
  }
}
```

### Incident Response

**High Pairing Times (>2s):**
1. Check queue size and active rooms
2. Review server CPU/memory usage
3. Verify MongoDB/Redis connection latency
4. Consider scaling horizontally if sustained

**Memory Leaks:**
1. Generate heap snapshot: `kill -USR2 $PID`
2. Check for rooms not being cleaned up
3. Verify socket listeners are removed on disconnect
4. Review message buffer cleanup

**Socket Disconnections:**
1. Check load balancer timeout settings
2. Verify sticky sessions enabled (if multi-instance)
3. Review ping/pong intervals
4. Monitor network connectivity

**Report System Overload:**
1. Check MongoDB write performance
2. Verify message buffering working correctly
3. Review admin dashboard for suspicious patterns
4. Consider rate limiting report submissions

### Rollback Procedure

```bash
# 1. Tag current version before rollback
docker tag omegoo_backend:latest omegoo_backend:pre-rollback

# 2. Stop services
docker-compose down

# 3. Checkout previous stable version
git checkout <previous-stable-commit>

# 4. Rebuild and restart
docker-compose --profile production up -d --build

# 5. Verify health
curl https://omegoo.app/api/health

# 6. Check logs for errors
docker-compose logs -f backend

# 7. If MongoDB migration needed, restore from backup
docker-compose exec backend node scripts/restore-db.js /backups/latest.bson
```

### Production Launch Checklist

**Pre-Launch (T-24 hours):**
- [ ] All environment variables set in production
- [ ] SSL certificates valid and auto-renewal configured
- [ ] MongoDB indexes created and optimized
- [ ] Load testing completed successfully
- [ ] Monitoring and alerting configured
- [ ] Admin dashboard accessible
- [ ] Backup procedures tested
- [ ] Rollback procedure documented and tested

**Launch (T-0):**
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Run smoke tests
- [ ] Verify all health checks pass
- [ ] Monitor logs for errors
- [ ] Check initial metrics (queue size, pairing times)

**Post-Launch (T+1 hour):**
- [ ] User registration working
- [ ] Text chat pairing functional
- [ ] Typing indicators responsive
- [ ] Messages delivering reliably
- [ ] Reconnection working within 30s window
- [ ] Report system capturing messages

**Post-Launch (T+24 hours):**
- [ ] Review 24-hour metrics
- [ ] Analyze pairing time percentiles
- [ ] Check for memory leaks
- [ ] Review error logs
- [ ] Validate backup completion
- [ ] User feedback collection

**Post-Launch (T+1 week):**
- [ ] Performance review meeting
- [ ] Analyze usage patterns
- [ ] Identify optimization opportunities
- [ ] Plan for scaling if needed
- [ ] Update documentation based on learnings

### Additional Resources

- [API Documentation](./api.md#ultra-fast-text-chat-system)
- [Load Testing Guide](./load-testing.md)
- [Render Deployment Docs](https://render.com/docs)
- [Socket.IO Production Best Practices](https://socket.io/docs/v4/performance-tuning/)
- [MongoDB Performance Tuning](https://www.mongodb.com/docs/manual/administration/production-notes/)

### Regular Tasks
- [ ] Daily: Check application logs
- [ ] Daily: Verify backup completion
- [ ] Daily: Monitor text chat analytics (pairing times, active rooms)
- [ ] Weekly: Update security patches
- [ ] Weekly: Review text chat reports in admin dashboard
- [ ] Monthly: Review performance metrics and load test results
- [ ] Quarterly: Security audit
- [ ] Annually: SSL certificate renewal (if not automated)

### Emergency Contacts
- **System Administrator**: admin@omegoo.app
- **Technical Lead**: tech@omegoo.app
- **Legal/Compliance**: legal@omegoo.app