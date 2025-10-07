import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { DatabaseService, RedisService } from '../services/serviceFactory';

const router: Router = Router();

// Hash utilities
const hashDevice = (userAgent: string, fingerprint?: string): string => {
  return crypto.createHash('sha256').update(userAgent + (fingerprint || '') + 'device_salt').digest('hex');
};

const hashIP = (ip: string): string => {
  return crypto.createHash('sha256').update(ip + 'ip_salt').digest('hex');
};

const hashPhone = (phone: string): string => {
  return crypto.createHash('sha256').update(phone + 'phone_salt').digest('hex');
};

// Login/Register
router.post('/login', async (req, res) => {
  try {
    const { deviceId, userAgent, fingerprint } = req.body;

    if (!deviceId || !userAgent) {
      return res.status(400).json({
        success: false,
        error: 'Device ID and user agent are required'
      });
    }

    const deviceHash = hashDevice(userAgent, fingerprint);
    const ipHash = hashIP(req.ip || req.connection.remoteAddress || 'unknown');

    // Check if user is banned
    const banCheck = await DatabaseService.checkUserBanned(deviceHash, undefined, ipHash);
    if (banCheck) {
      return res.status(403).json({
        success: false,
        error: 'Account is banned',
        code: 'USER_BANNED',
        ban: {
          reason: banCheck.reason,
          expiresAt: banCheck.expires_at
        }
      });
    }

    // Find or create user
    let user = await DatabaseService.getUserByDeviceId(deviceId);
    
    if (!user) {
      user = await (DatabaseService as any).createUser({
        deviceId
      });
    } else {
      // Update last active
      user = await DatabaseService.updateUser(user.id, {
        lastActiveAt: new Date()
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, deviceId: user.device_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        tier: user.tier,
        status: user.status,
        isVerified: user.is_verified,
        coins: user.coins,
        createdAt: user.created_at,
        preferences: user.preferences || {},
        subscription: user.subscription || { type: 'none' }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await DatabaseService.getUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        tier: user.tier,
        status: user.status,
        isVerified: user.is_verified,
        coins: user.coins,
        createdAt: user.created_at,
        preferences: user.preferences || {},
        subscription: user.subscription || { type: 'none' }
      }
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Request OTP for phone verification
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Valid Indian mobile number required'
      });
    }

    // Generate OTP (in production, use SMS service)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Redis with 5 min expiry
    await RedisService.set(`otp:${phone}`, { otp, attempts: 0 }, 300);

    // In development, log OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔢 OTP for ${phone}: ${otp}`);
    }

    // TODO: Send SMS via Twilio/MSG91
    
    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

// Verify phone with OTP
router.post('/verify-phone', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token required'
      });
    }

    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone and OTP are required'
      });
    }

    // Verify OTP
    const storedData = await RedisService.get(`otp:${phone}`);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'OTP expired or not found'
      });
    }

    if (storedData.otp !== otp) {
      // Increment attempts
      storedData.attempts = (storedData.attempts || 0) + 1;
      
      if (storedData.attempts >= 3) {
        await RedisService.del(`otp:${phone}`);
        return res.status(400).json({
          success: false,
          error: 'Too many incorrect attempts'
        });
      }
      
      await RedisService.set(`otp:${phone}`, storedData, 300);
      
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    // OTP verified, update user
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const phoneHash = hashPhone(phone);
    
    const user = await DatabaseService.verifyUserPhone(decoded.userId, phoneHash);
    
    // Clean up OTP
    await RedisService.del(`otp:${phone}`);
    
    // Award verification coins
    await DatabaseService.updateUser(user.id, {
      coins: (user.coins || 0) + 10
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        tier: user.tier,
        status: user.status,
        isVerified: user.is_verified,
        coins: (user.coins || 0) + 10,
        createdAt: user.created_at,
        preferences: user.preferences || {},
        subscription: user.subscription || { type: 'none' }
      }
    });
  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

// Logout (optional - mainly client-side)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;