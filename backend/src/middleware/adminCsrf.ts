import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/serviceFactory';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const adminCsrfProtection = async (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  try {
    const rawHeader = req.headers['x-admin-csrf'] || req.headers['x-csrf-token'];
    const csrfToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!req.adminSession || !req.adminSessionId) {
      return res.status(401).json({
        success: false,
        error: 'Admin session missing for CSRF validation'
      });
    }

    if (!csrfToken || typeof csrfToken !== 'string') {
      return res.status(403).json({
        success: false,
        error: 'Admin CSRF token missing'
      });
    }

    if (csrfToken !== req.adminSession.csrfToken) {
      return res.status(403).json({
        success: false,
        error: 'Admin CSRF token invalid'
      });
    }

    const ttlMs = req.adminSession.expiresAt - Date.now();
    if (ttlMs > 0 && typeof RedisService.refreshAdminSession === 'function') {
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      if (ttlSeconds > 0) {
        await RedisService.refreshAdminSession(req.adminSessionId, ttlSeconds);
      }
    }

    return next();
  } catch (error) {
    console.error('Admin CSRF validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Admin CSRF validation failed'
    });
  }
};
