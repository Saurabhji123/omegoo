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
    console.log('🔐 Admin login attempt received');
    console.log('📝 Request body:', { username: req.body.username, hasPassword: !!req.body.password });
    
    const { username, password } = req.body;

    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }

    console.log('🔍 Searching for admin:', username);
    
    // Find admin by username OR email
    let admin = await DatabaseService.findAdminByUsername(username);
    
    // If not found by username, try email
    if (!admin) {
      console.log('❌ Not found by username, trying email...');
      admin = await DatabaseService.findAdminByEmail(username);
    }

    if (!admin || !admin.isActive) {
      console.log('❌ Admin not found or inactive:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    console.log('✅ Admin found:', admin.email, 'Role:', admin.role, 'isOwner:', admin.isOwner);

    // Verify password
    console.log('🔒 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      console.log('❌ Password verification failed!');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    console.log('✅ Password verified successfully!');

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
        isOwner: admin.isOwner || false,
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
    const limit = parseInt(req.query.limit as string) || 100;
    const status = req.query.status as string;
    
    console.log('📊 Fetching reports:', { limit, status });
    
    // Fetch all reports (not just pending) for admin dashboard
    const reports = status === 'pending' 
      ? await DatabaseService.getPendingReports(limit)
      : await DatabaseService.getAllReports(limit);
    
    console.log(`✅ Found ${reports.length} reports`);
    
    // Enrich reports with user emails
    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        try {
          const reportedUser = await DatabaseService.getUserById(report.reportedUserId);
          const reporterUser = await DatabaseService.getUserById(report.reporterUserId);
          
          return {
            ...report,
            reportedUserEmail: reportedUser?.email || 'Unknown',
            reporterUserEmail: reporterUser?.email || 'Unknown'
          };
        } catch (err) {
          console.error('Error enriching report:', err);
          return {
            ...report,
            reportedUserEmail: 'Error loading',
            reporterUserEmail: 'Error loading'
          };
        }
      })
    );
    
    res.json({
      success: true,
      reports: enrichedReports,
      total: enrichedReports.length
    });
  } catch (error: any) {
    console.error('❌ Get reports error:', error);
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

    console.log('📝 Update report request:', { reportId, status, admin: req.body.adminId });

    if (!status) {
      console.log('❌ Missing status in request body');
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      console.log('❌ Invalid status value:', status);
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, reviewed, or resolved'
      });
    }

    console.log('🔄 Updating report status...');
    const updated = await DatabaseService.updateReportStatus(reportId, status);
    
    if (!updated) {
      console.log('❌ Report not found:', reportId);
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    console.log('✅ Report status updated successfully:', { reportId, newStatus: status });

    res.json({
      success: true,
      message: 'Report status updated',
      report: updated
    });
  } catch (error: any) {
    console.error('❌ Update report error:', error);
    console.error('Stack trace:', error.stack);
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
    const search = req.query.search as string;
    
    let users;
    if (search) {
      users = await DatabaseService.searchUsers(search);
    } else {
      users = await DatabaseService.getAllUsers();
    }

    res.json({
      success: true,
      users,
      total: users.length
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
 * Update user role
 */
router.put('/users/:userId/role', authenticateAdmin, requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['guest', 'user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    // Check super_admin limit
    if (role === 'super_admin') {
      const allUsers = await DatabaseService.getAllUsers();
      const superAdminCount = allUsers.filter((u: any) => u.tier === 'super_admin').length;
      
      if (superAdminCount >= 2) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 2 super_admins allowed'
        });
      }
    }

    const success = await DatabaseService.updateUserRole(userId, role);

    if (success) {
      res.json({
        success: true,
        message: 'User role updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error: any) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user role'
    });
  }
});

/**
 * Delete user
 */
router.delete('/users/:userId', authenticateAdmin, requirePermission('manage_users'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const success = await DatabaseService.deleteUser(userId);

    if (success) {
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user'
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