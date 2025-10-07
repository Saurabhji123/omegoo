-- Omegoo Database Schema
-- CRITICAL: 18+ Platform with POCSO/GDPR Compliance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - core user data with minimal PII
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_hash VARCHAR(64) NOT NULL, -- SHA256 of device fingerprint
    phone_hash VARCHAR(64), -- SHA256 of phone number (for verification)
    ip_hash VARCHAR(64), -- SHA256 of IP (for ban tracking)
    user_agent TEXT,
    
    -- User tier and status
    tier VARCHAR(20) DEFAULT 'guest' CHECK (tier IN ('guest', 'verified', 'premium')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Gamification
    coins INTEGER DEFAULT 0,
    
    -- User preferences (JSON)
    preferences JSONB DEFAULT '{
        "language": "en",
        "interests": [],
        "ageRange": null,
        "genderPreference": "any"
    }',
    
    -- Subscription info (JSON)
    subscription JSONB DEFAULT '{
        "type": "none",
        "expiresAt": null
    }',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(device_id),
    INDEX(device_hash),
    INDEX(phone_hash),
    INDEX(status),
    INDEX(tier)
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Chat details
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('text', 'audio', 'video')),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'connected', 'ended', 'reported')),
    
    -- Session timing
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration INTEGER, -- seconds
    
    -- Moderation flags
    reported_by UUID REFERENCES users(id),
    moderation_flags TEXT[] DEFAULT '{}',
    
    -- Evidence preservation (for compliance)
    evidence_preserved BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(user1_id),
    INDEX(user2_id),
    INDEX(status),
    INDEX(started_at),
    INDEX(mode)
);

-- Moderation reports table (CRITICAL for compliance)
CREATE TABLE moderation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Violation details
    violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN (
        'nudity', 'explicit_content', 'harassment', 'spam', 'underage', 'violence'
    )),
    description TEXT NOT NULL,
    
    -- Evidence (S3 URLs with encryption)
    evidence_urls TEXT[] DEFAULT '{}',
    
    -- AI detection info
    auto_detected BOOLEAN DEFAULT FALSE,
    confidence_score REAL DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Review status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    action VARCHAR(20) CHECK (action IN ('warn', 'suspend', 'ban', 'report_le')),
    
    -- Review details
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(session_id),
    INDEX(reported_user_id),
    INDEX(violation_type),
    INDEX(status),
    INDEX(auto_detected),
    INDEX(created_at)
);

-- Ban records table (multi-factor ban tracking)
CREATE TABLE ban_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES moderation_reports(id),
    
    -- Ban details
    type VARCHAR(20) NOT NULL CHECK (type IN ('temporary', 'permanent')),
    reason TEXT NOT NULL,
    
    -- Multi-factor ban tracking
    device_hashes JSONB NOT NULL, -- Array of device hashes
    phone_hash VARCHAR(64),
    ip_hashes JSONB NOT NULL, -- Array of IP hashes
    
    -- Ban timing
    expires_at TIMESTAMP, -- NULL for permanent bans
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Legal reporting
    reported_to_le BOOLEAN DEFAULT FALSE,
    le_report_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(user_id),
    INDEX(type),
    INDEX(is_active),
    INDEX(expires_at),
    INDEX(created_at)
);

-- Transactions table (payments and coins)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    type VARCHAR(20) NOT NULL CHECK (type IN ('coin_purchase', 'subscription', 'reward', 'gift', 'spend')),
    amount DECIMAL(10,2), -- Rupees
    coins INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    
    -- Payment details
    payment_id VARCHAR(255), -- Razorpay/Stripe payment ID
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Metadata (JSON for payment gateway data)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(user_id),
    INDEX(type),
    INDEX(status),
    INDEX(created_at)
);

-- Evidence storage metadata (S3 references with encryption info)
CREATE TABLE evidence_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    report_id UUID REFERENCES moderation_reports(id),
    
    -- Evidence details
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'text')),
    s3_key VARCHAR(500) NOT NULL, -- S3 object key
    encrypted_with VARCHAR(100), -- KMS key ID
    file_hash VARCHAR(64), -- SHA256 for integrity
    
    -- Retention (CRITICAL for compliance)
    retention_days INTEGER DEFAULT 90,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '90 days'),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(session_id),
    INDEX(report_id),
    INDEX(expires_at),
    INDEX(created_at)
);

-- System audit log (for compliance and debugging)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES chat_sessions(id),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- Request details
    ip_hash VARCHAR(64),
    user_agent TEXT,
    
    -- Changes (before/after for updates)
    old_values JSONB,
    new_values JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(user_id),
    INDEX(action),
    INDEX(entity_type),
    INDEX(created_at)
);

-- App analytics (privacy-safe metrics)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event details
    event_name VARCHAR(100) NOT NULL,
    user_tier VARCHAR(20),
    
    -- Anonymous metrics only
    properties JSONB DEFAULT '{}',
    
    -- No user_id for privacy!
    -- Geography (country level only)
    country_code VARCHAR(2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(event_name),
    INDEX(user_tier),
    INDEX(created_at),
    INDEX(country_code)
);

-- Grievance tracking (for IT Rules compliance)
CREATE TABLE grievances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contact details
    email VARCHAR(255),
    name VARCHAR(100),
    
    -- Grievance details
    type VARCHAR(50) NOT NULL CHECK (type IN ('content', 'account', 'technical', 'legal', 'other')),
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Processing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'under_review', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id),
    resolution TEXT,
    
    -- SLA tracking (72 hours as per IT Rules)
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX(status),
    INDEX(type),
    INDEX(created_at)
);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grievances_updated_at BEFORE UPDATE ON grievances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW active_users AS
SELECT id, device_id, tier, status, is_verified, coins, created_at, last_active_at
FROM users 
WHERE status = 'active';

CREATE VIEW daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users,
    COUNT(CASE WHEN tier = 'verified' THEN 1 END) as verified_users,
    COUNT(CASE WHEN tier = 'premium' THEN 1 END) as premium_users
FROM users
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Initial admin user (update with your details)
INSERT INTO users (device_id, device_hash, user_agent, tier, status, is_admin, is_verified) 
VALUES ('admin-device-1', 'admin-hash', 'Omegoo Admin', 'premium', 'active', TRUE, TRUE);

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user table with minimal PII for 18+ platform';
COMMENT ON TABLE chat_sessions IS 'Chat session tracking with evidence preservation';
COMMENT ON TABLE moderation_reports IS 'CRITICAL: All violation reports for POCSO compliance';
COMMENT ON TABLE ban_records IS 'Multi-factor ban system to prevent circumvention';
COMMENT ON TABLE evidence_records IS 'S3 encrypted evidence with 90-day retention';
COMMENT ON TABLE audit_logs IS 'Complete audit trail for compliance';
COMMENT ON TABLE grievances IS 'IT Rules 2021 grievance mechanism';

-- Security row-level policies (enable when needed)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;