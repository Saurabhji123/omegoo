import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/profile', (req, res) => {
  res.json({ success: true, message: 'User profile endpoint' });
});

router.put('/profile', (req, res) => {
  res.json({ success: true, message: 'Profile updated' });
});

router.get('/coins', (req, res) => {
  res.json({ success: true, coins: 0 });
});

export default router;