import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/serviceFactory';

const router: Router = Router();

// Video frame moderation (AI placeholder)
router.post('/frame', (req, res) => {
  res.json({ success: true, flagged: false, confidence: 0 });
});

// Create a report (new endpoint with auto-ban logic)
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { sessionId, reportedUserId, reporterUserId, violationType, description, chatMode } = req.body;

    if (!reportedUserId || !reporterUserId || !violationType || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create report in database
    const report = await DatabaseService.createModerationReport({
      sessionId: sessionId || 'unknown',
      reportedUserId,
      reporterUserId,
      violationType,
      description,
      evidenceUrls: [],
      autoDetected: false,
      confidenceScore: 0
    });

    // Increment user's report count (this also triggers auto-ban if needed)
    const newReportCount = await DatabaseService.incrementUserReportCount(reportedUserId);
    
    console.log(`📊 User ${reportedUserId} now has ${newReportCount} reports`);

    res.json({
      success: true,
      message: 'Report submitted successfully',
      report,
      reportCount: newReportCount
    });
  } catch (error: any) {
    console.error('Report creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create report'
    });
  }
});

// Submit a report
router.post('/report', async (req: Request, res: Response) => {
  try {
    const { sessionId, reportedUserId, violationType, description, evidenceUrls } = req.body;
    const reporterUserId = (req as any).user?.id || 'anonymous';

    if (!reportedUserId || !violationType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: reportedUserId, violationType'
      });
    }

    // Create report
    const report = await DatabaseService.createModerationReport({
      sessionId: sessionId || 'unknown',
      reportedUserId,
      reporterUserId,
      violationType,
      description: description || '',
      evidenceUrls: evidenceUrls || [],
      autoDetected: false,
      confidenceScore: 0
    });

    // Check total report count for user
    const reportCount = await DatabaseService.getUserReportCount(reportedUserId);
    
    console.log(`📊 User ${reportedUserId} now has ${reportCount} reports`);

    // Auto-ban logic: 3, 6, 9 reports trigger bans
    if (reportCount >= 3 && (reportCount === 3 || reportCount === 6 || reportCount >= 9)) {
      const banResult = await DatabaseService.autoBanUserByReports(
        reportedUserId,
        reportCount,
        `Auto-banned after ${reportCount} reports`
      );

      if (banResult) {
        console.log(`🚫 User ${reportedUserId} auto-banned: ${banResult.banType}`);
        return res.json({
          success: true,
          report,
          banned: true,
          banInfo: {
            type: banResult.banType,
            duration: banResult.banDuration,
            expiresAt: banResult.expiresAt
          }
        });
      }
    }

    res.json({
      success: true,
      report,
      banned: false,
      reportCount
    });
  } catch (error: any) {
    console.error('Report submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit report'
    });
  }
});

// Get user's report history
router.get('/reports/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const reports = await DatabaseService.getUserReports(userId);
    
    res.json({
      success: true,
      reports,
      count: reports.length
    });
  } catch (error: any) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports'
    });
  }
});

export default router;