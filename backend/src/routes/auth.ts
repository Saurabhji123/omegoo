import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { DatabaseService, RedisService } from '../services/serviceFactory';

const router: Router = Router();

// Auth middleware for protected routes
interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

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

/**
 * Helper function to check and reset daily coins automatically
 * Resets coins to 50 at 12 AM every day
 */
const checkAndResetDailyCoins = async (userId: string) => {
  try {
    const user = await DatabaseService.getUserById(userId);
    if (!user) return user;

    const now = new Date();
    const lastReset = user.lastCoinClaim ? new Date(user.lastCoinClaim) : null;

    // MIGRATION: If user doesn't have lastCoinClaim, set it to today without resetting coins
    if (!lastReset) {
      console.log('🔧 Migration: Setting lastCoinClaim for existing user:', userId);
      await DatabaseService.updateUser(userId, {
        lastCoinClaim: now,
        totalChats: user.totalChats || 0,
        dailyChats: user.dailyChats || 0
      });
      return await DatabaseService.getUserById(userId);
    }

    // Check if it's a new day (date changed at 12 AM)
    const isNewDay = lastReset.toDateString() !== now.toDateString();

    if (isNewDay) {
      // Automatic reset: Set coins to 50 regardless of current balance
      const DAILY_COINS = 50;
      
      await DatabaseService.updateUser(userId, {
        coins: DAILY_COINS,
        lastCoinClaim: now,
        dailyChats: 0 // Reset daily chats counter (keep totalChats unchanged)
      });

      console.log('🔄 Auto-reset daily coins:', { 
        userId, 
        newCoins: DAILY_COINS,
        date: now.toDateString()
      });

      // Return updated user data
      return await DatabaseService.getUserById(userId);
    }

    return user;
  } catch (error) {
    console.error('❌ Auto-reset coins error:', error);
    return null;
  }
};

// ==================== EMAIL/PASSWORD AUTHENTICATION ====================

/**
 * Register with Email/Password
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    console.log('📝 Registration attempt:', { email, username });

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password validation (min 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Username validation
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters'
      });
    }

    // Check if user already exists
    const existingUser = await DatabaseService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('🔒 Password hashed successfully');

    // Create user
    const user = await DatabaseService.createUser({
      email,
      username,
      passwordHash,
      tier: 'guest',
      status: 'active',
      isVerified: false,
      coins: 50, // Welcome bonus
      lastCoinClaim: new Date(), // Set initial claim date to prevent auto-reset
      totalChats: 0, // Initialize chat counters
      dailyChats: 0,
      deviceId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    console.log('✅ User created:', { id: user.id, email: user.email, username: user.username });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.tier },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    console.log('🎟️ JWT token generated');

    const responseData = {
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tier: user.tier,
        status: user.status,
        isVerified: user.isVerified,
        coins: user.coins
      }
    };

    console.log('📤 Sending response:', { hasToken: !!responseData.token, userId: responseData.user.id });

    res.json(responseData);
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

/**
 * Login with Email/Password
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await DatabaseService.getUserByEmail(email);
    
    console.log('👤 User lookup result:', { found: !!user, hasPassword: !!user?.passwordHash });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user has password (not OAuth user)
    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: 'Please login with Google'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    console.log('🔑 Password verification:', { isValid: isValidPassword });
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is banned
    const banStatus = await DatabaseService.checkUserBanStatus(user.id);
    if (banStatus) {
      return res.status(403).json({
        success: false,
        error: 'Account is banned',
        code: 'USER_BANNED',
        ban: {
          reason: banStatus.reason,
          expiresAt: banStatus.expiresAt,
          type: banStatus.banType
        }
      });
    }

    // Check and auto-reset daily coins if needed
    const updatedUser = await checkAndResetDailyCoins(user.id);
    const finalUser = updatedUser || user;

    // Update last active
    await DatabaseService.updateUser(finalUser.id, {
      lastActiveAt: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: finalUser.id, email: finalUser.email, role: finalUser.tier },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', { userId: finalUser.id, email: finalUser.email, coins: finalUser.coins });

    res.json({
      success: true,
      token,
      user: {
        id: finalUser.id,
        email: finalUser.email,
        username: finalUser.username,
        tier: finalUser.tier,
        status: finalUser.status,
        isVerified: finalUser.isVerified,
        coins: finalUser.coins,
        preferences: finalUser.preferences || {},
        subscription: finalUser.subscription || { type: 'none' }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * Google OAuth Login/Register
 * POST /api/auth/google
 */
router.post('/google', async (req, res) => {
  try {
    const { idToken, email, name, picture } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Find or create user
    let user = await DatabaseService.getUserByEmail(email);

    if (!user) {
      // Create new user from Google
      user = await DatabaseService.createUser({
        email,
        username: name || email.split('@')[0],
        tier: 'guest',
        status: 'active',
        isVerified: true, // Google accounts are pre-verified
        coins: 50,
        deviceId: `google-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        preferences: {
          avatar: picture
        }
      });
    } else {
      // Check if user is banned
      const banStatus = await DatabaseService.checkUserBanStatus(user.id);
      if (banStatus) {
        return res.status(403).json({
          success: false,
          error: 'Account is banned',
          code: 'USER_BANNED',
          ban: {
            reason: banStatus.reason,
            expiresAt: banStatus.expiresAt,
            type: banStatus.banType
          }
        });
      }

      // Update last active
      await DatabaseService.updateUser(user.id, {
        lastActiveAt: new Date()
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.tier },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tier: user.tier,
        status: user.status,
        isVerified: user.isVerified,
        coins: user.coins,
        preferences: user.preferences || {},
        subscription: user.subscription || { type: 'none' }
      }
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Google authentication failed'
    });
  }
});

/**
 * Request OTP for phone verification
 * POST /api/auth/request-otp
 */
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
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && { otp }) // Only in dev
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

/**
 * Verify phone with OTP
 * POST /api/auth/verify-phone
 */
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
      message: 'Phone verified successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tier: user.tier,
        status: user.status,
        isVerified: user.isVerified,
        coins: (user.coins || 0) + 10
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

/**
 * Get Current User
 * GET /api/auth/me
 * Automatically resets coins to 50 at midnight every day
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log('👤 Fetching user data:', { userId: req.userId });

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    // Check and auto-reset daily coins if needed
    const user = await checkAndResetDailyCoins(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('✅ User data fetched:', { 
      userId: user.id, 
      email: user.email, 
      username: user.username,
      coins: user.coins 
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        deviceId: user.deviceId,
        email: user.email,
        username: user.username,
        tier: user.tier,
        status: user.status,
        coins: user.coins,
        isVerified: user.isVerified,
        totalChats: user.totalChats || 0,
        dailyChats: user.dailyChats || 0,
        lastCoinClaim: user.lastCoinClaim,
        preferences: user.preferences,
        subscription: user.subscription,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastActiveAt: user.lastActiveAt
      }
    });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data'
    });
  }
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
