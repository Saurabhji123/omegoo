// Translation & Topic Dice Types - Boredom Killers Feature

export interface TranslationRequest {
  text: string;
  targetLang: string;
  sourceLang?: string; // 'auto' for auto-detection
}

export interface TranslationResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  confidence?: number; // 0-1 score from translation API
  cached: boolean;
}

export interface TopicDicePrompt {
  id: string;
  promptEn: string;
  category: 'fun' | 'safe' | 'deep' | 'flirty';
  maturityRating: 'G' | 'PG' | 'PG-13'; // General, Parental Guidance, 13+
  localizedVariants: {
    [langCode: string]: string; // e.g., { es: "¿Cuál es tu pizza favorita?", fr: "Quelle est votre pizza préférée?" }
  };
  tags: string[];
  createdAt: Date;
  active: boolean;
}

export interface TopicDiceResponse {
  id: string;
  prompt: string;
  category: string;
  maturityRating: string;
}

export interface TranslationMetrics {
  userId: string;
  sessionId: string;
  event: 'translation_requested' | 'translation_cache_hit' | 'translation_cache_miss' | 'topic_dice_used';
  category?: string; // For topic dice
  sourceLang?: string;
  targetLang?: string;
  responseTime?: number; // ms
  timestamp: number;
}

export interface UserTranslationPreferences {
  userId: string;
  preferredLanguage: string;
  autoTranslateEnabled: boolean;
  excludedLanguages: string[]; // Languages user doesn't want translated
  updatedAt: Date;
}

// Supported languages for translation
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
  it: 'Italian'
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;
