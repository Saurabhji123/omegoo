import { Router, Request, Response } from 'express';

const router: Router = Router();

router.post('/coins', (req, res) => {
  res.json({ success: true, orderId: 'test-order-123' });
});

router.post('/subscription', (req, res) => {
  res.json({ success: true, subscriptionId: 'test-sub-123' });
});

router.post('/verify', (req, res) => {
  res.json({ success: true, coins: 100 });
});

export default router;