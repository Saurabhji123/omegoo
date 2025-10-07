import crypto from 'crypto';
import { User, ChatSession, CONSTANTS } from './types';

// Hash utilities for privacy
export const hashUtils = {
  hashPhone: (phone: string): string => {
    return crypto.createHash('sha256').update(phone + 'phone_salt').digest('hex');
  },
  
  hashIP: (ip: string): string => {
    return crypto.createHash('sha256').update(ip + 'ip_salt').digest('hex');
  },
  
  hashDevice: (userAgent: string, fingerprint: string): string => {
    return crypto.createHash('sha256').update(userAgent + fingerprint + 'device_salt').digest('hex');
  },
  
  generateSessionId: (): string => {
    return crypto.randomUUID();
  },
  
  generateDeviceId: (): string => {
    return crypto.randomUUID();
  }
};

// Age verification utilities
export const ageVerification = {
  isValidAge: (birthYear: number): boolean => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    return age >= 18;
  },
  
  calculateAge: (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
};

// Text moderation utilities
export const moderationUtils = {
  containsExplicitWords: (text: string): boolean => {
    const explicitWords = [
      'fuck', 'shit', 'bitch', 'dick', 'pussy', 'cock', 'cum',
      'masturbate', 'orgasm', 'sex', 'porn', 'nude', 'naked'
    ];
    
    const lowerText = text.toLowerCase();
    return explicitWords.some(word => lowerText.includes(word));
  },
  
  detectSpam: (text: string): boolean => {
    // Simple spam detection
    const spamPatterns = [
      /(.)\1{4,}/, // Repeated characters
      /https?:\/\/[^\s]+/gi, // URLs
      /\b\d{10,}\b/, // Phone numbers
      /telegram|whatsapp|instagram/gi // Social media
    ];
    
    return spamPatterns.some(pattern => pattern.test(text));
  },
  
  sanitizeText: (text: string): string => {
    return text.replace(/[<>\"'&]/g, '');
  }
};

// Rate limiting utilities
export const rateLimitUtils = {
  generateKey: (userId: string, action: string): string => {
    return `rate_limit:${userId}:${action}`;
  },
  
  isWithinLimit: (count: number, limit: number, windowMs: number): boolean => {
    return count < limit;
  }
};

// Matching utilities
export const matchingUtils = {
  calculateCompatibility: (user1: User, user2: User): number => {
    let score = 0;
    
    // Language compatibility
    if (user1.preferences.language === user2.preferences.language) {
      score += 0.3;
    }
    
    // Interest overlap
    const commonInterests = user1.preferences.interests.filter(interest =>
      user2.preferences.interests.includes(interest)
    );
    score += (commonInterests.length / Math.max(user1.preferences.interests.length, 1)) * 0.4;
    
    // Age preference compatibility
    if (user1.preferences.ageRange && user2.preferences.ageRange) {
      const [user1Min, user1Max] = user1.preferences.ageRange;
      const [user2Min, user2Max] = user2.preferences.ageRange;
      
      if (
        (user1Min <= user2Max && user1Max >= user2Min) ||
        (user2Min <= user1Max && user2Max >= user1Min)
      ) {
        score += 0.3;
      }
    } else {
      score += 0.1; // Default if no age preference
    }
    
    return Math.min(score, 1);
  },
  
  shouldPrioritizeUser: (user: User): boolean => {
    return user.tier === 'premium' || user.tier === 'verified';
  }
};

// Time utilities
export const timeUtils = {
  getIST: (): Date => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (5.5 * 3600000)); // IST is UTC+5:30
    return ist;
  },
  
  isBusinessHours: (): boolean => {
    const ist = timeUtils.getIST();
    const hour = ist.getHours();
    return hour >= 9 && hour <= 21; // 9 AM to 9 PM IST
  },
  
  getPeakHours: (): boolean => {
    const ist = timeUtils.getIST();
    const hour = ist.getHours();
    return (hour >= 19 && hour <= 23); // 7 PM to 11 PM IST
  }
};

// Validation utilities
export const validationUtils = {
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number
    return phoneRegex.test(phone);
  },
  
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};

// Currency utilities
export const currencyUtils = {
  coinsToRupees: (coins: number): number => {
    return coins * CONSTANTS.COIN_TO_RUPEE_RATIO;
  },
  
  rupeesToCoins: (rupees: number): number => {
    return Math.floor(rupees / CONSTANTS.COIN_TO_RUPEE_RATIO);
  },
  
  formatRupees: (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  }
};

// Device detection utilities
export const deviceUtils = {
  isMobile: (userAgent: string): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  },
  
  getBrowser: (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  },
  
  getOS: (userAgent: string): string => {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
};

// Error handling utilities
export class OmegooError extends Error {
  public code: string;
  public statusCode: number;
  
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'OmegooError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const errorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  USER_BANNED: 'USER_BANNED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  MODERATION_VIOLATION: 'MODERATION_VIOLATION',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;