import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/serviceFactory';

const router: Router = Router();

// Auth middleware
interface AuthRequest extends Request {
  userId?: string;
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

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Update User Preferences
 * PUT /api/user/preferences
 */
router.put('/preferences', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { settings, videoQuality, matchingMode, interests, ageRange, genderPreference } = req.body;

    // Get current user
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Merge with existing preferences
    const updatedPreferences = {
      ...user.preferences,
      settings: settings || user.preferences.settings,
      videoQuality: videoQuality || user.preferences.videoQuality,
      matchingMode: matchingMode || user.preferences.matchingMode,
      interests: interests || user.preferences.interests || [],
      ageRange: ageRange || user.preferences.ageRange,
      genderPreference: genderPreference || user.preferences.genderPreference || 'any',
    };

    // Update user preferences
    await DatabaseService.updateUser(userId, {
      preferences: updatedPreferences
    });

    console.log('✅ User preferences updated:', userId);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('❌ Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * Get User Profile
 * GET /api/user/profile
 */
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        tier: user.tier,
        coins: user.coins,
        preferences: user.preferences,
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * Update User Profile
 * PUT /api/user/profile
 */
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { username, email } = req.body;

    await DatabaseService.updateUser(userId, {
      ...(username && { username }),
      ...(email && { email }),
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * Get User Coins
 * GET /api/user/coins
 */
router.get('/coins', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      coins: user.coins
    });
  } catch (error) {
    console.error('❌ Get coins error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coins'
    });
  }
});

/**
 * Delete Account
 * DELETE /api/user/account
 */
router.delete('/account', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const result = await DatabaseService.archiveAndDeleteUser(userId, {
      reason: 'user_request',
      deletedBy: userId
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to delete account'
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

export default router;