// Translation Context - State Management for Translation Feature

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { guestAPI } from '../services/api';
import { TranslationCache, SupportedLanguageCode } from '../types/translation';

interface TranslationContextType {
  preferredLanguage: SupportedLanguageCode;
  autoTranslateEnabled: boolean;
  translationCache: TranslationCache;
  remainingQuota: number;
  toggleAutoTranslate: () => void;
  setPreferredLanguage: (lang: SupportedLanguageCode) => void;
  translateMessage: (messageId: string, text: string, targetLang?: string) => Promise<string>;
  getOriginalMessage: (messageId: string) => string | null;
  clearCache: () => Promise<void>;
  refreshQuota: () => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [preferredLanguage, setPreferredLanguageState] = useState<SupportedLanguageCode>(() => {
    const saved = localStorage.getItem('omegoo_preferred_language');
    return (saved as SupportedLanguageCode) || 'en';
  });

  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('omegoo_auto_translate');
    return saved === 'true';
  });

  const [translationCache, setTranslationCache] = useState<TranslationCache>(() => {
    try {
      const saved = localStorage.getItem('omegoo_translation_cache');
      if (saved) {
        const cache = JSON.parse(saved);
        // Remove old cache entries (older than 24 hours)
        const now = Date.now();
        const filtered: TranslationCache = {};
        Object.entries(cache).forEach(([key, value]: [string, any]) => {
          if (now - value.timestamp < 24 * 60 * 60 * 1000) {
            filtered[key] = value;
          }
        });
        return filtered;
      }
    } catch (error) {
      console.error('Failed to load translation cache:', error);
    }
    return {};
  });

  const [remainingQuota, setRemainingQuota] = useState<number>(50);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('omegoo_preferred_language', preferredLanguage);
  }, [preferredLanguage]);

  useEffect(() => {
    localStorage.setItem('omegoo_auto_translate', String(autoTranslateEnabled));
  }, [autoTranslateEnabled]);

  useEffect(() => {
    localStorage.setItem('omegoo_translation_cache', JSON.stringify(translationCache));
  }, [translationCache]);

  // Load quota on mount
  useEffect(() => {
    refreshQuota();
  }, []);

  const toggleAutoTranslate = () => {
    setAutoTranslateEnabled(prev => !prev);
  };

  const setPreferredLanguage = (lang: SupportedLanguageCode) => {
    setPreferredLanguageState(lang);
  };

  const refreshQuota = async () => {
    try {
      const response = await guestAPI.getTranslationQuota();
      if (response.success && response.data) {
        setRemainingQuota(response.data.remainingQuota);
      }
    } catch (error) {
      console.error('Failed to fetch translation quota:', error);
    }
  };

  const translateMessage = async (
    messageId: string,
    text: string,
    targetLang?: string
  ): Promise<string> => {
    const target = targetLang || preferredLanguage;

    // Check cache first
    const cacheKey = messageId;
    if (translationCache[cacheKey] && translationCache[cacheKey].targetLang === target) {
      console.log('✅ Translation cache hit:', cacheKey);
      return translationCache[cacheKey].translated;
    }

    try {
      console.log('🌐 Translating message:', { messageId, target });
      
      const response = await guestAPI.translateMessage(text, target, 'auto');
      
      if (response.success && response.data) {
        const { translatedText, sourceLang, targetLang } = response.data;

        // Update cache
        setTranslationCache(prev => ({
          ...prev,
          [cacheKey]: {
            original: text,
            translated: translatedText,
            sourceLang,
            targetLang,
            timestamp: Date.now()
          }
        }));

        // Update quota
        if (response.meta) {
          setRemainingQuota(response.meta.remainingQuota);
        }

        console.log('✅ Translation completed:', {
          messageId,
          sourceLang,
          targetLang,
          cached: response.data.cached,
          remainingQuota: response.meta?.remainingQuota
        });

        return translatedText;
      }

      throw new Error('Translation failed');

    } catch (error: any) {
      console.error('❌ Translation error:', error);
      
      // Check if rate limit error
      if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        throw new Error('Translation quota exceeded. Please try again later.');
      }
      
      throw new Error('Translation failed. Please try again.');
    }
  };

  const getOriginalMessage = (messageId: string): string | null => {
    const cached = translationCache[messageId];
    return cached ? cached.original : null;
  };

  const clearCache = async () => {
    try {
      // Clear server cache
      await guestAPI.clearTranslationCache();
      
      // Clear local cache
      setTranslationCache({});
      localStorage.removeItem('omegoo_translation_cache');
      
      console.log('✅ Translation cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  };

  const value: TranslationContextType = {
    preferredLanguage,
    autoTranslateEnabled,
    translationCache,
    remainingQuota,
    toggleAutoTranslate,
    setPreferredLanguage,
    translateMessage,
    getOriginalMessage,
    clearCache,
    refreshQuota
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationContext;
