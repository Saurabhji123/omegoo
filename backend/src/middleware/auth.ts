import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/database';

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

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await DatabaseService.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        error: 'Account is banned',
        code: 'USER_BANNED'
      });
    }

    // 🔒 SINGLE-DEVICE SESSION CHECK
    // If user has activeDeviceToken and it doesn't match current token, they're logged in elsewhere
    if (user.activeDeviceToken && user.activeDeviceToken !== token) {
      return res.status(401).json({
        success: false,
        error: 'You have been logged in from another device',
        code: 'SESSION_REPLACED'
      });
    }

    req.user = {
      id: user.id,
      deviceId: user.device_id,
      tier: user.tier,
      status: user.status
    };

    next();
  } catch (error) {
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
    const user = await DatabaseService.getUserById(req.user!.id);
    
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