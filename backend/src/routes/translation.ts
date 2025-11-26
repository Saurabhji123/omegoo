// Translation Routes - Auto-Translation Feature

import express, { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { TranslationService } from '../services/translation';
import { TranslationRequest } from '../types/translation';

const router: Router = express.Router();

/**
 * POST /api/translate
 * Translate text to target language
 */
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLang, sourceLang } = req.body as TranslationRequest;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be a string',
        code: 'INVALID_TEXT'
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long. Maximum 5000 characters',
        code: 'TEXT_TOO_LONG'
      });
    }

    if (!targetLang || typeof targetLang !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Target language is required',
        code: 'INVALID_TARGET_LANG'
      });
    }

    if (targetLang.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Target language must be 2-letter code (e.g., en, es, fr)',
        code: 'INVALID_LANG_CODE'
      });
    }

    // Get user ID from authenticated request or guest header
    const userId = (req as any).userId || (req as any).user?.id || (req.headers['x-guest-id'] as string || null);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Access token or X-Guest-Id header required',
        code: 'UNAUTHORIZED'
      });
    }

    // Check remaining quota
    const remainingQuota = await TranslationService.getRemainingQuota(userId);
    if (remainingQuota <= 0) {
      return res.status(429).json({
        success: false,
        error: 'Translation quota exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 3600 // 1 hour
      });
    }

    // Translate text
    const result = await TranslationService.translateText(
      { text, targetLang, sourceLang: sourceLang || 'auto' },
      userId
    );

    // Get updated quota
    const updatedQuota = await TranslationService.getRemainingQuota(userId);

    return res.status(200).json({
      success: true,
      data: {
        translatedText: result.translatedText,
        sourceLang: result.sourceLang,
        targetLang: result.targetLang,
        confidence: result.confidence,
        cached: result.cached
      },
      meta: {
        remainingQuota: updatedQuota,
        quotaResetIn: 3600 // seconds
      }
    });

  } catch (error: any) {
    console.error('❌ Translation error:', error);

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: error.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 3600
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Translation failed',
      code: 'TRANSLATION_ERROR'
    });
  }
});

/**
 * POST /api/translate/detect
 * Detect language of text
 */
router.post('/translate/detect', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required',
        code: 'INVALID_TEXT'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long for detection. Maximum 1000 characters',
        code: 'TEXT_TOO_LONG'
      });
    }

    const result = await TranslationService.detectLanguage(text);

    return res.status(200).json({
      success: true,
      data: {
        language: result.language,
        confidence: result.confidence
      }
    });

  } catch (error: any) {
    console.error('❌ Language detection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Language detection failed',
      code: 'DETECTION_ERROR'
    });
  }
});

/**
 * GET /api/translate/languages
 * Get supported languages
 */
router.get('/translate/languages', async (req: Request, res: Response) => {
  try {
    const languages = await TranslationService.getSupportedLanguages();

    return res.status(200).json({
      success: true,
      data: {
        languages
      }
    });

  } catch (error: any) {
    console.error('❌ Get languages error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get supported languages',
      code: 'LANGUAGES_ERROR'
    });
  }
});

/**
 * DELETE /api/translate/cache
 * Clear user's translation cache
 */
router.delete('/translate/cache', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req.headers['x-guest-id'] as string || null);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Access token or X-Guest-Id header required',
        code: 'UNAUTHORIZED'
      });
    }

    const clearedCount = await TranslationService.clearUserCache(userId);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Translation cache cleared',
        clearedCount
      }
    });

  } catch (error: any) {
    console.error('❌ Clear cache error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      code: 'CACHE_CLEAR_ERROR'
    });
  }
});

/**
 * GET /api/translate/quota
 * Get user's remaining translation quota
 */
router.get('/translate/quota', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req.headers['x-guest-id'] as string || null);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Access token or X-Guest-Id header required',
        code: 'UNAUTHORIZED'
      });
    }

    const remainingQuota = await TranslationService.getRemainingQuota(userId);

    return res.status(200).json({
      success: true,
      data: {
        remainingQuota,
        maxQuota: 50,
        quotaResetIn: 3600 // seconds
      }
    });

  } catch (error: any) {
    console.error('❌ Get quota error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get quota',
      code: 'QUOTA_ERROR'
    });
  }
});

export default router;
