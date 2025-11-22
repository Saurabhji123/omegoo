/**
 * Guest API Routes
 * Endpoints for shadow login guest management:
 * - POST /api/guest/verify - Verify/create guest record
 * - POST /api/guest/reset - Reset guest identity
 * - DELETE /api/guest/delete-data/:guestId - Delete guest data (GDPR)
 * - GET /api/guest/stats - Get guest statistics (admin)
 */

import express, { Request, Response, Router } from 'express';
import { guestAuth, requireGuest, guestRateLimit } from '../middleware/guestAuth';
import { authenticateAdmin } from '../middleware/adminAuth';
import { getDatabase } from '../services/serviceFactory';

const router: Router = express.Router();

/**
 * POST /api/guest/verify
 * Verify guest ID with server, create/update guest record
 * Body: { guestId, deviceMeta }
 */
router.post('/verify', guestRateLimit(50, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    const { guestId, deviceMeta } = req.body;

    if (!guestId) {
      return res.status(400).json({
        success: false,
        error: 'guestId is required'
      });
    }

    // Validate guest ID format (SHA-256 = 64 hex chars)
    if (!/^[a-f0-9]{64}$/i.test(guestId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid guest ID format'
      });
    }

    const db = getDatabase();

    // Check if guest exists
    let guest = await db.getGuestById(guestId);
    let isNew = false;

    if (!guest) {
      // Create new guest
      guest = await db.createGuest({
        guestId,
        deviceMeta: deviceMeta || {
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
        }
      });
      isNew = true;
      console.log(`✅ New guest verified: ${guestId.substring(0, 12)}...`);
    } else {
      // Update last seen
      await db.updateGuestLastSeen(guestId);
      console.log(`✅ Existing guest verified: ${guestId.substring(0, 12)}...`);
    }

    res.json({
      success: true,
      guest: {
        guestId: guest.guestId,
        sessions: guest.sessions,
        lastSeen: guest.lastSeen,
        createdAt: guest.createdAt
      },
      isNew,
      message: isNew ? 'Guest created successfully' : 'Guest verified successfully'
    });
  } catch (error) {
    console.error('[Guest] Verify error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify guest'
    });
  }
});

/**
 * POST /api/guest/reset
 * Reset guest identity (called when user requests new ID)
 * Body: { oldGuestId }
 * Note: Frontend generates new ID, this just marks old one as reset
 */
router.post('/reset', guestRateLimit(10, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    const { oldGuestId } = req.body;

    if (!oldGuestId) {
      return res.status(400).json({
        success: false,
        error: 'oldGuestId is required'
      });
    }

    const db = getDatabase();

    // Optionally mark old guest as deleted or add note
    const guest = await db.getGuestById(oldGuestId);
    if (guest) {
      await db.deleteGuest(oldGuestId);
      console.log(`🔄 Guest reset: ${oldGuestId.substring(0, 12)}...`);
    }

    res.json({
      success: true,
      message: 'Guest identity reset successfully'
    });
  } catch (error) {
    console.error('[Guest] Reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset guest identity'
    });
  }
});

/**
 * DELETE /api/guest/delete-data/:guestId
 * Delete all guest data (GDPR compliance)
 * Soft deletes guest record
 */
router.delete('/delete-data/:guestId', guestRateLimit(5, 15 * 60 * 1000), async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    if (!guestId) {
      return res.status(400).json({
        success: false,
        error: 'guestId is required'
      });
    }

    // Validate format
    if (!/^[a-f0-9]{64}$/i.test(guestId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid guest ID format'
      });
    }

    const db = getDatabase();
    const deleted = await db.deleteGuest(guestId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Guest not found'
      });
    }

    console.log(`🗑️ Guest data deleted (GDPR): ${guestId.substring(0, 12)}...`);

    res.json({
      success: true,
      message: 'Guest data deleted successfully'
    });
  } catch (error) {
    console.error('[Guest] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete guest data'
    });
  }
});

/**
 * GET /api/guest/stats
 * Get guest statistics (admin only)
 * Returns: totalGuests, activeToday, uniqueDevices
 */
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const stats = await db.getGuestStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[Guest] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch guest statistics'
    });
  }
});

export default router;
