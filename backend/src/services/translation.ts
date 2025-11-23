// Translation Service - LibreTranslate Integration

import crypto from 'crypto';
import { TranslationRequest, TranslationResponse } from '../types/translation';
import { RedisService } from './redis';

export class TranslationService {
  private static readonly LIBRETRANSLATE_API_URL = process.env.LIBRETRANSLATE_API_URL || 'https://libretranslate.com';
  private static readonly TRANSLATION_API_KEY = process.env.TRANSLATION_API_KEY || '';
  private static readonly CACHE_TTL = 24 * 60 * 60; // 24 hours
  private static readonly RATE_LIMIT_WINDOW = 60 * 60; // 1 hour
  private static readonly RATE_LIMIT_MAX = 50; // 50 translations per hour per user

  /**
   * Translate text using LibreTranslate API with caching
   */
  static async translateText(request: TranslationRequest, userId: string): Promise<TranslationResponse> {
    const { text, targetLang, sourceLang = 'auto' } = request;

    // Check rate limit
    const rateLimitKey = `translation:ratelimit:${userId}`;
    const currentCount = await RedisService.get(rateLimitKey);
    
    if (currentCount && parseInt(currentCount) >= this.RATE_LIMIT_MAX) {
      throw new Error('Translation rate limit exceeded. Please try again later.');
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(text, targetLang, sourceLang);
    
    // Check cache first
    const cached = await RedisService.get(cacheKey);
    if (cached) {
      console.log('✅ Translation cache hit:', cacheKey);
      
      // Log cache hit metric
      await this.logMetric(userId, 'translation_cache_hit', { sourceLang, targetLang });
      
      return {
        ...JSON.parse(cached),
        cached: true
      };
    }

    console.log('❌ Translation cache miss, calling API:', cacheKey);

    // Call LibreTranslate API
    const startTime = Date.now();
    try {
      const response = await fetch(`${this.LIBRETRANSLATE_API_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.TRANSLATION_API_KEY && { 'Authorization': `Bearer ${this.TRANSLATION_API_KEY}` })
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text',
          api_key: this.TRANSLATION_API_KEY || undefined
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LibreTranslate API error: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();
      const responseTime = Date.now() - startTime;

      // Detect source language if auto
      const detectedSourceLang = data.detectedLanguage?.language || sourceLang;

      const result: TranslationResponse = {
        translatedText: data.translatedText,
        sourceLang: detectedSourceLang,
        targetLang,
        confidence: data.detectedLanguage?.confidence,
        cached: false
      };

      // Cache the result
      await RedisService.set(cacheKey, {
        translatedText: result.translatedText,
        sourceLang: result.sourceLang,
        targetLang: result.targetLang,
        confidence: result.confidence
      }, this.CACHE_TTL);

      // Increment rate limit counter
      await this.incrementRateLimit(userId);

      // Log metrics
      await this.logMetric(userId, 'translation_cache_miss', {
        sourceLang: detectedSourceLang,
        targetLang,
        responseTime
      });

      await this.logMetric(userId, 'translation_requested', {
        sourceLang: detectedSourceLang,
        targetLang,
        responseTime
      });

      console.log(`✅ Translation completed in ${responseTime}ms`);
      return result;

    } catch (error: any) {
      console.error('❌ Translation API error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Detect language of text using LibreTranslate
   */
  static async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      const response = await fetch(`${this.LIBRETRANSLATE_API_URL}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.TRANSLATION_API_KEY && { 'Authorization': `Bearer ${this.TRANSLATION_API_KEY}` })
        },
        body: JSON.stringify({
          q: text,
          api_key: this.TRANSLATION_API_KEY || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`LibreTranslate detect error: ${response.status}`);
      }

      const data: any = await response.json();
      
      // Return most confident language
      const topLanguage = data[0];
      return {
        language: topLanguage.language,
        confidence: topLanguage.confidence
      };

    } catch (error: any) {
      console.error('❌ Language detection error:', error);
      return { language: 'en', confidence: 0 }; // Default to English
    }
  }

  /**
   * Get supported languages from LibreTranslate
   */
  static async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    try {
      const cacheKey = 'translation:supported_languages';
      const cached = await RedisService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await fetch(`${this.LIBRETRANSLATE_API_URL}/languages`, {
        method: 'GET',
        headers: {
          ...(this.TRANSLATION_API_KEY && { 'Authorization': `Bearer ${this.TRANSLATION_API_KEY}` })
        }
      });

      if (!response.ok) {
        throw new Error(`LibreTranslate languages error: ${response.status}`);
      }

      const languages = await response.json() as Array<{ code: string; name: string }>;
      
      // Cache for 7 days (languages don't change often)
      await RedisService.set(cacheKey, languages, 7 * 24 * 60 * 60);
      
      return languages;

    } catch (error: any) {
      console.error('❌ Failed to get supported languages:', error);
      
      // Return default list
      return [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ar', name: 'Arabic' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' }
      ];
    }
  }

  /**
   * Clear translation cache for a specific user
   */
  static async clearUserCache(userId: string): Promise<number> {
    const pattern = `translation:cache:${userId}:*`;
    const keys = await RedisService.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    for (const key of keys) {
      await RedisService.del(key);
    }
    
    console.log(`🗑️ Cleared ${keys.length} cached translations for user ${userId}`);
    return keys.length;
  }

  /**
   * Generate cache key from text and languages
   */
  private static generateCacheKey(text: string, targetLang: string, sourceLang: string): string {
    const hash = crypto.createHash('sha256').update(text + targetLang + sourceLang).digest('hex');
    return `translation:cache:${hash}`;
  }

  /**
   * Increment rate limit counter for user
   */
  private static async incrementRateLimit(userId: string): Promise<void> {
    const key = `translation:ratelimit:${userId}`;
    const current = await RedisService.get(key);
    
    if (current) {
      await RedisService.increment(key, 1);
    } else {
      await RedisService.set(key, 1, this.RATE_LIMIT_WINDOW);
    }
  }

  /**
   * Get remaining translation quota for user
   */
  static async getRemainingQuota(userId: string): Promise<number> {
    const key = `translation:ratelimit:${userId}`;
    const current = await RedisService.get(key);
    
    if (!current) {
      return this.RATE_LIMIT_MAX;
    }

    const used = parseInt(current);
    return Math.max(0, this.RATE_LIMIT_MAX - used);
  }

  /**
   * Log translation metrics
   */
  private static async logMetric(
    userId: string,
    event: 'translation_requested' | 'translation_cache_hit' | 'translation_cache_miss',
    data: { sourceLang?: string; targetLang?: string; responseTime?: number }
  ): Promise<void> {
    // Log to analytics service (can be expanded later)
    console.log('📊 Translation metric:', {
      userId,
      event,
      ...data,
      timestamp: Date.now()
    });

    // Store in Redis for recent metrics (optional)
    const metricsKey = `translation:metrics:${userId}:${Date.now()}`;
    await RedisService.set(metricsKey, {
      event,
      ...data,
      timestamp: Date.now()
    }, 60 * 60);
  }
}
