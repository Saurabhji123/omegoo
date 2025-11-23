// Topic Dice Service - Conversation Starters

import { TopicDicePrompt, TopicDiceResponse } from '../types/translation';
import { ServiceFactory } from './serviceFactory';

const DatabaseService = ServiceFactory.DatabaseService;

export class TopicDiceService {
  /**
   * Get random topic dice prompt by category
   */
  static async getRandomPrompt(
    category?: 'fun' | 'safe' | 'deep' | 'flirty',
    userLanguage: string = 'en',
    maturityRating: 'G' | 'PG' | 'PG-13' = 'PG'
  ): Promise<TopicDiceResponse> {
    try {
      // Build filter
      const filter: any = {
        active: true,
        maturityRating: { $in: this.getAllowedRatings(maturityRating) }
      };

      if (category) {
        filter.category = category;
      }

      // Get random prompt from database
      const prompts = await DatabaseService.getTopicDicePrompts(filter);

      if (!prompts || prompts.length === 0) {
        // Fallback to default prompts
        return this.getDefaultPrompt(category, userLanguage);
      }

      // Select random prompt
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

      // Get localized variant or fallback to English
      const localizedText = randomPrompt.localizedVariants?.[userLanguage] || randomPrompt.promptEn;

      return {
        id: randomPrompt.id,
        prompt: localizedText,
        category: randomPrompt.category,
        maturityRating: randomPrompt.maturityRating
      };

    } catch (error) {
      console.error('❌ Error getting topic dice prompt:', error);
      // Return fallback prompt
      return this.getDefaultPrompt(category, userLanguage);
    }
  }

  /**
   * Get allowed maturity ratings based on user's rating
   */
  private static getAllowedRatings(maxRating: 'G' | 'PG' | 'PG-13'): string[] {
    switch (maxRating) {
      case 'G':
        return ['G'];
      case 'PG':
        return ['G', 'PG'];
      case 'PG-13':
        return ['G', 'PG', 'PG-13'];
      default:
        return ['G', 'PG'];
    }
  }

  /**
   * Fallback prompts if database is empty
   */
  private static getDefaultPrompt(
    category?: 'fun' | 'safe' | 'deep' | 'flirty',
    language: string = 'en'
  ): TopicDiceResponse {
    const defaultPrompts: Record<string, Record<string, string>> = {
      fun: {
        en: "What's the most interesting place you've ever visited?",
        es: "¿Cuál es el lugar más interesante que has visitado?",
        fr: "Quel est l'endroit le plus intéressant que vous ayez jamais visité?",
        de: "Was ist der interessanteste Ort, den Sie je besucht haben?",
        hi: "आपने अब तक की सबसे दिलचस्प जगह कौन सी देखी है?"
      },
      safe: {
        en: "What do you do for fun?",
        es: "¿Qué haces para divertirte?",
        fr: "Que faites-vous pour vous amuser?",
        de: "Was machst du zum Spaß?",
        hi: "आप मनोरंजन के लिए क्या करते हैं?"
      },
      deep: {
        en: "What's a dream you've always had?",
        es: "¿Cuál es un sueño que siempre has tenido?",
        fr: "Quel est un rêve que vous avez toujours eu?",
        de: "Was ist ein Traum, den Sie immer hatten?",
        hi: "आपका हमेशा से क्या सपना रहा है?"
      },
      flirty: {
        en: "What's your idea of a perfect evening?",
        es: "¿Cuál es tu idea de una noche perfecta?",
        fr: "Quelle est votre idée d'une soirée parfaite?",
        de: "Was ist Ihre Vorstellung von einem perfekten Abend?",
        hi: "एक आदर्श शाम के बारे में आपका क्या विचार है?"
      }
    };

    const selectedCategory = category || 'safe';
    const prompts = defaultPrompts[selectedCategory];
    const prompt = prompts[language] || prompts['en'];

    return {
      id: `default-${selectedCategory}-${Date.now()}`,
      prompt,
      category: selectedCategory,
      maturityRating: 'PG'
    };
  }

  /**
   * Get all categories with counts
   */
  static async getCategories(): Promise<Array<{ category: string; count: number; emoji: string }>> {
    try {
      const categories = [
        { category: 'fun', emoji: '🎉' },
        { category: 'safe', emoji: '😊' },
        { category: 'deep', emoji: '🤔' },
        { category: 'flirty', emoji: '😉' }
      ];

      // Get counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => {
          const prompts = await DatabaseService.getTopicDicePrompts({
            category: cat.category,
            active: true
          });
          return {
            ...cat,
            count: prompts.length
          };
        })
      );

      return categoriesWithCounts;

    } catch (error) {
      console.error('❌ Error getting categories:', error);
      return [
        { category: 'fun', count: 0, emoji: '🎉' },
        { category: 'safe', count: 0, emoji: '😊' },
        { category: 'deep', count: 0, emoji: '🤔' },
        { category: 'flirty', count: 0, emoji: '😉' }
      ];
    }
  }

  /**
   * Log topic dice usage metric
   */
  static async logUsage(
    userId: string,
    sessionId: string,
    category: string,
    promptId: string
  ): Promise<void> {
    console.log('🎲 Topic dice used:', {
      userId,
      sessionId,
      category,
      promptId,
      timestamp: Date.now()
    });

    // Can be expanded to store in analytics database
  }

  /**
   * Create new topic dice prompt (admin only)
   */
  static async createPrompt(prompt: Omit<TopicDicePrompt, 'id' | 'createdAt'>): Promise<TopicDicePrompt> {
    try {
      const newPrompt: TopicDicePrompt = {
        ...prompt,
        id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };

      await DatabaseService.createTopicDicePrompt(newPrompt);
      console.log('✅ Created topic dice prompt:', newPrompt.id);
      
      return newPrompt;

    } catch (error) {
      console.error('❌ Error creating topic dice prompt:', error);
      throw error;
    }
  }

  /**
   * Update prompt (admin only)
   */
  static async updatePrompt(promptId: string, updates: Partial<TopicDicePrompt>): Promise<void> {
    try {
      await DatabaseService.updateTopicDicePrompt(promptId, updates);
      console.log('✅ Updated topic dice prompt:', promptId);
    } catch (error) {
      console.error('❌ Error updating topic dice prompt:', error);
      throw error;
    }
  }

  /**
   * Delete/deactivate prompt (admin only)
   */
  static async deactivatePrompt(promptId: string): Promise<void> {
    try {
      await DatabaseService.updateTopicDicePrompt(promptId, { active: false });
      console.log('✅ Deactivated topic dice prompt:', promptId);
    } catch (error) {
      console.error('❌ Error deactivating topic dice prompt:', error);
      throw error;
    }
  }
}
