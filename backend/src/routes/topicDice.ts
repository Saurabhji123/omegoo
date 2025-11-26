// Topic Dice Routes - Conversation Starters

import express, { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { TopicDiceService } from '../services/topicDice';

const router: Router = express.Router();

/**
 * GET /api/topic-dice
 * Get random conversation starter prompt
 * Supports both authenticated users and guest users (via X-Guest-Id header)
 */
router.get('/topic-dice', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as 'fun' | 'safe' | 'deep' | 'flirty' | undefined;
    const language = (req.query.lang as string) || 'en';
    const maturityRating = (req.query.maturity as 'G' | 'PG' | 'PG-13') || 'PG';

    // Validation
    if (category && !['fun', 'safe', 'deep', 'flirty'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be one of: fun, safe, deep, flirty',
        code: 'INVALID_CATEGORY'
      });
    }

    if (maturityRating && !['G', 'PG', 'PG-13'].includes(maturityRating)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid maturity rating. Must be one of: G, PG, PG-13',
        code: 'INVALID_MATURITY'
      });
    }

    // Support both auth token and guest ID
    const userId = (req as any).userId || (req as any).user?.id || req.headers['x-guest-id'] as string;
    const sessionId = (req as any).sessionId || req.headers['x-guest-id'] as string || 'anonymous';

    // Get random prompt
    const prompt = await TopicDiceService.getRandomPrompt(category, language, maturityRating);

    // Log usage metric
    await TopicDiceService.logUsage(userId, sessionId, prompt.category, prompt.id);

    return res.status(200).json({
      success: true,
      data: {
        id: prompt.id,
        prompt: prompt.prompt,
        category: prompt.category,
        maturityRating: prompt.maturityRating
      }
    });

  } catch (error: any) {
    console.error('❌ Topic dice error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get conversation starter',
      code: 'TOPIC_DICE_ERROR'
    });
  }
});

/**
 * GET /api/topic-dice/categories
 * Get all categories with counts
 * Supports both authenticated users and guest users
 */
router.get('/topic-dice/categories', async (req: Request, res: Response) => {
  try {
    const categories = await TopicDiceService.getCategories();

    return res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error: any) {
    console.error('❌ Get categories error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get categories',
      code: 'CATEGORIES_ERROR'
    });
  }
});

export default router;
