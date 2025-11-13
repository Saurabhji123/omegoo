import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics';

const router: Router = Router();

router.post('/event', async (req: Request, res: Response) => {
  try {
    const { type, segments } = req.body || {};
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ success: false, error: 'Event type is required' });
    }

    await AnalyticsService.trackEvent({
      type,
      origin: typeof req.headers.origin === 'string' ? req.headers.origin : undefined,
      segments: typeof segments === 'object' && segments !== null ? {
        gender: typeof segments.gender === 'string' ? segments.gender : undefined,
        platform: typeof segments.platform === 'string' ? segments.platform : undefined,
        signupSource: typeof segments.signupSource === 'string' ? segments.signupSource : undefined,
        campaignId: typeof segments.campaignId === 'string' ? segments.campaignId : undefined
      } : undefined
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Analytics track error:', error);
    return res.status(500).json({ success: false, error: 'Unable to record analytics event' });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const apiToken = process.env.ANALYTICS_API_TOKEN;
    if (apiToken) {
      const provided = String(req.headers['x-analytics-token'] || '');
      if (!provided || provided !== apiToken) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }

    const days = Number(req.query.days ?? '7');
    const summary = await AnalyticsService.getSummary(Number.isFinite(days) && days > 0 ? days : 7);
    return res.json({ success: true, summary });
  } catch (error) {
    console.error('❌ Analytics summary error:', error);
    return res.status(500).json({ success: false, error: 'Unable to load analytics summary' });
  }
});

export default router;
