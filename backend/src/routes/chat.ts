import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/history', (req, res) => {
  res.json({ success: true, data: [] });
});

router.post('/report', (req, res) => {
  res.json({ success: true, message: 'Report submitted' });
});

export default router;