import { z } from 'zod';

// User types
export enum UserTier {
  GUEST = 'guest',
  VERIFIED = 'verified',
  PREMIUM = 'premium'
}

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  SUSPENDED = 'suspended'
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string(),
  phoneHash: z.string().optional(),
  tier: z.nativeEnum(UserTier),
  status: z.nativeEnum(UserStatus),
  coins: z.number().default(0),
  isVerified: z.boolean().default(false),
  preferences: z.object({
    language: z.string().default('en'),
    interests: z.array(z.string()).default([]),
    ageRange: z.tuple([z.number(), z.number()]).optional(),
    genderPreference: z.enum(['any', 'male', 'female']).default('any')
  }),
  subscription: z.object({
    type: z.enum(['none', 'starter', 'standard', 'premium']).default('none'),
    expiresAt: z.date().optional()
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastActiveAt: z.date()
});

export type User = z.infer<typeof UserSchema>;

// Chat types
export enum ChatMode {
  TEXT = 'text',
  AUDIO = 'audio',
  VIDEO = 'video'
}

export enum ChatStatus {
  WAITING = 'waiting',
  MATCHED = 'matched',
  CONNECTED = 'connected',
  ENDED = 'ended',
  REPORTED = 'reported'
}

export const ChatSessionSchema = z.object({
  id: z.string().uuid(),
  user1Id: z.string().uuid(),
  user2Id: z.string().uuid(),
  mode: z.nativeEnum(ChatMode),
  status: z.nativeEnum(ChatStatus),
  startedAt: z.date(),
  endedAt: z.date().optional(),
  duration: z.number().optional(),
  reportedBy: z.string().uuid().optional(),
  moderationFlags: z.array(z.string()).default([])
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

// Moderation types
export enum ModerationAction {
  WARN = 'warn',
  SUSPEND = 'suspend',
  BAN = 'ban',
  REPORT_LE = 'report_le'
}

export enum ViolationType {
  NUDITY = 'nudity',
  EXPLICIT_CONTENT = 'explicit_content',
  HARASSMENT = 'harassment',
  SPAM = 'spam',
  UNDERAGE = 'underage',
  VIOLENCE = 'violence'
}

export const ModerationReportSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  reportedUserId: z.string().uuid(),
  reporterUserId: z.string().uuid().optional(),
  violationType: z.nativeEnum(ViolationType),
  description: z.string(),
  evidenceUrls: z.array(z.string()).default([]),
  autoDetected: z.boolean().default(false),
  confidenceScore: z.number().min(0).max(1),
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']).default('pending'),
  action: z.nativeEnum(ModerationAction).optional(),
  reviewedBy: z.string().uuid().optional(),
  reviewedAt: z.date().optional(),
  createdAt: z.date()
});

export type ModerationReport = z.infer<typeof ModerationReportSchema>;

// Ban types
export enum BanType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent'
}

export const BanRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(BanType),
  reason: z.string(),
  reportId: z.string().uuid(),
  deviceHashes: z.array(z.string()),
  phoneHash: z.string().optional(),
  ipHashes: z.array(z.string()),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  isActive: z.boolean().default(true)
});

export type BanRecord = z.infer<typeof BanRecordSchema>;

// Payment types
export enum TransactionType {
  COIN_PURCHASE = 'coin_purchase',
  SUBSCRIPTION = 'subscription',
  REWARD = 'reward',
  GIFT = 'gift',
  SPEND = 'spend'
}

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.nativeEnum(TransactionType),
  amount: z.number(),
  coins: z.number(),
  description: z.string(),
  paymentId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('pending'),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date()
});

export type Transaction = z.infer<typeof TransactionSchema>;

// WebSocket message types
export enum WSMessageType {
  MATCH_REQUEST = 'match_request',
  MATCH_FOUND = 'match_found',
  MATCH_CANCELLED = 'match_cancelled',
  CHAT_MESSAGE = 'chat_message',
  TYPING = 'typing',
  USER_DISCONNECTED = 'user_disconnected',
  MODERATION_WARNING = 'moderation_warning',
  SESSION_ENDED = 'session_ended',
  WEBRTC_OFFER = 'webrtc_offer',
  WEBRTC_ANSWER = 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE = 'webrtc_ice_candidate'
}

export const WSMessageSchema = z.object({
  type: z.nativeEnum(WSMessageType),
  payload: z.any(),
  timestamp: z.date().default(() => new Date()),
  sessionId: z.string().uuid().optional()
});

export type WSMessage = z.infer<typeof WSMessageSchema>;

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  code: z.string().optional()
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

// Common constants
export const CONSTANTS = {
  MAX_SESSION_DURATION: 10 * 60 * 1000, // 10 minutes
  MATCH_TIMEOUT: 30 * 1000, // 30 seconds
  MODERATION_THRESHOLD: 0.95,
  EVIDENCE_RETENTION_DAYS: 90,
  MAX_REPORTS_PER_USER_PER_DAY: 10,
  COIN_TO_RUPEE_RATIO: 0.99, // 1 coin = ₹0.99
  FREE_DAILY_COINS: 5,
  SUPPORTED_LANGUAGES: ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu'],
  INTERESTS: [
    'movies', 'music', 'gaming', 'sports', 'technology', 'food',
    'travel', 'books', 'art', 'fitness', 'photography', 'dancing'
  ]
} as const;

export { z };