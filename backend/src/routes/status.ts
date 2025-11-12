import { Router } from 'express';
import { StatusService, ActiveIncident } from '../services/status';

const router: Router = Router();

router.get('/summary', async (_req, res) => {
  try {
    const summary = await StatusService.getSummary();
    return res.json({ success: true, summary });
  } catch (error) {
    console.error('❌ Status summary error:', error);
    return res.status(500).json({ success: false, error: 'Unable to load platform status' });
  }
});

router.get('/incident', async (_req, res) => {
  try {
    const incident = await StatusService.getActiveIncident();
    return res.json({ success: true, incident });
  } catch (error) {
    console.error('❌ Status incident error:', error);
    return res.status(500).json({ success: false, error: 'Unable to fetch incident information' });
  }
});

router.post('/incident', async (req, res) => {
  try {
    const apiToken = String(process.env.STATUS_API_TOKEN || '');
    if (!apiToken) {
      return res.status(503).json({ success: false, error: 'Status API token not configured' });
    }

    const providedToken = String(req.headers['x-status-token'] || '');
    if (!providedToken || providedToken !== apiToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const payload = req.body?.incident ?? null;

    if (payload && (!payload.message || typeof payload.message !== 'string')) {
      return res.status(400).json({ success: false, error: 'Incident message required' });
    }

    await StatusService.setActiveIncident(payload as ActiveIncident | null);
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Status incident update error:', error);
    return res.status(500).json({ success: false, error: 'Unable to update incident state' });
  }
});

export default router;
