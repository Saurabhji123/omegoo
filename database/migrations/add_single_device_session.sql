-- Migration: Add Single-Device Session Management
-- Date: 2025-10-22
-- Description: Add activeDeviceToken and lastLoginDevice fields for enforcing single-device login

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active_device_token TEXT,
ADD COLUMN IF NOT EXISTS last_login_device TEXT;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_active_device_token ON users(active_device_token);

-- Add comment for documentation
COMMENT ON COLUMN users.active_device_token IS 'Current active JWT token - only one device can be logged in at a time';
COMMENT ON COLUMN users.last_login_device IS 'Device info from last login (user-agent + timestamp)';

-- Migration complete
