import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { DatabaseService } from '../services/serviceFactory';
import { authenticateAdmin, requirePermission } from '../middleware/adminAuth';

const router: Router = Router();

/* ---------- Public Routes (No Auth Required) ---------- */

/**
 * Admin Login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }

    // Find admin by username
    const admin = await DatabaseService.findAdminByUsername(username);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const jwtSecret = (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'fallback-secret');
    const jwtExpire = (process.env.ADMIN_JWT_EXPIRE || '12h');
    
    // @ts-expect-error - JWT typing issue with environment variables
    const token: string = jwt.sign(
      {
        adminId: String(admin.id),
        username: String(admin.username),
        role: String(admin.role),
        permissions: admin.permissions
      },
      jwtSecret,
      { expiresIn: jwtExpire }
    );

    // Update last login
    await DatabaseService.updateAdminLastLogin(admin.id);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

/**
 * Create first admin (only if no admins exist)
 */
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password required'
      });
    }

    // Check if any admin exists
    const existingAdmins = await DatabaseService.getAllAdmins();
    
    if (existingAdmins.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'Admin setup already completed'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create super admin
    const admin = await DatabaseService.createAdmin({
      username,
      email,
      passwordHash,
      role: 'super_admin'
    });

    if (!admin) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create admin'
      });
    }

    res.json({
      success: true,
      message: 'Super admin created successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error: any) {
    console.error('Admin setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Setup failed'
    });
  }
});

/* ---------- Protected Routes (Admin Auth Required) ---------- */

/**
 * Get platform statistics
 */
router.get('/stats', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await DatabaseService.getPlatformStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stats'
    });
  }
});

/**
 * Get all pending reports
 */
router.get('/reports', authenticateAdmin, requirePermission('view_reports'), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const reports = await DatabaseService.getPendingReports(limit);
    
    res.json({
      success: true,
      reports,
      total: reports.length
    });
  } catch (error: any) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports'
    });
  }
});

/**
 * Get reports for specific user
 */
router.get('/reports/:userId', authenticateAdmin, requirePermission('view_reports'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const reports = await DatabaseService.getUserReports(userId);
    
    res.json({
      success: true,
      reports,
      total: reports.length
    });
  } catch (error: any) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user reports'
    });
  }
});

/**
 * Update report status
 */
router.patch('/reports/:reportId', authenticateAdmin, requirePermission('resolve_reports'), async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const updated = await DatabaseService.updateReportStatus(reportId, status);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report status updated'
    });
  } catch (error: any) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update report'
    });
  }
});

/**
 * Get all banned users
 */
router.get('/bans', authenticateAdmin, requirePermission('view_users'), async (req: Request, res: Response) => {
  try {
    const bannedUsers = await DatabaseService.getUsersByStatus('banned');
    
    // Get ban details for each user
    const usersWithBanInfo = await Promise.all(
      bannedUsers.map(async (user: any) => {
        const banStatus = await DatabaseService.checkUserBanStatus(user.id);
        return {
          ...user,
          banInfo: banStatus
        };
      })
    );

    res.json({
      success: true,
      users: usersWithBanInfo,
      total: usersWithBanInfo.length
    });
  } catch (error: any) {
    console.error('Get bans error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch banned users'
    });
  }
});

/**
 * Ban a user (manual admin action)
 */
router.post('/ban', authenticateAdmin, requirePermission('ban_users'), async (req: Request, res: Response) => {
  try {
    const { userId, banType, duration, reason } = req.body;
    const adminId = req.admin?.adminId;

    if (!userId || !banType) {
      return res.status(400).json({
        success: false,
        error: 'userId and banType required'
      });
    }

    if (!['temporary', 'permanent'].includes(banType)) {
      return res.status(400).json({
        success: false,
        error: 'banType must be "temporary" or "permanent"'
      });
    }

    if (banType === 'temporary' && !duration) {
      return res.status(400).json({
        success: false,
        error: 'duration required for temporary ban'
      });
    }

    const ban = await DatabaseService.banUser(
      userId,
      banType,
      duration,
      reason || 'Manual ban by admin',
      adminId
    );

    if (!ban) {
      return res.status(500).json({
        success: false,
        error: 'Failed to ban user'
      });
    }

    res.json({
      success: true,
      message: 'User banned successfully',
      ban
    });
  } catch (error: any) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to ban user'
    });
  }
});

/**
 * Unban a user
 */
router.post('/unban', authenticateAdmin, requirePermission('ban_users'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const adminId = req.admin?.adminId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId required'
      });
    }

    const success = await DatabaseService.unbanUser(userId, adminId);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to unban user'
      });
    }

    res.json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error: any) {
    console.error('Unban user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unban user'
    });
  }
});

/**
 * Get user ban history
 */
router.get('/bans/:userId', authenticateAdmin, requirePermission('view_users'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const banHistory = await DatabaseService.getUserBanHistory(userId);
    
    res.json({
      success: true,
      banHistory,
      total: banHistory.length
    });
  } catch (error: any) {
    console.error('Get ban history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch ban history'
    });
  }
});

/**
 * Get all users with pagination
 */
router.get('/users', authenticateAdmin, requirePermission('view_users'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    // This would need pagination support in DatabaseService
    const allUsers = status 
      ? await DatabaseService.getUsersByStatus(status)
      : []; // Implement getAllUsers() in DatabaseService if needed

    res.json({
      success: true,
      users: allUsers.slice((page - 1) * limit, page * limit),
      total: allUsers.length,
      page,
      limit
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch users'
    });
  }
});

/**
 * Get analytics/dashboard data
 */
router.get('/analytics', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await DatabaseService.getPlatformStats();
    
    // Additional analytics can be added here
    const analytics = {
      ...stats,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics'
    });
  }
});

/**
 * Get all admins (super admin only)
 */
router.get('/admins', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    // Only super admin can view all admins
    if (req.admin?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super admin access required'
      });
    }

    const admins = await DatabaseService.getAllAdmins();
    
    // Remove password hashes
    const safeAdmins = admins.map((admin: any) => {
      const { passwordHash, ...safeAdmin } = admin;
      return safeAdmin;
    });

    res.json({
      success: true,
      admins: safeAdmins
    });
  } catch (error: any) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch admins'
    });
  }
});

export default router;