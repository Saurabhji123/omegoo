import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService as SelectedDatabaseService } from '../services/serviceFactory';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    deviceId: string;
    tier: string;
    status: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔑 Auth middleware - token check:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenLength: token?.length,
      endpoint: req.path
    });

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('✅ Token decoded:', { userId: decoded.userId, email: decoded.email });
    
    // Get user from database
  const user = await SelectedDatabaseService.getUserById(decoded.userId);
    
    if (!user) {
      console.log('❌ User not found:', decoded.userId);
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    console.log('✅ User found:', { userId: user.id, status: user.status, hasActiveToken: !!user.activeDeviceToken });

    if (user.status === 'banned') {
      console.log('⛔ User is banned:', user.id);
      return res.status(403).json({
        success: false,
        error: 'Account is banned',
        code: 'USER_BANNED'
      });
    }

    // 🔒 SINGLE-DEVICE SESSION CHECK
    // If user has activeDeviceToken and it doesn't match current token, they're logged in elsewhere
    if (user.activeDeviceToken && user.activeDeviceToken !== token) {
      console.log('⚠️  Session mismatch!');
      console.log('Expected:', user.activeDeviceToken?.substring(0, 20));
      console.log('Received:', token?.substring(0, 20));
      return res.status(401).json({
        success: false,
        error: 'You have been logged in from another device',
        code: 'SESSION_REPLACED'
      });
    }

    req.user = {
      id: user.id,
      deviceId: (user as any).deviceId || (user as any).device_id || '',
      tier: user.tier,
      status: user.status
    };

    console.log('✅ Auth middleware passed for user:', user.id);
    next();
  } catch (error: any) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

export const requireVerification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.tier === 'guest') {
    return res.status(403).json({
      success: false,
      error: 'Verification required',
      code: 'VERIFICATION_REQUIRED'
    });
  }
  
  next();
};

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
  const user = await SelectedDatabaseService.getUserById(req.user!.id);
    
    if (!user?.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};