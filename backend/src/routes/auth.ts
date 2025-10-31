import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { DatabaseService, RedisService } from '../services/serviceFactory';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/email';

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

      // 🔒 Single-device session enforcement
      const user = await DatabaseService.getUserById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if this token is still the active one
      if (user.activeDeviceToken && user.activeDeviceToken !== token) {
        console.log('⚠️ Session replaced for user:', decoded.userId);
        return res.status(401).json({
          success: false,
          error: 'Your session has been replaced by a login from another device',
          code: 'SESSION_REPLACED'
        });
      }

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

    console.log('\n=== 📝 REGISTRATION ATTEMPT START ===');
    console.log('📧 Email:', email);
    console.log('👤 Username:', username);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🌐 IP:', req.ip);
    console.log('📱 User Agent:', req.headers['user-agent']);

    // Validation
    if (!email || !password || !username) {
      console.log('❌ FAILED: Missing required fields');
      console.log('=== REGISTRATION ATTEMPT END ===\n');
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      });
    }

    // Email validation
    console.log('✅ Validating email format...');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ FAILED: Invalid email format');
      console.log('=== REGISTRATION ATTEMPT END ===\n');
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    console.log('✅ Email format valid');

    // 📧 RESEND RESTRICTION: Only allow verified domain emails
    // Resend requires domain verification to send emails to other addresses
    const allowedEmail = 'omegoochat@gmail.com';
    if (email !== allowedEmail) {
      console.log('❌ FAILED: Email not allowed (Resend domain not verified)');
      console.log(`Attempted email: ${email}`);
      console.log(`Allowed email: ${allowedEmail}`);
      console.log('=== REGISTRATION ATTEMPT END ===\n');
      return res.status(400).json({
        success: false,
        error: `Currently, only ${allowedEmail} can register. Domain verification pending for other emails.`
      });
    }
    console.log('✅ Email allowed for registration');

    // Password validation (min 6 characters)
    console.log('✅ Validating password...');
    if (password.length < 6) {
      console.log('❌ FAILED: Password too short');
      console.log('=== REGISTRATION ATTEMPT END ===\n');
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }
    console.log('✅ Password valid');

    // Username validation
    console.log('✅ Validating username...');
    if (username.length < 3) {
      console.log('❌ FAILED: Username too short');
      console.log('=== REGISTRATION ATTEMPT END ===\n');
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters'
      });
    }
    console.log('✅ Username valid');

    // Check if user already exists
    console.log('🔍 Checking if email already registered...');
    const existingUser = await DatabaseService.getUserByEmail(email);
    if (existingUser) {
      console.log('❌ FAILED: Email already registered:', email);
      console.log('Existing user ID:', existingUser.id);
      console.log('=== REGISTRATION ATTEMPT END ===\n');
      return res.status(400).json({
        success: false,
        error: 'Email already registered. Please login instead.',
        shouldLogin: true // Frontend will redirect to login
      });
    }
    console.log('✅ Email available for registration');

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // 📧 Generate OTP for email verification
    console.log('📧 Generating OTP...');
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('✅ OTP generated:', otp, '(expires at:', otpExpiresAt.toLocaleTimeString(), ')');

    // Create user
    console.log('💾 Creating user in database...');
    const user = await DatabaseService.createUser({
      email,
      username,
      passwordHash,
      tier: 'guest',
      status: 'active',
      isVerified: false, // ❌ Not verified yet - needs OTP
      otp, // 📧 Store OTP
      otpExpiresAt, // 📧 Store expiry
      coins: 50, // Welcome bonus
      lastCoinClaim: new Date(), // Set initial claim date to prevent auto-reset
      totalChats: 0, // Initialize chat counters
      dailyChats: 0,
      deviceId: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    console.log('✅ User created successfully:', { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      coins: user.coins,
      tier: user.tier,
      isVerified: user.isVerified 
    });

    // 📧 Send OTP email
    console.log('📧 Sending OTP email...');
    const emailSent = await sendOTPEmail({ 
      email, 
      otp, 
      name: username 
    });

    if (!emailSent) {
      console.warn('⚠️  Failed to send OTP email, but user created');
    } else {
      console.log('✅ OTP email sent successfully');
    }

    // ❌ NO TOKEN GENERATION for unverified users!
    // Token will be generated after OTP verification

    // 📧 DON'T send token for unverified users - they need to verify OTP first!
    const responseData = {
      success: true,
      message: 'Registration successful. Please verify your email with the OTP sent.',
      requiresOTP: true, // 📧 Frontend will redirect to OTP page
      email: user.email, // Send email for OTP verification
      username: user.username, // Send username for display
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tier: user.tier,
        status: user.status,
        isVerified: false, // ❌ Not verified yet
        coins: user.coins
      }
      // ❌ NO TOKEN - User must verify OTP first!
    };

    console.log('🎉 REGISTRATION SUCCESSFUL (OTP sent, no token):', { 
      userId: user.id,
      email: user.email,
      username: user.username,
      otpSent: emailSent,
      tokenProvided: false // ❌ No token until OTP verified
    });
    console.log('=== REGISTRATION ATTEMPT END ===\n');

    res.json(responseData);
  } catch (error: any) {
    console.error('❌ CRITICAL REGISTRATION ERROR:', error);
    console.error('Stack trace:', error.stack);
    console.log('=== REGISTRATION ATTEMPT END (ERROR) ===\n');
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

/**
 * Verify OTP
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('\n=== 📧 OTP VERIFICATION START ===');
    console.log('📧 Email:', email);
    console.log('🔢 OTP:', otp);
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Validation
    if (!email || !otp) {
      console.log('❌ FAILED: Missing email or OTP');
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    if (otp.length !== 6) {
      console.log('❌ FAILED: Invalid OTP format');
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format. Must be 6 digits.'
      });
    }

    // Get user by email
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      console.log('❌ FAILED: User not found');
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      console.log('✅ User already verified');
      return res.json({
        success: true,
        message: 'Email already verified',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isVerified: true
        }
      });
    }

    // Check OTP expiry
    if (!user.otpExpiresAt) {
      console.log('❌ FAILED: No OTP expiry set');
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.',
        expired: true
      });
    }

    const now = new Date();
    const expiryDate = new Date(user.otpExpiresAt);
    
    console.log('🕐 OTP Expiry Check:', {
      now: now.toISOString(),
      expiry: expiryDate.toISOString(),
      isExpired: now > expiryDate,
      timeDiff: `${Math.round((expiryDate.getTime() - now.getTime()) / 1000)}s remaining`
    });

    if (now > expiryDate) {
      console.log('❌ FAILED: OTP expired');
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.',
        expired: true
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      console.log('❌ FAILED: Invalid OTP');
      console.log('Expected:', user.otp, 'Got:', otp);
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP. Please try again.'
      });
    }

    // ✅ Mark as verified and generate new token
    await DatabaseService.updateUser(user.id, {
      isVerified: true,
      tier: 'verified', // Upgrade tier
      otp: undefined, // Clear OTP
      otpExpiresAt: undefined // Clear expiry
    });

    // Generate new JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: 'verified' },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // 🔒 Update session with new token
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const deviceInfo = `${userAgent.substring(0, 50)} - ${new Date().toLocaleString()}`;

    await DatabaseService.updateUser(user.id, {
      activeDeviceToken: token,
      lastLoginDevice: deviceInfo
    });

    console.log('🎉 OTP VERIFIED SUCCESSFULLY');
    console.log('=== OTP VERIFICATION END ===\n');

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to Omegoo 🎉',
      token, // 🎟️ Send token for auto-login
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: true,
        tier: 'verified',
        coins: user.coins
      }
    });
  } catch (error: any) {
    console.error('❌ OTP VERIFICATION ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 * Body: { email }
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('\n=== 📧 RESEND OTP START ===');
    console.log('📧 Email:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Get user
    const user = await DatabaseService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user
    await DatabaseService.updateUser(user.id, {
      otp,
      otpExpiresAt
    });

    // Send email
    const emailSent = await sendOTPEmail({
      email: user.email!,
      otp,
      name: user.username
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP email'
      });
    }

    console.log('✅ OTP resent successfully');
    console.log('=== RESEND OTP END ===\n');

    res.json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error: any) {
    console.error('❌ RESEND OTP ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend OTP'
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

    console.log('\n=== 🔐 LOGIN ATTEMPT START ===');
    console.log('📧 Email:', email);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🌐 IP:', req.ip);
    console.log('📱 User Agent:', req.headers['user-agent']);

    // Validation
    if (!email || !password) {
      console.log('❌ FAILED: Missing credentials');
      console.log('=== LOGIN ATTEMPT END ===\n');
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    console.log('🔍 Looking up user in database...');
    const user = await DatabaseService.getUserByEmail(email);
    
    if (!user) {
      console.log('❌ FAILED: User not found for email:', email);
      console.log('=== LOGIN ATTEMPT END ===\n');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', {
      userId: user.id,
      email: user.email,
      username: user.username,
      tier: user.tier,
      status: user.status,
      hasPassword: !!user.passwordHash,
      hasActiveToken: !!user.activeDeviceToken,
      lastLoginDevice: user.lastLoginDevice || 'Never logged in',
      isVerified: user.isVerified
    });

    // Check if user has password (not OAuth user)
    if (!user.passwordHash) {
      console.log('❌ FAILED: OAuth user trying email login:', email);
      console.log('=== LOGIN ATTEMPT END ===\n');
      return res.status(400).json({
        success: false,
        error: 'Please login with Google'
      });
    }

    // Verify password
    console.log('🔑 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      console.log('❌ FAILED: Invalid password for user:', email);
      console.log('=== LOGIN ATTEMPT END ===\n');
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    console.log('✅ Password verified successfully');

    // Check if user is banned
    console.log('🚫 Checking ban status...');
    const banStatus = await DatabaseService.checkUserBanStatus(user.id);
    if (banStatus) {
      console.log('❌ FAILED: User is banned:', {
        userId: user.id,
        reason: banStatus.reason,
        expiresAt: banStatus.expiresAt
      });
      console.log('=== LOGIN ATTEMPT END ===\n');
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
    console.log('✅ User not banned');

    // Check and auto-reset daily coins if needed
    console.log('🪙 Checking daily coin reset...');
    const updatedUser = await checkAndResetDailyCoins(user.id);
    const finalUser = updatedUser || user;
    console.log('✅ Coin check complete. Current coins:', finalUser.coins);

    // Generate JWT token
    console.log('🎟️  Generating JWT token...');
    const token = jwt.sign(
      { userId: finalUser.id, email: finalUser.email, role: finalUser.tier },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );
    console.log('✅ Token generated:', token.substring(0, 20) + '...');

    // 🔒 Save token to enforce single-device session
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const deviceInfo = `${userAgent.substring(0, 50)} - ${new Date().toLocaleString()}`;

    console.log('💾 Saving session to database...');
    console.log('🔒 Previous activeDeviceToken:', finalUser.activeDeviceToken ? finalUser.activeDeviceToken.substring(0, 20) + '...' : 'None');
    console.log('🔒 New activeDeviceToken:', token.substring(0, 20) + '...');
    console.log('📱 Device info:', deviceInfo);

    await DatabaseService.updateUser(finalUser.id, {
      lastActiveAt: new Date(),
      activeDeviceToken: token, // 🔒 This will REPLACE old token - previous sessions will be invalidated
      lastLoginDevice: deviceInfo
    });

    console.log('✅ Session saved successfully');
    console.log('🎉 LOGIN SUCCESSFUL:', { 
      userId: finalUser.id, 
      email: finalUser.email,
      username: finalUser.username,
      coins: finalUser.coins,
      device: deviceInfo.substring(0, 50) 
    });
    console.log('=== LOGIN ATTEMPT END ===\n');

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
    console.error('❌ CRITICAL LOGIN ERROR:', error);
    console.error('Stack trace:', error.stack);
    console.log('=== LOGIN ATTEMPT END (ERROR) ===\n');
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
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Google ID token is required'
      });
    }

    // Decode the Google JWT token (in production, verify with Google's API)
    // For now, we'll decode and trust it (since it comes from Google OAuth library)
    let decoded: any;
    try {
      // Simple JWT decode without verification (library already verified it)
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString('utf-8')
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      decoded = JSON.parse(jsonPayload);
    } catch (decodeError) {
      console.error('❌ Failed to decode Google token:', decodeError);
      return res.status(400).json({
        success: false,
        error: 'Invalid Google token'
      });
    }

    const { email, name, picture, sub: googleId } = decoded;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required from Google account'
      });
    }

    console.log('🔐 Google OAuth attempt:', { email, name, googleId });

    // Extract username from email (part before @)
    const autoUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    // Find or create user
    let user = await DatabaseService.getUserByEmail(email);

    if (!user) {
      // Create new user from Google OAuth
      console.log('🆕 Creating new Google OAuth user:', email);
      
      user = await DatabaseService.createUser({
        email,
        username: autoUsername, // Auto-generated username from email (before @)
        passwordHash: undefined, // No password for OAuth users
        tier: 'verified', // ✅ Google accounts are pre-verified → verified tier
        status: 'active',
        isVerified: true, // ✅ Google accounts are pre-verified
        coins: 50,
        totalChats: 0,
        dailyChats: 0,
        lastCoinClaim: new Date(),
        deviceId: `google-${googleId || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        preferences: {
          avatar: picture,
          authProvider: 'google',
          googleId: googleId
        }
      });
      
      console.log('✅ Google OAuth user created:', { id: user.id, email: user.email, username: user.username });

      // 📧 Send welcome email (no OTP needed for Google users)
      console.log('📧 Sending welcome email to Google user...');
      const emailSent = await sendWelcomeEmail({
        email: user.email!,
        name: user.username
      });

      if (emailSent) {
        console.log('✅ Welcome email sent successfully');
      } else {
        console.warn('⚠️  Failed to send welcome email');
      }
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

      // Update last active & daily coin reset check
      const updatedUser = await checkAndResetDailyCoins(user.id);
      if (updatedUser) {
        user = updatedUser;
      }
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

    // 🔒 Save token for single-device session
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const deviceInfo = `${userAgent.substring(0, 50)} - ${new Date().toLocaleString()}`;

    await DatabaseService.updateUser(user.id, {
      activeDeviceToken: token,
      lastLoginDevice: deviceInfo
    });

    console.log('✅ Google OAuth successful:', { userId: user.id, email: user.email, device: deviceInfo });

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

    // Check and auto-reset daily coins if needed (same as login)
    const updatedUser = await checkAndResetDailyCoins(req.userId);
    const user = updatedUser || await DatabaseService.getUserById(req.userId);

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
      coins: user.coins,
      totalChats: user.totalChats,
      dailyChats: user.dailyChats
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
 * Change Password
 * POST /api/auth/change-password
 */
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validation
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    // Get user
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If user has existing password (not OAuth user), verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password is required'
        });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await DatabaseService.updateUser(userId, {
      passwordHash: newPasswordHash
    });

    console.log('✅ Password changed for user:', userId);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
