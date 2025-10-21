import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/serviceFactory';

const router: Router = Router();

/**
 * Create a report (public endpoint - no auth required)
 */
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
    
    console.log(`📊 User ${reportedUserId} reported. Total reports: ${newReportCount}`);

    res.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it.',
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

export default router;
