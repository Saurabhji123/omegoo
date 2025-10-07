# Database Setup Instructions

## Prerequisites
- PostgreSQL 14+
- Redis 6+

## Setup Steps

### 1. PostgreSQL Setup

```bash
# Create database
createdb omegoo

# Or using psql
psql -U postgres
CREATE DATABASE omegoo;
\q
```

### 2. Run Schema Migration

```bash
# From database directory
psql -d omegoo -f schema.sql
```

### 3. Redis Setup

```bash
# Start Redis server
redis-server

# Or using Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 4. Environment Configuration

Copy the `.env.example` file and update database URLs:

```bash
# PostgreSQL connection
DATABASE_URL=postgresql://username:password@localhost:5432/omegoo

# Redis connection
REDIS_URL=redis://localhost:6379
```

## Database Features

### Compliance Features
- **18+ Only**: Strict age verification tracking
- **POCSO Compliance**: Evidence preservation with 90-day retention
- **GDPR Ready**: Minimal PII with hash-based identification
- **IT Rules 2021**: Grievance mechanism and audit logging

### Security Features
- **Multi-factor Bans**: Device, IP, and phone hash tracking
- **Evidence Encryption**: S3 KMS encryption for all evidence
- **Audit Trail**: Complete action logging for compliance
- **Row-level Security**: Ready for fine-grained access control

### Performance Features
- **Optimized Indexes**: Fast queries for matching and moderation
- **JSON Fields**: Flexible preferences and metadata storage
- **Partitioning Ready**: Can be partitioned by date for scale

## Key Tables

1. **users** - Core user data with minimal PII
2. **chat_sessions** - All chat interactions with evidence flags
3. **moderation_reports** - CRITICAL for POCSO compliance
4. **ban_records** - Multi-factor ban prevention system
5. **evidence_records** - S3 encrypted evidence with retention
6. **audit_logs** - Complete audit trail
7. **grievances** - IT Rules 2021 compliance

## Data Retention

- **Chat Sessions**: Metadata retained indefinitely, content purged after session
- **Evidence**: 90 days encrypted retention for legal compliance
- **Audit Logs**: 1 year retention
- **User Data**: Retained while account active, deleted on account deletion

## Backup Strategy

```bash
# Daily backup
pg_dump omegoo > backup_$(date +%Y%m%d).sql

# Restore
psql -d omegoo < backup_20231207.sql
```

## Monitoring Queries

```sql
-- Daily active users
SELECT COUNT(DISTINCT id) FROM users WHERE last_active_at >= NOW() - INTERVAL '1 day';

-- Pending reports (SLA monitoring)
SELECT COUNT(*) FROM moderation_reports WHERE status = 'pending' AND created_at < NOW() - INTERVAL '24 hours';

-- Storage usage
SELECT pg_size_pretty(pg_database_size('omegoo'));
```