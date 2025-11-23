// Translation Types - Frontend

export interface TranslationRequest {
  text: string;
  targetLang: string;
  sourceLang?: string;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  confidence?: number;
  cached: boolean;
}

export interface TopicDicePrompt {
  id: string;
  prompt: string;
  category: 'fun' | 'safe' | 'deep' | 'flirty';
  maturityRating: 'G' | 'PG' | 'PG-13';
}

export interface TopicDiceCategory {
  category: string;
  count: number;
  emoji: string;
}

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

export interface TranslationCache {
  [messageId: string]: {
    original: string;
    translated: string;
    sourceLang: string;
    targetLang: string;
    timestamp: number;
  };
}
