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

# Security
JWT_SECRET=YOUR_256_BIT_SECRET_KEY
JWT_EXPIRE=24h
REFRESH_TOKEN_SECRET=YOUR_REFRESH_TOKEN_SECRET
BCRYPT_ROUNDS=12

# CORS
FRONTEND_URL=https://omegoo.app
ALLOWED_ORIGINS=https://omegoo.app,https://www.omegoo.app

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

# Create admin user (optional)
docker-compose exec backend npm run db:seed
```

### 3. Health Checks

```bash
# Check backend health
curl https://omegoo.app/api/health

# Check frontend
curl https://omegoo.app/health

# Check SSL
curl -I https://omegoo.app
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
- [ ] Weekly: Update security patches
- [ ] Monthly: Review performance metrics
- [ ] Quarterly: Security audit
- [ ] Annually: SSL certificate renewal (if not automated)

### Emergency Contacts
- **System Administrator**: admin@omegoo.app
- **Technical Lead**: tech@omegoo.app
- **Legal/Compliance**: legal@omegoo.app