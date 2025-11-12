import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService, RedisService } from '../services/serviceFactory';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  permissions: string[];
}

interface AdminSessionData {
  adminId: string;
  csrfToken: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
}

const ADMIN_SESSION_HEADER = 'x-admin-session';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
      adminSession?: AdminSessionData;
      adminSessionId?: string;
    }
  }
}

/**
 * Middleware to verify admin JWT token and active admin session
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const rawSessionHeader = req.headers[ADMIN_SESSION_HEADER];
    const sessionId = Array.isArray(rawSessionHeader) ? rawSessionHeader[0] : rawSessionHeader;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No admin token provided'
      });
    }

    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Admin session missing'
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

    const normalizedAdminId = String((admin as any).id || (admin as any)._id || '').trim();
    if (!normalizedAdminId) {
      return res.status(401).json({
        success: false,
        error: 'Admin record missing identifier'
      });
    }

    const sessionRecord = typeof RedisService.getAdminSession === 'function'
      ? await RedisService.getAdminSession(sessionId)
      : null;

    if (!sessionRecord) {
      return res.status(401).json({
        success: false,
        error: 'Admin session invalid or expired'
      });
    }

    if (sessionRecord.expiresAt && sessionRecord.expiresAt <= Date.now()) {
      if (typeof RedisService.deleteAdminSession === 'function') {
        await RedisService.deleteAdminSession(sessionId);
      }
      return res.status(401).json({
        success: false,
        error: 'Admin session expired'
      });
    }

    if (sessionRecord.adminId !== normalizedAdminId) {
      return res.status(403).json({
        success: false,
        error: 'Admin session does not match account'
      });
    }

    // Attach admin info to request
    req.admin = {
      adminId: normalizedAdminId,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions
    };
    req.adminSession = sessionRecord;
    req.adminSessionId = sessionId;

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
