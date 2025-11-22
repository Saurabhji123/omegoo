/**
 * Guest Authentication Middleware
 * Extracts X-Guest-Id header, validates format, creates/updates guest records
 * Attaches guest data to req.guest for downstream handlers
 */

import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../services/serviceFactory';

// Extend Express Request to include guest
declare global {
  namespace Express {
    interface Request {
      guest?: {
        guestId: string;
        deviceMeta?: any;
        sessions?: number;
        lastSeen?: Date;
        createdAt?: Date;
        isNew?: boolean;
      };
    }
  }
}

/**
 * Validates guest ID format (SHA-256 = 64 hex characters)
 */
function isValidGuestId(guestId: string): boolean {
  return /^[a-f0-9]{64}$/i.test(guestId);
}

/**
 * Guest authentication middleware
 * Extracts X-Guest-Id from headers, validates, and creates/updates guest record
 * Non-blocking: continues even if guest lookup fails
 */
export async function guestAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const guestId = req.headers['x-guest-id'] as string | undefined;

    // No guest ID provided - continue without guest context
    if (!guestId) {
      return next();
    }

    // Validate format
    if (!isValidGuestId(guestId)) {
      console.warn(`[GuestAuth] Invalid guest ID format: ${guestId.substring(0, 12)}...`);
      return next(); // Continue without guest context
    }

    const db = getDatabase();

    // Try to find existing guest
    let guest = await db.getGuestById(guestId);

    if (guest) {
      // Existing guest - update last seen
      await db.updateGuestLastSeen(guestId);
      req.guest = {
        guestId: guest.guestId,
        deviceMeta: guest.deviceMeta,
        sessions: guest.sessions,
        lastSeen: new Date(),
        createdAt: guest.createdAt,
        isNew: false
      };
    } else {
      // New guest - create record
      // Note: deviceMeta should come from request body or be minimal here
      const deviceMeta = req.body?.deviceMeta || {
        version: '1.0',
        timestamp: Date.now(),
        userAgent: req.headers['user-agent'] || 'unknown',
        language: 'en',
        timezone: 'UTC',
        screenResolution: '1920x1080',
        colorDepth: 24,
        platform: 'unknown',
        doNotTrack: false,
        fingerprintMethod: 'unknown'
      };

      guest = await db.createGuest({ guestId, deviceMeta });
      req.guest = {
        guestId: guest.guestId,
        deviceMeta: guest.deviceMeta,
        sessions: 1,
        lastSeen: new Date(),
        createdAt: guest.createdAt,
        isNew: true
      };

      console.log(`[GuestAuth] New guest created: ${guestId.substring(0, 12)}...`);
    }

    next();
  } catch (error) {
    // Log error but don't block request
    console.error('[GuestAuth] Error processing guest:', error);
    next();
  }
}

/**
 * Optional middleware to require guest ID
 * Returns 401 if no valid guest ID found
 */
export function requireGuest(req: Request, res: Response, next: NextFunction): void {
  if (!req.guest || !req.guest.guestId) {
    res.status(401).json({
      success: false,
      error: 'Guest ID required',
      code: 'GUEST_ID_REQUIRED'
    });
    return;
  }
  next();
}

/**
 * Guest rate limiting map
 * guestId -> { count: number, resetAt: number }
 */
const guestRateLimits = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [guestId, data] of guestRateLimits.entries()) {
    if (data.resetAt < now) {
      guestRateLimits.delete(guestId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter for guest requests
 * Default: 100 requests per 15 minutes
 */
export function guestRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.guest || !req.guest.guestId) {
      // No guest ID - skip rate limiting
      return next();
    }

    const guestId = req.guest.guestId;
    const now = Date.now();

    let rateData = guestRateLimits.get(guestId);

    if (!rateData || rateData.resetAt < now) {
      // New window
      rateData = {
        count: 1,
        resetAt: now + windowMs
      };
      guestRateLimits.set(guestId, rateData);
      return next();
    }

    rateData.count++;

    if (rateData.count > maxRequests) {
      const retryAfter = Math.ceil((rateData.resetAt - now) / 1000);
      res.status(429).json({
        success: false,
        error: 'Too many requests from this guest',
        code: 'GUEST_RATE_LIMIT',
        retryAfter
      });
      return;
    }

    guestRateLimits.set(guestId, rateData);
    next();
  };
}

/**
 * Middleware to log guest activity for analytics
 */
export function logGuestActivity(req: Request, res: Response, next: NextFunction): void {
  if (req.guest && req.guest.guestId) {
    console.log(`[GuestActivity] ${req.method} ${req.path} - Guest: ${req.guest.guestId.substring(0, 12)}... - New: ${req.guest.isNew}`);
  }
  next();
}
