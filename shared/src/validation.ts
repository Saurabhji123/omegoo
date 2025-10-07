import { z } from 'zod';
import { UserTier, ChatMode, ViolationType } from './types';

// Authentication validation schemas
export const loginSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  userAgent: z.string().min(1, 'User agent is required'),
  fingerprint: z.string().optional()
});

export const phoneVerificationSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

// Chat validation schemas
export const matchRequestSchema = z.object({
  mode: z.nativeEnum(ChatMode),
  preferences: z.object({
    language: z.string().optional(),
    interests: z.array(z.string()).optional(),
    ageRange: z.tuple([z.number().min(18), z.number().max(100)]).optional()
  }).optional()
});

export const chatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(500),
  type: z.enum(['text', 'emoji', 'sticker']).default('text')
});

// Moderation validation schemas
export const reportUserSchema = z.object({
  sessionId: z.string().uuid(),
  violationType: z.nativeEnum(ViolationType),
  description: z.string().min(10).max(500),
  evidence: z.array(z.string()).optional()
});

export const moderationFrameSchema = z.object({
  sessionId: z.string().uuid(),
  frameData: z.string(), // base64 encoded image
  timestamp: z.number(),
  width: z.number().min(1),
  height: z.number().min(1)
});

// Payment validation schemas
export const coinPurchaseSchema = z.object({
  amount: z.number().min(99).max(9999), // ₹99 to ₹9999
  coins: z.number().min(100).max(10000),
  paymentMethod: z.enum(['razorpay', 'stripe'])
});

export const subscriptionSchema = z.object({
  type: z.enum(['starter', 'standard', 'premium']),
  duration: z.enum(['weekly', 'monthly', 'quarterly']),
  paymentMethod: z.enum(['razorpay', 'stripe'])
});

// Admin validation schemas
export const banUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10),
  type: z.enum(['temporary', 'permanent']),
  duration: z.number().optional(), // hours for temporary bans
  reportId: z.string().uuid().optional()
});

export const updateModerationSettingsSchema = z.object({
  nudityThreshold: z.number().min(0).max(1),
  explicitContentThreshold: z.number().min(0).max(1),
  autoKillThreshold: z.number().min(0).max(1),
  frameCaptureModeEnabled: z.boolean(),
  audioModerationEnabled: z.boolean()
});

// User profile validation schemas
export const updatePreferencesSchema = z.object({
  language: z.string().min(2).max(5),
  interests: z.array(z.string()).min(0).max(10),
  ageRange: z.tuple([z.number().min(18), z.number().max(100)]).optional(),
  genderPreference: z.enum(['any', 'male', 'female']).default('any')
});

export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'complaint']),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  rating: z.number().min(1).max(5).optional(),
  email: z.string().email().optional()
});

// WebRTC validation schemas
export const webrtcOfferSchema = z.object({
  sessionId: z.string().uuid(),
  offer: z.object({
    type: z.literal('offer'),
    sdp: z.string()
  })
});

export const webrtcAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  answer: z.object({
    type: z.literal('answer'),
    sdp: z.string()
  })
});

export const iceCandidateSchema = z.object({
  sessionId: z.string().uuid(),
  candidate: z.object({
    candidate: z.string(),
    sdpMid: z.string().nullable(),
    sdpMLineIndex: z.number().nullable()
  })
});

// File upload validation schemas
export const evidenceUploadSchema = z.object({
  sessionId: z.string().uuid(),
  files: z.array(z.object({
    name: z.string(),
    size: z.number().max(5 * 1024 * 1024), // 5MB max
    type: z.enum(['image/jpeg', 'image/png', 'video/mp4', 'audio/wav'])
  })).max(3)
});

// Analytics validation schemas
export const trackEventSchema = z.object({
  event: z.string().min(1),
  properties: z.record(z.any()).optional(),
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional()
});

// Common validation helpers
export const validatePagination = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const validateDateRange = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Start date must be before end date"
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  action: z.string(),
  identifier: z.string(),
  limit: z.number().min(1),
  windowMs: z.number().min(1000)
});

// Health check validation
export const healthCheckSchema = z.object({
  service: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.date(),
  details: z.record(z.any()).optional()
});

// Validation error formatting
export const formatZodError = (error: z.ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

// Custom validation functions
export const validateAge = (birthDate: string): boolean => {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file: File, maxSizeBytes: number): boolean => {
  return file.size <= maxSizeBytes;
};

export const validateSessionTimeout = (startTime: Date, maxDurationMs: number): boolean => {
  const elapsed = Date.now() - startTime.getTime();
  return elapsed < maxDurationMs;
};