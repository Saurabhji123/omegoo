import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/serviceFactory';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  permissions: string[];
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

/**
 * Middleware to verify admin JWT token
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No admin token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'fallback-secret';

    // Verify token
    const decoded = jwt.verify(token, adminSecret) as AdminTokenPayload;

    // Verify admin still exists and is active
    const admin = await DatabaseService.findAdminByUsername(decoded.username);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Admin account not found or inactive'
      });
    }

    // Attach admin info to request
    req.admin = {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions
    };

    next();
  } catch (error: any) {
    console.error('Admin authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Admin token expired'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check admin permissions
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    const { permissions, role } = req.admin;

    // Super admin has all permissions
    if (role === 'super_admin' || permissions.includes('all')) {
      return next();
    }

    // Check specific permission
    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Permission denied: ${permission} required`
      });
    }

    next();
  };
};
