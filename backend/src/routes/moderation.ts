import { Router, Request, Response } from 'express';

const router: Router = Router();

router.post('/frame', (req, res) => {
  res.json({ success: true, flagged: false, confidence: 0 });
});

export default router;