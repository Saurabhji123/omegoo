// database.service.ts
import mongoose, { Schema, Document, Model, PipelineStage } from 'mongoose';
import bcrypt from 'bcryptjs';
import type {
  AcquisitionMapSummary,
  AcquisitionSourcesSummary,
  AnalyticsFilterOptionsSnapshot,
  AnalyticsFilterParams,
  ChatMode,
  DurationDistributionBin,
  FunnelSummary,
  EngagementHeatmapOptions,
  EngagementHeatmapSnapshot,
  EngagementSummaryOptions,
  EngagementSummarySnapshot,
  UserGrowthSummary,
  UserRetentionSummary,
  RetentionCohortSummary,
  GoalDefinition,
  GoalDefinitionInput,
  GoalSnapshotRecord,
  GoalSummarySnapshot,
  GoalSummaryOptions,
  GoalSummaryEntry,
  GoalTimeseriesOptions,
  GoalTimeseriesResponse,
  GoalTimeseriesSeries,
  GoalTimeseriesPoint,
  GoalTimeseriesInterval,
  AnomalyBaselineEntry,
  AnomalyBaselineUpsertInput,
  AnomalyEventEntry,
  AnomalyEventInput,
  AnomalyFeedResponse,
  BenchmarkSummary
} from '../types/services';

const toGrowthDateKey = (value?: Date | string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split('T')[0];
};

const toDateKey = (value?: Date | string | null): string | null => toGrowthDateKey(value);

const buildDateRange = (start: Date, end: Date): string[] => {
  const cursor = new Date(start.getTime());
  cursor.setUTCHours(0, 0, 0, 0);

  const range: string[] = [];
  const endMs = end.getTime();

  while (cursor.getTime() <= endMs) {
    range.push(toDateKey(cursor)!);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return range;
};

const buildGrowthDateRange = (start: Date, end: Date): string[] => {
  const cursor = new Date(start.getTime());
  cursor.setUTCHours(0, 0, 0, 0);

  const range: string[] = [];
  const endMs = end.getTime();

  while (cursor.getTime() <= endMs) {
    range.push(toGrowthDateKey(cursor)!);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return range;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const addUtcDays = (date: Date, days: number): Date => {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const RETENTION_BUCKET_OFFSETS = [0, 1, 3, 7, 14, 30];

const HEATMAP_DAY_LABELS: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_CHAT_MODES: ChatMode[] = ['text', 'audio', 'video'];
const HEAVY_USER_THRESHOLD = 5;

const DURATION_BIN_DEFINITIONS: Array<{ label: string; minSeconds: number; maxSeconds: number | null }> = [
  { label: '0‒1 min', minSeconds: 0, maxSeconds: 60 },
  { label: '1‒3 min', minSeconds: 60, maxSeconds: 180 },
  { label: '3‒10 min', minSeconds: 180, maxSeconds: 600 },
  { label: '10‒30 min', minSeconds: 600, maxSeconds: 1800 },
  { label: '30+ min', minSeconds: 1800, maxSeconds: null }
];

const normalizeChatMode = (mode?: string | null): ChatMode => {
  const normalized = typeof mode === 'string' ? mode.trim().toLowerCase() : '';
  if (normalized === 'text') return 'text';
  if (normalized === 'audio') return 'audio';
  return 'video';
};

const safeDateFrom = (value?: Date | string | number | null): Date | null => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const ensureModeBreakdown = (): Record<ChatMode, number> => ({
  text: 0,
  audio: 0,
  video: 0
});

const sumArray = (values: number[]): number => values.reduce((acc, current) => acc + current, 0);

const medianOf = (values: number[]): number => {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const percentileOf = (values: number[], percentile: number): number => {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

const toPercentage = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 10000) / 100;
};

const GOAL_DEFAULT_WARN_THRESHOLD = 80;

const DEFAULT_DAILY_COIN_REFILL = 50;

const resolveDailyRefillAmount = (): number => {
  const candidates = [
    process.env.DAILY_COIN_REFILL,
    process.env.DAILY_COINS_BASE,
    process.env.DAILY_COIN_BASE,
    process.env.DAILY_COINS_ALLOWANCE
  ];

  for (const candidate of candidates) {
    if (candidate === undefined) {
      continue;
    }

    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return DEFAULT_DAILY_COIN_REFILL;
};

const DAILY_REFILL_COINS = resolveDailyRefillAmount();

const sanitizeCoinBalance = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Math.max(0, fallback);
  }
  return Math.max(parsed, 0);
};

const toProgressPercent = (value: number, target: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) {
    return 0;
  }
  return Math.round((value / target) * 10000) / 100;
};

const resolveGoalStatus = (progressPercent: number, warnThreshold: number): 'on_track' | 'at_risk' | 'off_track' | 'completed' => {
  if (progressPercent >= 100) {
    return 'completed';
  }
  const normalizedWarn = Number.isFinite(warnThreshold) && warnThreshold > 0 ? warnThreshold : GOAL_DEFAULT_WARN_THRESHOLD;
  if (progressPercent >= normalizedWarn) {
    return 'on_track';
  }
  const atRiskFloor = Math.max(0, normalizedWarn - 15);
  if (progressPercent >= atRiskFloor) {
    return 'at_risk';
  }
  return 'off_track';
};

const goalIntervalToMs = (interval: GoalTimeseriesInterval): number => {
  switch (interval) {
    case 'week':
      return 7 * DAY_MS;
    case 'month':
      return 30 * DAY_MS;
    case 'day':
    default:
      return DAY_MS;
  }
};

const normalizeSegmentValue = (value?: string | null): string => {
  if (!value) {
    return 'unknown';
  }

  return String(value).trim().toLowerCase() || 'unknown';
};

type NormalizedAnalyticsFilters = {
  genders: string[] | null;
  platforms: string[] | null;
  signupSources: string[] | null;
  campaigns: string[] | null;
};

const sanitizeFilterList = (values?: string[]): string[] | null => {
  if (!values || values.length === 0) {
    return null;
  }

  const normalized = values
    .map((value) => normalizeSegmentValue(value))
    .filter((value) => value && value !== 'all' && value !== 'any' && value !== '*');

  return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
};

const normalizeAnalyticsFilters = (filters: AnalyticsFilterParams = {}): NormalizedAnalyticsFilters => ({
  genders: sanitizeFilterList(filters.genders),
  platforms: sanitizeFilterList(filters.platforms),
  signupSources: sanitizeFilterList(filters.signupSources),
  campaigns: sanitizeFilterList(filters.campaigns)
});

type FilterRecord = {
  gender?: string;
  platform?: string;
  signupSource?: string;
  campaignId?: string;
};

const recordMatchesFilters = (record: FilterRecord | null | undefined, normalized: NormalizedAnalyticsFilters): boolean => {
  if (!record) {
    return false;
  }

  const genderValue = normalizeSegmentValue(record.gender);
  const platformValue = normalizeSegmentValue(record.platform);
  const signupValue = normalizeSegmentValue(record.signupSource);
  const campaignValue = normalizeSegmentValue(record.campaignId);

  if (normalized.genders && !normalized.genders.includes(genderValue)) {
    return false;
  }
  if (normalized.platforms && !normalized.platforms.includes(platformValue)) {
    return false;
  }
  if (normalized.signupSources && !normalized.signupSources.includes(signupValue)) {
    return false;
  }
  if (normalized.campaigns && !normalized.campaigns.includes(campaignValue)) {
    return false;
  }

  return true;
};

const REGION_DISPLAY = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch (error) {
    return null;
  }
})();

const resolveCountryName = (code?: string): string => {
  if (!code) {
    return 'Unknown';
  }
  try {
    return REGION_DISPLAY?.of(code) || code.toUpperCase();
  } catch (error) {
    return code.toUpperCase();
  }
};

const resolveSubdivisionName = (code?: string): string | undefined => {
  if (!code) {
    return undefined;
  }
  try {
    return REGION_DISPLAY?.of(code) || code;
  } catch (error) {
    return code;
  }
};
/* -------------------------
   Interfaces (Mongoose docs)
   ------------------------- */
interface IUserDoc extends Document {
  id: string;
  deviceId: string;
  email?: string;
  username?: string;
  passwordHash?: string;
  phoneNumber?: string;
  phoneHash?: string;
  isVerified: boolean;
  otp?: string; // 📧 OTP for email verification
  otpExpiresAt?: Date; // 📧 OTP expiry time (10 minutes)
  verificationStatus: 'guest' | 'verified';
  subscriptionLevel: 'normal' | 'premium';
  role: 'user' | 'admin' | 'super_admin';
  tier?: 'guest' | 'verified' | 'premium' | 'admin' | 'super_admin';
  status: 'active' | 'banned' | 'suspended';
  coins?: number;
  totalChats?: number;
  dailyChats?: number;
  lastCoinClaim?: Date;
  reportCount?: number;
  gender?: 'male' | 'female' | 'others';
  platform?: string;
  signupSource?: string;
  campaignId?: string;
  signupCountryCode?: string;
  signupCountryName?: string;
  signupRegionCode?: string;
  signupRegionName?: string;
  signupSubdivisionCode?: string;
  signupCity?: string;
  signupLatitude?: number;
  signupLongitude?: number;
  signupAccuracyRadius?: number;
  referrerUrl?: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  preferences?: any;
  subscription?: any;
  isOnline?: boolean;
  socketId?: string | null;
  activeDeviceToken?: string; // 🔒 Single-device session enforcement
  lastLoginDevice?: string; // 🔒 Last login device info
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastPasswordResetAt?: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IChatSessionDoc extends Document {
  id: string;
  user1Id: string;
  user2Id: string;
  mode: 'text' | 'audio' | 'video';
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IModerationReportDoc extends Document {
  id: string;
  sessionId: string;
  reportedUserId: string;
  reporterUserId: string;
  violationType: string;
  description: string;
  evidenceUrls: string[];
  autoDetected: boolean;
  confidenceScore: number;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

interface IMessageDoc extends Document {
  roomId: string;
  senderId: string;
  content: string;
  type?: 'text' | 'image' | 'video' | 'system';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface IChatRoomDoc extends Document {
  participants: string[]; // user ids
  type?: string;
  status?: string;
  settings?: any;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  endReason?: string;
}

interface IBanHistoryDoc extends Document {
  id: string;
  userId: string;
  reportCount: number;
  banType: 'temporary' | 'permanent';
  banDuration?: number; // in days
  bannedAt: Date;
  expiresAt?: Date;
  reason: string;
  bannedBy?: string; // admin ID or 'auto'
  isActive: boolean;
  createdAt: Date;
}

interface ICoinAdjustmentDoc extends Document {
  id: string;
  userId: string;
  delta: number;
  reason?: string;
  adminId?: string;
  adminUsername?: string;
  previousCoins: number;
  newCoins: number;
  createdAt: Date;
}

interface IAdminDoc extends Document {
  id: string;
  userId?: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
  isOwner?: boolean; // NEW: Owner flag
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IDeletedAccountDoc extends Document {
  userId: string;
  reason: string;
  deletedBy?: string;
  deletedAt: Date;
  originalData: any;
}

interface IAdminDeletedAccountDoc extends Document {
  userId: string;
  reason: string;
  deletedBy?: string;
  deletedAt: Date;
  originalData: any;
  adminId?: string;
  adminUsername?: string;
}

interface IReportedChatMessage {
  senderId: string;
  content: string;
  type?: string;
  timestamp: Date;
  replyTo?: any;
}

interface IGoalDefinitionDoc extends Document {
  id: string;
  key: string;
  name: string;
  description?: string;
  metric: string;
  targetValue: number;
  unit?: string;
  tags: string[];
  isActive: boolean;
  ownerEmail?: string;
  color?: string;
  alertThresholdPercent?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface IGoalSnapshotDoc extends Document {
  goalKey: string;
  timestamp: Date;
  value: number;
  targetValue: number;
  delta: number;
  metadata?: any;
  createdAt: Date;
}

interface IAnomalyBaselineDoc extends Document {
  metric: string;
  period: string;
  mean: number;
  standardDeviation: number;
  sampleSize: number;
  trend?: number;
  metadata?: any;
  updatedAt: Date;
}

interface IAnomalyEventDoc extends Document {
  metric: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  direction: 'positive' | 'negative';
  actual: number;
  expected: number;
  zScore: number;
  baselineMean: number;
  baselineStdDev: number;
  metadata?: any;
  createdAt: Date;
}

interface IReportedChatTranscriptDoc extends Document {
  sessionId: string;
  reporterUserId: string;
  reporterEmail?: string;
  reportedUserId: string;
  reportedEmail?: string;
  mode?: string;
  messages: IReportedChatMessage[];
  createdAt: Date;
}

/* Shadow Login Guest User */
interface IGuestUserDoc extends Document {
  guestId: string; // SHA-256 fingerprint hash (unique identifier)
  deviceMeta: {
    version: string;
    timestamp: number;
    userAgent: string;
    language: string;
    timezone: string;
    screenResolution: string;
    colorDepth: number;
    platform: string;
    doNotTrack: boolean;
    fingerprintMethod: 'fpjs' | 'basic' | 'random';
  };
  sessions: number; // Total visit count
  lastSeen: Date;
  createdAt: Date;
  status: 'active' | 'deleted';
  notes?: string;
}

/* Favourites - User's saved favourite users */
interface IFavouriteDoc extends Document {
  userId: string; // Current user who added favourite
  favouriteUserId: string; // The user being added to favourites
  favouriteUserGender?: string; // Gender of favourite user
  favouriteUserInterests?: string[]; // Interests of favourite user
  addedAt: Date; // When favourite was added
}

/* -------------------------
   Schemas
   ------------------------- */
const UserSchema = new Schema<IUserDoc>({
  id: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true, unique: true },
  email: { type: String, sparse: true, unique: true, index: true }, // 🔍 Index for fast email lookups
  username: { type: String },
  passwordHash: { type: String },
  phoneNumber: { type: String },
  phoneHash: { type: String },
  isVerified: { type: Boolean, default: false },
  otp: { type: String }, // 📧 OTP for email verification
  otpExpiresAt: { type: Date }, // 📧 OTP expiry time
  verificationStatus: { type: String, enum: ['guest', 'verified'], default: 'guest', index: true },
  subscriptionLevel: { type: String, enum: ['normal', 'premium'], default: 'normal' },
  role: { type: String, enum: ['user', 'admin', 'super_admin'], default: 'user', index: true },
  status: { type: String, enum: ['active', 'banned', 'suspended'], default: 'active', index: true }, // 🔍 Index for status filtering
  coins: { type: Number, default: 0 },
  totalChats: { type: Number, default: 0 },
  dailyChats: { type: Number, default: 0 },
  lastCoinClaim: { type: Date },
  reportCount: { type: Number, default: 0 },
  gender: { type: String, enum: ['male', 'female', 'others'], default: 'others' },
  platform: { type: String, default: 'web', index: true },
  signupSource: { type: String, default: 'organic', index: true },
  campaignId: { type: String, default: 'unknown', index: true },
  signupCountryCode: { type: String, default: 'unknown', index: true },
  signupCountryName: { type: String },
  signupRegionCode: { type: String },
  signupRegionName: { type: String },
  signupSubdivisionCode: { type: String },
  signupCity: { type: String },
  signupLatitude: { type: Number },
  signupLongitude: { type: Number },
  signupAccuracyRadius: { type: Number },
  referrerUrl: { type: String },
  referrerDomain: { type: String, index: true },
  utmSource: { type: String, index: true },
  utmMedium: { type: String, index: true },
  utmCampaign: { type: String, index: true },
  utmTerm: { type: String },
  utmContent: { type: String },
  preferences: { type: Schema.Types.Mixed, default: {} },
  subscription: { type: Schema.Types.Mixed, default: {} },
  isOnline: { type: Boolean, default: false, index: true }, // 🔍 Index for active users query
  socketId: { type: String, default: null },
  activeDeviceToken: { type: String, default: null, index: true }, // 🔒🔍 Single-device session token + index for fast validation
  lastLoginDevice: { type: String, default: null }, // 🔒 Last login device info
  passwordResetToken: { type: String, default: null, index: true },
  passwordResetExpires: { type: Date },
  lastPasswordResetAt: { type: Date },
  lastActiveAt: { type: Date, index: true }, // 🔍 Index for sorting by activity
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ChatSessionSchema = new Schema<IChatSessionDoc>({
  id: { type: String, required: true, unique: true },
  user1Id: { type: String, required: true },
  user2Id: { type: String, required: true },
  mode: { type: String, enum: ['text', 'audio', 'video'], default: 'video' },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ModerationReportSchema = new Schema<IModerationReportDoc>({
  id: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true },
  reportedUserId: { type: String, required: true },
  reporterUserId: { type: String, required: true },
  violationType: { type: String, required: true },
  description: { type: String, required: true },
  evidenceUrls: [{ type: String }],
  autoDetected: { type: Boolean, default: false },
  confidenceScore: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new Schema<IMessageDoc>({
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'text' },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ChatRoomSchema = new Schema<IChatRoomDoc>({
  participants: [{ type: String }],
  type: { type: String, default: 'public' },
  status: { type: String, default: 'waiting' },
  settings: { type: Schema.Types.Mixed, default: {} },
  tags: [{ type: String }],
  endedAt: { type: Date },
  endReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BanHistorySchema = new Schema<IBanHistoryDoc>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  reportCount: { type: Number, required: true },
  banType: { type: String, enum: ['temporary', 'permanent'], required: true },
  banDuration: { type: Number }, // days
  bannedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  reason: { type: String, required: true },
  bannedBy: { type: String, default: 'auto' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const AdminSchema = new Schema<IAdminDoc>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'moderator' },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isOwner: { type: Boolean, default: false }, // NEW: Owner flag (cannot be deleted)
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const DeletedAccountSchema = new Schema<IDeletedAccountDoc>({
  userId: { type: String, required: true },
  reason: { type: String, default: 'user_request' },
  deletedBy: { type: String },
  deletedAt: { type: Date, default: Date.now },
  originalData: { type: Schema.Types.Mixed, required: true }
}, {
  collection: 'deleted_accounts',
  versionKey: false
});

DeletedAccountSchema.index({ userId: 1 }, { unique: false });
DeletedAccountSchema.index({ deletedAt: 1 });

const AdminDeletedAccountSchema = new Schema<IAdminDeletedAccountDoc>({
  userId: { type: String, required: true },
  reason: { type: String, default: 'admin_delete' },
  deletedBy: { type: String },
  adminId: { type: String },
  adminUsername: { type: String },
  deletedAt: { type: Date, default: Date.now },
  originalData: { type: Schema.Types.Mixed, required: true }
}, {
  collection: 'admin_deleted_accounts',
  versionKey: false
});

AdminDeletedAccountSchema.index({ userId: 1 }, { unique: false });
AdminDeletedAccountSchema.index({ adminId: 1 });
AdminDeletedAccountSchema.index({ deletedAt: 1 });
const AdminDeletedAccountModel: Model<IAdminDeletedAccountDoc> = mongoose.model<IAdminDeletedAccountDoc>('AdminDeletedAccount', AdminDeletedAccountSchema);

const ReportedChatTranscriptSchema = new Schema<IReportedChatTranscriptDoc>({
  sessionId: { type: String, required: true, index: true },
  reporterUserId: { type: String, required: true, index: true },
  reporterEmail: { type: String },
  reportedUserId: { type: String, required: true, index: true },
  reportedEmail: { type: String },
  mode: { type: String },
  messages: [{
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, default: 'text' },
    timestamp: { type: Date, required: true },
    replyTo: { type: Schema.Types.Mixed }
  }],
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'reported_chat_transcripts',
  versionKey: false
});

ReportedChatTranscriptSchema.index({ createdAt: 1 });
const ReportedChatTranscriptModel: Model<IReportedChatTranscriptDoc> = mongoose.model<IReportedChatTranscriptDoc>('ReportedChatTranscript', ReportedChatTranscriptSchema);

/* Shadow Login Guest Schema */
const GuestUserSchema = new Schema<IGuestUserDoc>({
  guestId: { type: String, required: true, unique: true, index: true }, // SHA-256 hash
  deviceMeta: {
    version: { type: String, required: true },
    timestamp: { type: Number, required: true },
    userAgent: { type: String, required: true },
    language: { type: String, required: true },
    timezone: { type: String, required: true },
    screenResolution: { type: String, required: true },
    colorDepth: { type: Number, required: true },
    platform: { type: String, required: true },
    doNotTrack: { type: Boolean, required: true },
    fingerprintMethod: { type: String, enum: ['fpjs', 'basic', 'random'], required: true }
  },
  sessions: { type: Number, default: 1 },
  lastSeen: { type: Date, default: () => new Date(), index: true },
  createdAt: { type: Date, default: () => new Date(), index: true },
  status: { type: String, enum: ['active', 'deleted'], default: 'active', index: true },
  notes: { type: String }
}, {
  collection: 'guest_users',
  versionKey: false
});

// Indexes for guest queries
GuestUserSchema.index({ guestId: 1, status: 1 });
GuestUserSchema.index({ lastSeen: -1 });
GuestUserSchema.index({ createdAt: -1 });
const GuestUserModel: Model<IGuestUserDoc> = mongoose.model<IGuestUserDoc>('GuestUser', GuestUserSchema);

// Favourites Schema
const FavouriteSchema = new Schema<IFavouriteDoc>({
  userId: { type: String, required: true, index: true },
  favouriteUserId: { type: String, required: true, index: true },
  favouriteUserGender: { type: String },
  favouriteUserInterests: { type: [String], default: [] },
  addedAt: { type: Date, default: Date.now, index: true }
}, {
  versionKey: false
});

// Indexes for fast lookups and prevent duplicates
FavouriteSchema.index({ userId: 1, favouriteUserId: 1 }, { unique: true }); // Prevent duplicate favourites
FavouriteSchema.index({ userId: 1, addedAt: -1 }); // Sort favourites by recent
FavouriteSchema.index({ favouriteUserId: 1 }); // Find who favourited a user

const FavouriteModel: Model<IFavouriteDoc> = mongoose.model<IFavouriteDoc>('Favourite', FavouriteSchema);

// Indexes for better query performance
BanHistorySchema.index({ userId: 1, isActive: 1 });
BanHistorySchema.index({ expiresAt: 1 });
// AdminSchema indexes already handled by unique: true in schema definition
// Removed duplicate: AdminSchema.index({ username: 1 });
// Removed duplicate: AdminSchema.index({ email: 1 });

/* -------------------------
   Models
   ------------------------- */
const UserModel: Model<IUserDoc> = mongoose.model<IUserDoc>('User', UserSchema);
const ChatSessionModel: Model<IChatSessionDoc> = mongoose.model<IChatSessionDoc>('ChatSession', ChatSessionSchema);
const ModerationReportModel: Model<IModerationReportDoc> = mongoose.model<IModerationReportDoc>('ModerationReport', ModerationReportSchema);
const MessageModel: Model<IMessageDoc> = mongoose.model<IMessageDoc>('Message', MessageSchema);
const ChatRoomModel: Model<IChatRoomDoc> = mongoose.model<IChatRoomDoc>('ChatRoom', ChatRoomSchema);
const BanHistoryModel: Model<IBanHistoryDoc> = mongoose.model<IBanHistoryDoc>('BanHistory', BanHistorySchema);
const AdminModel: Model<IAdminDoc> = mongoose.model<IAdminDoc>('Admin', AdminSchema);
const DeletedAccountModel: Model<IDeletedAccountDoc> = mongoose.model<IDeletedAccountDoc>('DeletedAccount', DeletedAccountSchema);
const CoinAdjustmentSchema = new Schema<ICoinAdjustmentDoc>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  delta: { type: Number, required: true },
  reason: { type: String },
  adminId: { type: String },
  adminUsername: { type: String },
  previousCoins: { type: Number, required: true },
  newCoins: { type: Number, required: true },
  createdAt: { type: Date, required: true, default: () => new Date() }
}, {
  versionKey: false
});

CoinAdjustmentSchema.index({ userId: 1, createdAt: -1 });

const CoinAdjustmentModel: Model<ICoinAdjustmentDoc> = mongoose.model<ICoinAdjustmentDoc>('CoinAdjustment', CoinAdjustmentSchema);

const GoalDefinitionSchema = new Schema<IGoalDefinitionDoc>({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => `goal-${new mongoose.Types.ObjectId().toString()}`
  },
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  metric: { type: String, required: true, index: true },
  targetValue: { type: Number, default: 0 },
  unit: { type: String },
  tags: { type: [String], default: [] },
  isActive: { type: Boolean, default: true, index: true },
  ownerEmail: { type: String },
  color: { type: String },
  alertThresholdPercent: { type: Number },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
}, {
  versionKey: false
});

GoalDefinitionSchema.pre('save', function goalPreSave(next) {
  this.updatedAt = new Date();
  next();
});

const GoalSnapshotSchema = new Schema<IGoalSnapshotDoc>({
  goalKey: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  value: { type: Number, required: true },
  targetValue: { type: Number, required: true },
  delta: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: () => new Date() }
}, {
  versionKey: false
});

GoalSnapshotSchema.index({ goalKey: 1, timestamp: -1 });

const AnomalyBaselineSchema = new Schema<IAnomalyBaselineDoc>({
  metric: { type: String, required: true, index: true },
  period: { type: String, required: true, index: true },
  mean: { type: Number, required: true },
  standardDeviation: { type: Number, required: true },
  sampleSize: { type: Number, required: true },
  trend: { type: Number },
  metadata: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: () => new Date(), index: true }
}, {
  versionKey: false
});

AnomalyBaselineSchema.index({ metric: 1, period: 1 }, { unique: true });

const AnomalyEventSchema = new Schema<IAnomalyEventDoc>({
  metric: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  direction: { type: String, enum: ['positive', 'negative'], required: true },
  actual: { type: Number, required: true },
  expected: { type: Number, required: true },
  zScore: { type: Number, required: true },
  baselineMean: { type: Number, required: true },
  baselineStdDev: { type: Number, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: () => new Date(), index: true }
}, {
  versionKey: false
});

AnomalyEventSchema.index({ metric: 1, timestamp: -1 });

// Topic Dice Schema - Boredom Killers Feature
interface ITopicDicePromptDoc extends Document {
  promptId: string;
  promptEn: string;
  category: 'fun' | 'safe' | 'deep' | 'flirty';
  maturityRating: 'G' | 'PG' | 'PG-13';
  localizedVariants: Map<string, string>;
  tags: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* AR Analytics */
interface IARAnalyticsDoc extends Document {
  sessionId: string;
  userId: string;
  maskType: string; // 'none' | 'sunglasses' | 'dog_ears' | 'cat_ears' | 'party_hat'
  blurEnabled: boolean;
  blurDuration: number; // seconds
  revealTime: number; // seconds from start
  isAutoReveal: boolean;
  devicePerformance: string; // 'low' | 'medium' | 'high'
  qualityPreset: string; // 'low' | 'medium' | 'high'
  avgFps: number;
  avgCpuUsage: number;
  droppedFrames: number;
  timestamp: Date;
}

const TopicDicePromptSchema = new Schema<ITopicDicePromptDoc>({
  promptId: { type: String, required: true, unique: true, index: true },
  promptEn: { type: String, required: true },
  category: { type: String, enum: ['fun', 'safe', 'deep', 'flirty'], required: true, index: true },
  maturityRating: { type: String, enum: ['G', 'PG', 'PG-13'], required: true, index: true },
  localizedVariants: { type: Map, of: String, default: {} },
  tags: { type: [String], default: [] },
  active: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
}, {
  versionKey: false
});

TopicDicePromptSchema.index({ category: 1, active: 1, maturityRating: 1 });

const ARAnalyticsSchema = new Schema<IARAnalyticsDoc>({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  maskType: { type: String, required: true, index: true },
  blurEnabled: { type: Boolean, default: false },
  blurDuration: { type: Number, default: 0 },
  revealTime: { type: Number, default: 0 },
  isAutoReveal: { type: Boolean, default: false },
  devicePerformance: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  qualityPreset: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  avgFps: { type: Number, default: 0 },
  avgCpuUsage: { type: Number, default: 0 },
  droppedFrames: { type: Number, default: 0 },
  timestamp: { type: Date, default: () => new Date(), index: true }
}, {
  versionKey: false
});

ARAnalyticsSchema.index({ sessionId: 1, userId: 1 });
ARAnalyticsSchema.index({ maskType: 1, timestamp: -1 });
ARAnalyticsSchema.index({ userId: 1, timestamp: -1 });

const TopicDicePromptModel: Model<ITopicDicePromptDoc> = mongoose.model<ITopicDicePromptDoc>('TopicDicePrompt', TopicDicePromptSchema);
const ARAnalyticsModel: Model<IARAnalyticsDoc> = mongoose.model<IARAnalyticsDoc>('ARAnalytics', ARAnalyticsSchema);
const GoalDefinitionModel: Model<IGoalDefinitionDoc> = mongoose.model<IGoalDefinitionDoc>('GoalDefinition', GoalDefinitionSchema);
const GoalSnapshotModel: Model<IGoalSnapshotDoc> = mongoose.model<IGoalSnapshotDoc>('GoalSnapshot', GoalSnapshotSchema);
const AnomalyBaselineModel: Model<IAnomalyBaselineDoc> = mongoose.model<IAnomalyBaselineDoc>('AnomalyBaseline', AnomalyBaselineSchema);
const AnomalyEventModel: Model<IAnomalyEventDoc> = mongoose.model<IAnomalyEventDoc>('AnomalyEvent', AnomalyEventSchema);

/* -------------------------
   DatabaseService
   ------------------------- */
export class DatabaseService {
  private static isConnected = false;
  // in-memory fallback stores
  private static users = new Map<string, any>();
  private static chatSessions = new Map<string, any>();
  private static messages = new Map<string, any[]>(); // roomId => messages
  private static chatRooms = new Map<string, any>();
  private static deletedAccounts = new Map<string, any>();
  private static adminDeletedAccounts = new Map<string, any>();
  private static reportedChatTranscripts = new Map<string, any>();
  private static admins = new Map<string, any>();
  private static coinAdjustments = new Map<string, any[]>();
  private static goalDefinitions = new Map<string, GoalDefinition>();
  private static goalSnapshots = new Map<string, GoalSnapshotRecord[]>();
  private static goalRecomputeTimers = new Map<string, NodeJS.Timeout>();
  private static anomalyBaselines = new Map<string, AnomalyBaselineEntry>();
  private static anomalyEvents: AnomalyEventEntry[] = [];
  private static topicDicePrompts = new Map<string, any>(); // In-memory fallback for topic dice
  private static anomalyScanTimer: NodeJS.Timeout | null = null;
  private static isRunningAnomalyScan = false;
  private static goalsSeeded = false;

  /* ---------- Connection ---------- */
  static async initialize(): Promise<void> {
    if (this.isConnected) return;

    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/omegoo';

    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI not set in environment variables. Using local MongoDB.');
    }

    try {
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 100, // 🚀 Increased from 10 to 100 for high concurrency (lakhs of users)
        minPoolSize: 10,  // 🚀 Maintain minimum 10 connections for fast response
        maxIdleTimeMS: 30000, // Close idle connections after 30s
        bufferCommands: false,
        retryWrites: true,
        retryReads: true,
      });
      this.isConnected = true;
      console.log('✅ MongoDB Atlas connected successfully');
      console.log(`🔗 Database: ${mongoose.connection.name}`);
      console.log(`🚀 Connection pool: min=10, max=100 (optimized for high traffic)`);
      await this.createIndexes();
    await this.seedOwnerAdmin();
      await this.seedDefaultGoals();
      this.ensureAnomalyScanner();
    } catch (error) {
      console.error('❌ MongoDB connection failed, falling back to in-memory:', error);
      this.isConnected = false;
      this.initializeInMemory();
      await this.seedDefaultGoals();
    }
  }

  static async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected');
    }
  }

  static async close(): Promise<void> {
    await this.disconnect();
  }

  /* ---------- Indexes ---------- */
  private static async createIndexes(): Promise<void> {
    try {
      await UserModel.collection.createIndex({ deviceId: 1 }, { unique: true });
      await UserModel.collection.createIndex({ phoneHash: 1 }, { sparse: true });
      await UserModel.collection.createIndex({ status: 1 });
      await UserModel.collection.createIndex({ isOnline: 1 });
  await UserModel.collection.createIndex({ passwordResetToken: 1 }, { sparse: true });
      await ReportedChatTranscriptModel.collection.createIndex({ sessionId: 1, createdAt: -1 });
        await GoalDefinitionModel.collection.createIndex({ key: 1 }, { unique: true });
        await GoalDefinitionModel.collection.createIndex({ metric: 1 });
        await GoalSnapshotModel.collection.createIndex({ goalKey: 1, timestamp: -1 });
        await AnomalyBaselineModel.collection.createIndex({ metric: 1, period: 1 }, { unique: true });
        await AnomalyEventModel.collection.createIndex({ metric: 1, timestamp: -1 });
      console.log('✅ MongoDB indexes created');
    } catch (error) {
      console.error('⚠️ Index creation failed:', error);
    }
  }

  /* ---------- In-memory fallback ---------- */
  private static initializeInMemory(): void {
    console.log('✅ Using in-memory fallback storage');
    // seed a test user for development convenience
    const testUser = {
      id: 'test-user-1',
      deviceId: 'dev-device-1',
      phoneHash: null,
      tier: 'guest',
      status: 'active',
      coins: 100,
      isVerified: false,
      activeDeviceToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastPasswordResetAt: null,
      preferences: { language: 'en', interests: [], genderPreference: 'any' },
      subscription: { type: 'none' },
      gender: 'others',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };
    this.users.set(testUser.id, testUser);
    this.coinAdjustments.clear();
    this.goalDefinitions.clear();
    this.goalSnapshots.clear();
    this.goalRecomputeTimers.forEach((timer) => clearTimeout(timer));
    this.goalRecomputeTimers.clear();
    this.anomalyBaselines.clear();
    this.anomalyEvents = [];
    if (this.anomalyScanTimer) {
      clearInterval(this.anomalyScanTimer);
      this.anomalyScanTimer = null;
    }
    this.goalsSeeded = false;
    this.seedDefaultGoals().catch((error) => {
      console.error('Failed to seed default goals in in-memory mode', error);
    });
  }

  /* ---------- Utility ---------- */
  private static generateId(prefix = ''): string {
    return prefix + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }

  private static async fetchSessionsInRange(start: Date, end: Date): Promise<Array<{
    id: string;
    user1Id?: string;
    user2Id?: string;
    mode: ChatMode;
    status: string;
    startedAt: Date;
    endedAt?: Date | null;
    durationSeconds?: number | null;
  }>> {
    const normalizedStart = new Date(start.getTime());
    normalizedStart.setUTCHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end.getTime());
    normalizedEnd.setUTCHours(0, 0, 0, 0);
    const windowEndExclusive = addUtcDays(normalizedEnd, 1);

    if (this.isConnected) {
      try {
        const pipeline: PipelineStage[] = [
          {
            $addFields: {
              effectiveStart: {
                $cond: [
                  { $ifNull: ['$startedAt', false] },
                  '$startedAt',
                  {
                    $cond: [
                      { $ifNull: ['$createdAt', false] },
                      '$createdAt',
                      '$updatedAt'
                    ]
                  }
                ]
              }
            }
          },
          {
            $addFields: {
              effectiveStart: {
                $cond: [
                  { $ifNull: ['$effectiveStart', false] },
                  '$effectiveStart',
                  {
                    $cond: [
                      { $ifNull: ['$updatedAt', false] },
                      '$updatedAt',
                      '$createdAt'
                    ]
                  }
                ]
              },
              effectiveEnd: {
                $cond: [
                  { $ifNull: ['$endedAt', false] },
                  '$endedAt',
                  {
                    $cond: [
                      { $ifNull: ['$updatedAt', false] },
                      '$updatedAt',
                      '$startedAt'
                    ]
                  }
                ]
              }
            }
          },
          {
            $match: {
              effectiveStart: {
                $gte: normalizedStart,
                $lt: windowEndExclusive
              }
            }
          },
          {
            $project: {
              _id: 0,
              id: { $ifNull: ['$id', { $toString: '$_id' }] },
              user1Id: 1,
              user2Id: 1,
              mode: {
                $let: {
                  vars: {
                    raw: {
                      $toLower: {
                        $trim: { input: { $ifNull: ['$mode', ''] } }
                      }
                    }
                  },
                  in: {
                    $switch: {
                      branches: [
                        { case: { $eq: ['$$raw', 'text'] }, then: 'text' },
                        { case: { $eq: ['$$raw', 'audio'] }, then: 'audio' }
                      ],
                      default: 'video'
                    }
                  }
                }
              },
              status: { $ifNull: ['$status', 'active'] },
              startedAt: '$effectiveStart',
              endedAt: '$effectiveEnd',
              durationSeconds: '$duration'
            }
          }
        ];

        const docs: Array<{
          id: string;
          user1Id?: string;
          user2Id?: string;
          mode?: string;
          status?: string;
          startedAt?: Date;
          endedAt?: Date;
          durationSeconds?: number;
        }> = await ChatSessionModel.aggregate(pipeline).exec();

        const sessions: Array<{
          id: string;
          user1Id?: string;
          user2Id?: string;
          mode: ChatMode;
          status: string;
          startedAt: Date;
          endedAt?: Date | null;
          durationSeconds?: number | null;
        }> = [];

        for (const doc of docs) {
          const startedAt = safeDateFrom(doc.startedAt);
          if (!startedAt) {
            continue;
          }
          sessions.push({
            id: doc.id,
            user1Id: doc.user1Id || undefined,
            user2Id: doc.user2Id || undefined,
            mode: normalizeChatMode(doc.mode),
            status: doc.status || 'active',
            startedAt,
            endedAt: safeDateFrom(doc.endedAt),
            durationSeconds: Number.isFinite(doc.durationSeconds) ? Number(doc.durationSeconds) : null
          });
        }

        return sessions;
      } catch (error) {
        console.error('MongoDB fetchSessionsInRange failed, using in-memory fallback:', error);
      }
    }

    const fallback: Array<{
      id: string;
      user1Id?: string;
      user2Id?: string;
      mode: ChatMode;
      status: string;
      startedAt: Date;
      endedAt?: Date | null;
      durationSeconds?: number | null;
    }> = [];

    for (const session of this.chatSessions.values()) {
      const startedAt = safeDateFrom(session.startedAt ?? session.createdAt ?? session.updatedAt);
      if (!startedAt || startedAt < normalizedStart || startedAt >= windowEndExclusive) {
        continue;
      }

      fallback.push({
        id: session.id,
        user1Id: session.user1Id,
        user2Id: session.user2Id,
        mode: normalizeChatMode(session.mode),
        status: session.status || 'active',
        startedAt,
        endedAt: safeDateFrom(session.endedAt ?? session.updatedAt ?? null),
        durationSeconds: Number.isFinite(session.durationSeconds ?? session.duration)
          ? Number(session.durationSeconds ?? session.duration)
          : null
      });
    }

    return fallback;
  }

  private static async buildUserLookup(userIds: Set<string>): Promise<Map<string, any>> {
    const lookup = new Map<string, any>();
    if (!userIds || userIds.size === 0) {
      return lookup;
    }

    const ids = Array.from(userIds).filter((id) => typeof id === 'string' && id);
    if (!ids.length) {
      return lookup;
    }

    if (this.isConnected) {
      try {
        const docs = await UserModel.find({ id: { $in: ids } }).lean();
        for (const doc of docs) {
          const normalized = this.mongoUserToUser(doc);
          if (normalized?.id) {
            lookup.set(normalized.id, normalized);
          }
        }
      } catch (error) {
        console.error('MongoDB buildUserLookup failed, using fallback:', error);
      }
    }

    if (lookup.size !== ids.length) {
      for (const id of ids) {
        if (!lookup.has(id)) {
          const user = this.users.get(id);
          if (user) {
            lookup.set(id, user);
          }
        }
      }
    }

    return lookup;
  }

  private static cloneGoalDefinition(definition: GoalDefinition): GoalDefinition {
    return {
      ...definition,
      tags: [...(definition.tags ?? [])],
      metadata: definition.metadata ? { ...definition.metadata } : undefined,
      createdAt: new Date(definition.createdAt),
      updatedAt: new Date(definition.updatedAt)
    };
  }

  private static ensureGoalTags(tags?: string[]): string[] {
    if (!tags || !tags.length) {
      return [];
    }
    const unique = new Set<string>();
    tags.forEach((tag) => {
      if (!tag) {
        return;
      }
      const normalized = String(tag).trim().toLowerCase();
      if (normalized) {
        unique.add(normalized);
      }
    });
    return Array.from(unique);
  }

  private static mongoGoalToDefinition(doc: any): GoalDefinition {
    return {
      id: doc.id || doc._id?.toString?.() || this.generateId('goal-'),
      key: doc.key || this.generateId('goal-'),
      name: doc.name || doc.key || 'goal',
      description: doc.description || undefined,
      metric: doc.metric || 'custom',
      targetValue: Number.isFinite(doc.targetValue) ? Number(doc.targetValue) : 0,
      unit: doc.unit || undefined,
      tags: Array.isArray(doc.tags) ? this.ensureGoalTags(doc.tags as string[]) : [],
      isActive: doc.isActive !== false,
      ownerEmail: doc.ownerEmail || undefined,
      color: doc.color || undefined,
      alertThresholdPercent: Number.isFinite(doc.alertThresholdPercent) ? Number(doc.alertThresholdPercent) : undefined,
      metadata: doc.metadata ? { ...doc.metadata } : undefined,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt : doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : doc.updatedAt ? new Date(doc.updatedAt) : new Date()
    };
  }

  private static mongoSnapshotToRecord(doc: any): GoalSnapshotRecord {
    const timestamp = doc.timestamp instanceof Date ? doc.timestamp : doc.timestamp ? new Date(doc.timestamp) : new Date();
    return {
      goalKey: doc.goalKey || 'unknown',
      timestamp,
      value: Number.isFinite(doc.value) ? Number(doc.value) : 0,
      targetValue: Number.isFinite(doc.targetValue) ? Number(doc.targetValue) : 0,
      delta: Number.isFinite(doc.delta) ? Number(doc.delta) : 0,
      metadata: doc.metadata ? { ...doc.metadata } : undefined
    };
  }

  private static mongoBaselineToEntry(doc: any): AnomalyBaselineEntry {
    const updatedAt = doc.updatedAt instanceof Date ? doc.updatedAt : doc.updatedAt ? new Date(doc.updatedAt) : new Date();
    return {
      metric: doc.metric || 'unknown',
      period: (doc.period as GoalTimeseriesInterval | 'hour') || 'day',
      mean: Number.isFinite(doc.mean) ? Number(doc.mean) : 0,
      standardDeviation: Number.isFinite(doc.standardDeviation) ? Number(doc.standardDeviation) : 0,
      sampleSize: Number.isFinite(doc.sampleSize) ? Number(doc.sampleSize) : 0,
      trend: Number.isFinite(doc.trend) ? Number(doc.trend) : undefined,
      metadata: doc.metadata ? { ...doc.metadata } : undefined,
      updatedAt: updatedAt.toISOString()
    };
  }

  private static mongoAnomalyToEntry(doc: any): AnomalyEventEntry {
    const timestamp = doc.timestamp instanceof Date ? doc.timestamp : doc.timestamp ? new Date(doc.timestamp) : new Date();
    return {
      id: doc._id?.toString?.() || this.generateId('anomaly-'),
      metric: doc.metric || 'unknown',
      timestamp: timestamp.toISOString(),
      severity: (doc.severity as 'low' | 'medium' | 'high') || 'low',
      direction: (doc.direction as 'positive' | 'negative') || 'positive',
      actual: Number.isFinite(doc.actual) ? Number(doc.actual) : 0,
      expected: Number.isFinite(doc.expected) ? Number(doc.expected) : 0,
      zScore: Number.isFinite(doc.zScore) ? Number(doc.zScore) : 0,
      baselineMean: Number.isFinite(doc.baselineMean) ? Number(doc.baselineMean) : 0,
      baselineStdDev: Number.isFinite(doc.baselineStdDev) ? Number(doc.baselineStdDev) : 0,
      metadata: doc.metadata ? { ...doc.metadata } : undefined
    };
  }

  private static storeGoalDefinition(definition: GoalDefinition): GoalDefinition {
    const normalized = this.cloneGoalDefinition({
      ...definition,
      tags: this.ensureGoalTags(definition.tags)
    });
    this.goalDefinitions.set(normalized.key, normalized);
    return this.cloneGoalDefinition(normalized);
  }

  private static getGoalSnapshots(goalKey: string): GoalSnapshotRecord[] {
    const existing = this.goalSnapshots.get(goalKey) ?? [];
    return existing.map((snapshot) => ({
      goalKey: snapshot.goalKey,
      timestamp: new Date(snapshot.timestamp),
      value: snapshot.value,
      targetValue: snapshot.targetValue,
      delta: snapshot.delta ?? 0,
      metadata: snapshot.metadata ? { ...snapshot.metadata } : undefined
    }));
  }

  private static storeGoalSnapshot(snapshot: GoalSnapshotRecord): void {
    const sanitizedTimestamp = snapshot.timestamp instanceof Date ? new Date(snapshot.timestamp) : new Date(snapshot.timestamp);
    const existing = this.goalSnapshots.get(snapshot.goalKey) ?? [];
    const previous = existing.length ? existing[existing.length - 1] : null;
    const delta = Number.isFinite(snapshot.delta ?? NaN)
      ? Number(snapshot.delta)
      : previous
        ? snapshot.value - previous.value
        : snapshot.value;

    const record: GoalSnapshotRecord = {
      goalKey: snapshot.goalKey,
      timestamp: sanitizedTimestamp,
      value: Math.round(snapshot.value * 100) / 100,
      targetValue: Math.round(snapshot.targetValue * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      metadata: snapshot.metadata ? { ...snapshot.metadata } : undefined
    };

    const next = [...existing, record].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const trimmed = next.length > 720 ? next.slice(next.length - 720) : next;
    this.goalSnapshots.set(snapshot.goalKey, trimmed);
  }

  private static normalizeGoalKey(key?: string | null): string {
    const base = typeof key === 'string'
      ? key
      : key !== undefined && key !== null
        ? String(key)
        : '';

    return base
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      || this.generateId('goal-');
  }

  private static async fetchGoalDefinition(goalKey: string): Promise<GoalDefinition | null> {
    const normalized = this.normalizeGoalKey(goalKey);
    const cached = this.goalDefinitions.get(normalized);
    if (cached) {
      return this.cloneGoalDefinition(cached);
    }

    if (this.isConnected) {
      const doc = await GoalDefinitionModel.findOne({ key: normalized }).lean();
      if (doc) {
        const definition = this.mongoGoalToDefinition(doc);
        this.storeGoalDefinition(definition);
        return definition;
      }
    }

    return null;
  }

  private static async fetchLatestGoalSnapshot(goalKey: string): Promise<GoalSnapshotRecord | null> {
    if (this.isConnected) {
      const doc = await GoalSnapshotModel.findOne({ goalKey }).sort({ timestamp: -1 }).lean();
      if (doc) {
        return this.mongoSnapshotToRecord(doc);
      }
    }

    const snapshots = this.goalSnapshots.get(goalKey) ?? [];
    return snapshots.length ? this.mongoSnapshotToRecord(snapshots[snapshots.length - 1]) : null;
  }

  private static scheduleGoalRecompute(goalKey: string, delayMs = 500): void {
    const existingTimer = this.goalRecomputeTimers.get(goalKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    const timer = setTimeout(() => {
      this.goalRecomputeTimers.delete(goalKey);
      this.recomputeGoal(goalKey).catch((error) => {
        console.error('Goal recompute failed', { goalKey, error });
      });
    }, Math.max(100, delayMs));
    this.goalRecomputeTimers.set(goalKey, timer);
  }

  private static async recomputeGoal(goalKey: string): Promise<void> {
    const goal = await this.fetchGoalDefinition(goalKey);
    if (!goal || !goal.isActive) {
      return;
    }

    const computation = await this.computeGoalValue(goal);
    const previous = await this.fetchLatestGoalSnapshot(goalKey);
    const delta = previous ? computation.value - previous.value : computation.value;
    const snapshot: GoalSnapshotRecord = {
      goalKey,
      timestamp: new Date(),
      value: computation.value,
      targetValue: goal.targetValue,
      delta,
      metadata: computation.metadata
    };

    this.storeGoalSnapshot(snapshot);

    if (this.isConnected) {
      await GoalSnapshotModel.create({
        goalKey,
        timestamp: snapshot.timestamp,
        value: snapshot.value,
        targetValue: snapshot.targetValue,
        delta: snapshot.delta ?? 0,
        metadata: snapshot.metadata,
        createdAt: snapshot.timestamp
      });
    }
  }

  private static async computeGoalValue(goal: GoalDefinition): Promise<{ value: number; metadata?: Record<string, any> }> {
    if (this.isConnected) {
      switch (goal.metric) {
        case 'coins': {
          const result = await UserModel.aggregate([
            {
              $group: {
                _id: null,
                totalCoins: { $sum: { $ifNull: ['$coins', 0] } },
                totalUsers: { $sum: 1 }
              }
            }
          ]);
          const totals = result[0] || { totalCoins: 0, totalUsers: 0 };
          return {
            value: totals.totalCoins ?? 0,
            metadata: {
              totalUsers: totals.totalUsers ?? 0
            }
          };
        }
        case 'profile_completion': {
          const result = await UserModel.aggregate([
            {
              $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                verifiedUsers: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ['$verificationStatus', 'verified'] },
                          { $eq: ['$isVerified', true] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                profileRich: {
                  $sum: {
                    $cond: [
                      {
                        $gte: [
                          { $size: { $ifNull: ['$preferences.interests', []] } },
                          3
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]);
          const totals = result[0] || { totalUsers: 0, verifiedUsers: 0, profileRich: 0 };
          const totalUsers = totals.totalUsers || 0;
          const completionRate = totalUsers > 0 ? (totals.verifiedUsers / totalUsers) * 100 : 0;
          return {
            value: Math.round(completionRate * 100) / 100,
            metadata: {
              verifiedUsers: totals.verifiedUsers || 0,
              profileRichUsers: totals.profileRich || 0,
              totalUsers
            }
          };
        }
        case 'matches': {
          const [completed, active] = await Promise.all([
            ChatSessionModel.countDocuments({ status: 'ended' }),
            ChatSessionModel.countDocuments({ status: { $ne: 'ended' } })
          ]);
          return {
            value: completed,
            metadata: {
              completedSessions: completed,
              activeSessions: active,
              totalSessions: completed + active
            }
          };
        }
        default:
          break;
      }
    }

    switch (goal.metric) {
      case 'coins': {
        const totals = Array.from(this.users.values()).reduce(
          (acc, user: any) => {
            acc.totalCoins += user.coins ?? 0;
            acc.totalUsers += 1;
            return acc;
          },
          { totalCoins: 0, totalUsers: 0 }
        );
        return {
          value: totals.totalCoins,
          metadata: {
            totalUsers: totals.totalUsers
          }
        };
      }
      case 'profile_completion': {
        let verifiedUsers = 0;
        let profileRichUsers = 0;
        this.users.forEach((user: any) => {
          if (user.verificationStatus === 'verified' || user.isVerified) {
            verifiedUsers += 1;
          }
          if ((user.preferences?.interests?.length ?? 0) >= 3) {
            profileRichUsers += 1;
          }
        });
        const totalUsers = this.users.size || 1;
        const completionRate = (verifiedUsers / totalUsers) * 100;
        return {
          value: Math.round(completionRate * 100) / 100,
          metadata: {
            verifiedUsers,
            profileRichUsers,
            totalUsers
          }
        };
      }
      case 'matches': {
        let completed = 0;
        let active = 0;
        this.chatSessions.forEach((session) => {
          if (session.status === 'ended') {
            completed += 1;
          } else {
            active += 1;
          }
        });
        return {
          value: completed,
          metadata: {
            completedSessions: completed,
            activeSessions: active,
            totalSessions: this.chatSessions.size
          }
        };
      }
      default: {
        const snapshots = this.goalSnapshots.get(goal.key) ?? [];
        const latest = snapshots.length ? snapshots[snapshots.length - 1] : null;
        return {
          value: latest?.value ?? 0,
          metadata: {
            source: 'manual'
          }
        };
      }
    }
  }

  private static baselineKey(metric: string, period: GoalTimeseriesInterval | 'hour'): string {
    return `${metric}:${period}`;
  }

  private static async collectAnomalySeries(metric: string, options: { hours?: number; period?: GoalTimeseriesInterval | 'hour' } = {}): Promise<Array<{ timestamp: Date; actual: number }>> {
    const { hours = 48, period = 'hour' } = options;
    const since = new Date(Date.now() - Math.max(1, hours) * 60 * 60 * 1000);

    if (this.isConnected) {
      switch (metric) {
        case 'matches': {
          const pipeline: PipelineStage[] = [
            {
              $match: {
                createdAt: { $gte: since }
              }
            },
            {
              $project: {
                hourBucket: {
                  $dateToString: {
                    format: '%Y-%m-%dT%H:00:00Z',
                    date: '$createdAt'
                  }
                }
              }
            },
            {
              $group: {
                _id: '$hourBucket',
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ];

          const results = await ChatSessionModel.aggregate(pipeline);
          return results.map((entry: any) => ({
            timestamp: new Date(entry._id),
            actual: entry.count ?? 0
          }));
        }
        case 'coins': {
          const pipeline: PipelineStage[] = [
            {
              $match: {
                updatedAt: { $gte: since }
              }
            },
            {
              $project: {
                hourBucket: {
                  $dateToString: {
                    format: '%Y-%m-%dT%H:00:00Z',
                    date: '$updatedAt'
                  }
                },
                coins: '$coins'
              }
            },
            {
              $group: {
                _id: '$hourBucket',
                totalCoins: { $sum: { $ifNull: ['$coins', 0] } },
                sampleSize: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ];

          const results = await UserModel.aggregate(pipeline);
          return results.map((entry: any) => ({
            timestamp: new Date(entry._id),
            actual: entry.totalCoins ?? 0
          }));
        }
        default:
          break;
      }
    }

    const now = Date.now();
    const series: Array<{ timestamp: Date; actual: number }> = [];
    for (let index = hours; index >= 0; index -= 1) {
      const timestamp = new Date(now - index * 60 * 60 * 1000);
      let actual = 0;
      switch (metric) {
        case 'matches': {
          this.chatSessions.forEach((session) => {
            if (session.createdAt && session.createdAt >= since) {
              actual += 1;
            }
          });
          break;
        }
        case 'coins': {
          this.users.forEach((user: any) => {
            actual += user.coins ?? 0;
          });
          break;
        }
        default: {
          const goal = this.goalSnapshots.get(metric)?.slice(-1)[0];
          actual = goal?.value ?? 0;
          break;
        }
      }

      series.push({ timestamp, actual });
    }
    return series;
  }

  private static async loadGoalSnapshotsFromDb(goalKeys: string[], windowStart?: Date, windowEnd?: Date, historyDays = 45): Promise<Map<string, GoalSnapshotRecord[]>> {
    const result = new Map<string, GoalSnapshotRecord[]>();

    if (!goalKeys.length) {
      return result;
    }

    if (!this.isConnected) {
      goalKeys.forEach((key) => {
        const snapshots = this.goalSnapshots.get(key) ?? [];
        result.set(key, snapshots.map((snapshot) => ({
          goalKey: snapshot.goalKey,
          timestamp: new Date(snapshot.timestamp),
          value: snapshot.value,
          targetValue: snapshot.targetValue,
          delta: snapshot.delta ?? 0,
          metadata: snapshot.metadata ? { ...snapshot.metadata } : undefined
        })));
      });
      return result;
    }

    const horizonStart = windowStart
      ? new Date(windowStart.getTime() - Math.max(0, historyDays) * DAY_MS)
      : new Date(Date.now() - Math.max(0, historyDays) * DAY_MS);

    const query: any = {
      goalKey: { $in: goalKeys }
    };

    if (windowEnd || horizonStart) {
      query.timestamp = {};
      if (horizonStart) {
        query.timestamp.$gte = horizonStart;
      }
      if (windowEnd) {
        query.timestamp.$lt = windowEnd;
      }
    }

    const docs = await GoalSnapshotModel.find(query).sort({ goalKey: 1, timestamp: 1 }).lean();

    docs.forEach((doc: any) => {
      const record = this.mongoSnapshotToRecord(doc);
      const collection = result.get(record.goalKey) ?? [];
      collection.push(record);
      result.set(record.goalKey, collection);
    });

    return result;
  }

  private static async runAnomalyScan(): Promise<void> {
    if (this.isRunningAnomalyScan) {
      return;
    }
    this.isRunningAnomalyScan = true;

    const metrics = ['matches', 'coins'];

    try {
      for (const metric of metrics) {
        const series = await this.collectAnomalySeries(metric, { hours: 72, period: 'hour' });
        if (!series.length) {
          continue;
        }

        const values = series.map((point) => point.actual);
        const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
        const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / Math.max(1, values.length - 1);
        const stdDev = Math.sqrt(variance);

        const baselineDoc = {
          metric,
          period: 'hour' as const,
          mean,
          standardDeviation: stdDev,
          sampleSize: values.length,
          trend: values.length > 1 ? values[values.length - 1] - values[0] : 0,
          metadata: {
            windowHours: 72
          },
          updatedAt: new Date()
        };

        const lastPoint = series[series.length - 1];
        const zScore = stdDev > 0 ? (lastPoint.actual - mean) / stdDev : 0;
        const deviationPercent = mean !== 0 ? Math.abs((lastPoint.actual - mean) / mean) * 100 : 0;

        const baselineKeyValue = this.baselineKey(metric, 'hour');

        if (this.isConnected) {
          await AnomalyBaselineModel.findOneAndUpdate(
            { metric, period: 'hour' },
            baselineDoc,
            { upsert: true, new: true }
          );

          this.anomalyBaselines.set(baselineKeyValue, this.mongoBaselineToEntry(baselineDoc));

          if (Math.abs(zScore) >= 3 || deviationPercent >= 50) {
            const event: AnomalyEventEntry = {
              id: this.generateId('anomaly-'),
              metric,
              timestamp: baselineDoc.updatedAt.toISOString(),
              severity: Math.abs(zScore) >= 5 || deviationPercent >= 150 ? 'high' : Math.abs(zScore) >= 4 || deviationPercent >= 100 ? 'medium' : 'low',
              direction: lastPoint.actual >= mean ? 'positive' : 'negative',
              actual: lastPoint.actual,
              expected: mean,
              zScore,
              baselineMean: mean,
              baselineStdDev: stdDev,
              metadata: {
                deviationPercent,
                sampleSize: values.length
              }
            };

            await AnomalyEventModel.create({
              metric: event.metric,
              timestamp: new Date(event.timestamp),
              severity: event.severity,
              direction: event.direction,
              actual: event.actual,
              expected: event.expected,
              zScore: event.zScore,
              baselineMean: event.baselineMean,
              baselineStdDev: event.baselineStdDev,
              metadata: event.metadata,
              createdAt: new Date()
            });

            this.anomalyEvents.unshift(event);
            if (this.anomalyEvents.length > 250) {
              this.anomalyEvents = this.anomalyEvents.slice(0, 250);
            }
          }
        } else {
          this.anomalyBaselines.set(baselineKeyValue, this.mongoBaselineToEntry(baselineDoc));

          if (Math.abs(zScore) >= 3 || deviationPercent >= 50) {
            const event: AnomalyEventEntry = {
              id: this.generateId('anomaly-'),
              metric,
              timestamp: baselineDoc.updatedAt.toISOString(),
              severity: Math.abs(zScore) >= 5 || deviationPercent >= 150 ? 'high' : Math.abs(zScore) >= 4 || deviationPercent >= 100 ? 'medium' : 'low',
              direction: lastPoint.actual >= mean ? 'positive' : 'negative',
              actual: lastPoint.actual,
              expected: mean,
              zScore,
              baselineMean: mean,
              baselineStdDev: stdDev,
              metadata: {
                deviationPercent,
                sampleSize: values.length
              }
            };

            this.anomalyEvents.unshift(event);
            if (this.anomalyEvents.length > 250) {
              this.anomalyEvents = this.anomalyEvents.slice(0, 250);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to run anomaly scan', error);
    } finally {
      this.isRunningAnomalyScan = false;
    }
  }

  private static ensureAnomalyScanner(): void {
    if (this.anomalyScanTimer) {
      return;
    }

    const interval = setInterval(() => {
      this.runAnomalyScan().catch((error) => {
        console.error('Anomaly scan interval failed', error);
      });
    }, 5 * 60 * 1000);

    interval.unref?.();
    this.anomalyScanTimer = interval;
  }

  private static async seedDefaultGoals(): Promise<void> {
    if (this.goalsSeeded) {
      return;
    }

    const defaults: GoalDefinitionInput[] = [
      {
        key: 'daily_matches',
        name: 'Daily Matches',
        description: 'Completed match sessions per day',
        metric: 'matches',
        targetValue: 100,
        unit: 'sessions',
        tags: ['matching', 'engagement'],
        isActive: true,
        alertThresholdPercent: 40
      },
      {
        key: 'coin_reserve',
        name: 'Coin Reserve',
        description: 'Total coins held by users',
        metric: 'coins',
        targetValue: 5000,
        unit: 'coins',
        tags: ['monetization'],
        isActive: true,
        alertThresholdPercent: 35
      },
      {
        key: 'profile_completion',
        name: 'Verified Profiles',
        description: 'Percentage of verified users',
        metric: 'profile_completion',
        targetValue: 60,
        unit: 'percent',
        tags: ['trust', 'safety'],
        isActive: true,
        alertThresholdPercent: 30
      }
    ];

    const existingDefinitions = this.isConnected
      ? await GoalDefinitionModel.find({}).lean()
      : Array.from(this.goalDefinitions.values()).map((value) => this.cloneGoalDefinition(value));

    if (this.isConnected) {
      const backfillTargets = (existingDefinitions as Array<{ _id?: mongoose.Types.ObjectId | string; id?: string; key?: string }>).filter((definition) => !definition.id);
      if (backfillTargets.length) {
        for (const definition of backfillTargets) {
          const generatedId = this.generateId('goal-');
          try {
            const filter = definition._id
              ? { _id: definition._id }
              : definition.key
                ? { key: definition.key }
                : null;

            if (filter) {
              await GoalDefinitionModel.updateOne(filter, { $set: { id: generatedId } });
            }

            definition.id = generatedId;
          } catch (error) {
            console.error('Failed to backfill goal definition id', { key: definition?.key, error });
          }
        }
      }
    }

    const existingKeys = new Set(existingDefinitions.map((definition: any) => this.normalizeGoalKey(definition?.key)));

    for (const definition of defaults) {
      const normalizedKey = this.normalizeGoalKey(definition.key);
      if (existingKeys.has(normalizedKey)) {
        continue;
      }

      const now = new Date();
      const goal: GoalDefinition = {
        id: this.generateId('goal-'),
        key: normalizedKey,
        name: definition.name,
        description: definition.description,
        metric: definition.metric ?? 'custom',
        targetValue: definition.targetValue ?? 0,
        unit: definition.unit,
        tags: this.ensureGoalTags(definition.tags),
        isActive: definition.isActive !== false,
        ownerEmail: definition.ownerEmail,
        color: definition.color,
        alertThresholdPercent: definition.alertThresholdPercent,
        metadata: definition.metadata,
        createdAt: now,
        updatedAt: now
      };

      this.storeGoalDefinition(goal);

      if (this.isConnected) {
        await GoalDefinitionModel.create({
          id: goal.id,
          key: goal.key,
          name: goal.name,
          description: goal.description,
          metric: goal.metric,
          targetValue: goal.targetValue,
          unit: goal.unit,
          tags: goal.tags,
          isActive: goal.isActive,
          ownerEmail: goal.ownerEmail,
          color: goal.color,
          alertThresholdPercent: goal.alertThresholdPercent,
          metadata: goal.metadata,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt
        });
      }

      this.scheduleGoalRecompute(goal.key, 2000 + Math.random() * 2000);
    }

    this.goalsSeeded = true;
  }

  private static async ensureGoalsSeeded(): Promise<void> {
    if (this.goalsSeeded) {
      return;
    }
    await this.seedDefaultGoals();
  }

  private static rememberCoinAdjustment(record: any): void {
    const history = this.coinAdjustments.get(record.userId) || [];
    history.unshift(record);
    this.coinAdjustments.set(record.userId, history.slice(0, 100));
  }

  private static normalizeUserClassification(input: Partial<IUserDoc> & { tier?: string } = {}) {
    const tier = input.tier;

    const role: 'user' | 'admin' | 'super_admin' = (() => {
      if (input.role === 'super_admin' || tier === 'super_admin') return 'super_admin';
      if (input.role === 'admin' || tier === 'admin') return 'admin';
      return 'user';
    })();

    const verificationStatus: 'guest' | 'verified' = (() => {
      if (input.verificationStatus === 'verified') return 'verified';
      if (input.isVerified) return 'verified';
      if (tier === 'verified' || tier === 'premium' || tier === 'admin' || tier === 'super_admin') {
        return 'verified';
      }
      return 'guest';
    })();

    const subscriptionLevel: 'normal' | 'premium' = (() => {
      if (input.subscriptionLevel === 'premium') return 'premium';
      if (tier === 'premium') return 'premium';
      return 'normal';
    })();

    return { role, verificationStatus, subscriptionLevel };
  }

  private static mongoUserToUser(mongoUser: any) {
    if (!mongoUser) return null;

    const verificationStatus: 'guest' | 'verified' = (mongoUser.verificationStatus === 'verified' || mongoUser.isVerified)
      ? 'verified'
      : 'guest';
    const subscriptionLevel: 'normal' | 'premium' = mongoUser.subscriptionLevel === 'premium' ? 'premium' : 'normal';
    const role: 'user' | 'admin' | 'super_admin' =
      mongoUser.role === 'super_admin'
        ? 'super_admin'
        : mongoUser.role === 'admin'
          ? 'admin'
          : 'user';

    const legacyTier = (() => {
      if (role === 'super_admin') return 'super_admin';
      if (role === 'admin') return 'admin';
      if (subscriptionLevel === 'premium') return 'premium';
      if (verificationStatus === 'verified') return 'verified';
      return 'guest';
    })();

    return {
      id: mongoUser.id || mongoUser._id?.toString(),
      deviceId: mongoUser.deviceId,
      email: mongoUser.email,
      username: mongoUser.username,
      passwordHash: mongoUser.passwordHash,
      phoneHash: mongoUser.phoneHash,
      phoneNumber: mongoUser.phoneNumber,
      verificationStatus,
      subscriptionLevel,
      role,
      tier: mongoUser.tier || legacyTier,
      status: mongoUser.status,
      coins: mongoUser.coins,
      totalChats: mongoUser.totalChats || 0,
      dailyChats: mongoUser.dailyChats || 0,
      lastCoinClaim: mongoUser.lastCoinClaim,
      isVerified: mongoUser.isVerified,
      gender: (mongoUser as any).gender || 'others',
      platform: mongoUser.platform || 'web',
      signupSource: mongoUser.signupSource || 'organic',
      campaignId: mongoUser.campaignId || 'unknown',
      signupCountryCode: mongoUser.signupCountryCode || 'unknown',
      signupCountryName: mongoUser.signupCountryName,
      signupRegionCode: mongoUser.signupRegionCode,
      signupRegionName: mongoUser.signupRegionName,
      signupSubdivisionCode: mongoUser.signupSubdivisionCode,
      signupCity: mongoUser.signupCity,
      signupLatitude: mongoUser.signupLatitude,
      signupLongitude: mongoUser.signupLongitude,
      signupAccuracyRadius: mongoUser.signupAccuracyRadius,
      referrerUrl: mongoUser.referrerUrl,
      referrerDomain: mongoUser.referrerDomain,
      utmSource: mongoUser.utmSource,
      utmMedium: mongoUser.utmMedium,
      utmCampaign: mongoUser.utmCampaign,
      utmTerm: mongoUser.utmTerm,
      utmContent: mongoUser.utmContent,
      // Session & verification related fields (kept optional in returned shape)
      activeDeviceToken: (mongoUser as any).activeDeviceToken || null,
      lastLoginDevice: (mongoUser as any).lastLoginDevice || null,
      passwordResetToken: (mongoUser as any).passwordResetToken || null,
      passwordResetExpires: (mongoUser as any).passwordResetExpires || null,
      lastPasswordResetAt: (mongoUser as any).lastPasswordResetAt || null,
      otp: (mongoUser as any).otp,
      otpExpiresAt: (mongoUser as any).otpExpiresAt,
      preferences: mongoUser.preferences,
      subscription: mongoUser.subscription,
      isOnline: mongoUser.isOnline,
      socketId: mongoUser.socketId,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt,
      lastActiveAt: mongoUser.lastActiveAt || mongoUser.updatedAt
    };
  }

  private static isNewDay(lastClaim: Date | null, now: Date): boolean {
    if (!lastClaim) return true;
    return lastClaim.toDateString() !== now.toDateString();
  }

  private static async ensureDailyReset(user: any): Promise<any> {
    if (!user) return null;

    const now = new Date();
    const lastClaim = user.lastCoinClaim ? new Date(user.lastCoinClaim) : null;
    const userId = user.id || user._id?.toString();
    if (!userId) {
      return user;
    }

    if (!lastClaim) {
      const migrationUpdates = {
        lastCoinClaim: now,
        dailyChats: user.dailyChats ?? 0,
        totalChats: user.totalChats ?? 0,
        updatedAt: now
      };

      if (this.isConnected) {
        await UserModel.updateOne({ id: userId }, { $set: migrationUpdates });
      } else if (this.users.has(userId)) {
        const stored = this.users.get(userId);
        Object.assign(stored, migrationUpdates);
        this.users.set(userId, stored);
      }

      return { ...user, ...migrationUpdates };
    }

    if (!this.isNewDay(lastClaim, now)) {
      return user;
    }

    const currentCoins = sanitizeCoinBalance(user.coins);
    const refillTarget = Math.max(currentCoins, DAILY_REFILL_COINS);

    const updates = {
      coins: refillTarget,
      dailyChats: 0,
      lastCoinClaim: now,
      updatedAt: now
    };

    if (this.isConnected) {
      await UserModel.updateOne({ id: userId }, { $set: updates });
    } else if (this.users.has(userId)) {
      const stored = this.users.get(userId);
      Object.assign(stored, updates);
      this.users.set(userId, stored);
    }

    return { ...user, ...updates };
  }

  /* ---------- User operations ---------- */
  static async createUser(userData: Partial<IUserDoc>): Promise<any> {
    const classification = this.normalizeUserClassification(userData as Partial<IUserDoc> & { tier?: string });
    const isVerified = userData.isVerified ?? classification.verificationStatus === 'verified';

    if (this.isConnected) {
      try {
        const userDoc = new UserModel({
          id: this.generateId('user-'),
          deviceId: userData.deviceId,
          email: userData.email,
          username: userData.username,
          passwordHash: userData.passwordHash,
          phoneNumber: userData.phoneNumber,
          phoneHash: userData.phoneHash,
          isVerified,
          verificationStatus: classification.verificationStatus,
          subscriptionLevel: classification.subscriptionLevel,
          role: classification.role,
          status: userData.status ?? 'active',
          coins: userData.coins ?? 50,
          totalChats: userData.totalChats ?? 0,
          dailyChats: userData.dailyChats ?? 0,
          lastCoinClaim: userData.lastCoinClaim ?? new Date(),
          gender: userData.gender ?? 'others',
          platform: userData.platform ?? 'web',
          signupSource: userData.signupSource ?? 'organic',
          campaignId: userData.campaignId ?? 'unknown',
          signupCountryCode: userData.signupCountryCode ?? 'unknown',
          signupCountryName: userData.signupCountryName,
          signupRegionCode: userData.signupRegionCode,
          signupRegionName: userData.signupRegionName,
          signupSubdivisionCode: userData.signupSubdivisionCode,
          signupCity: userData.signupCity,
          signupLatitude: typeof userData.signupLatitude === 'number' ? userData.signupLatitude : undefined,
          signupLongitude: typeof userData.signupLongitude === 'number' ? userData.signupLongitude : undefined,
          signupAccuracyRadius: typeof userData.signupAccuracyRadius === 'number' ? userData.signupAccuracyRadius : undefined,
          referrerUrl: userData.referrerUrl,
          referrerDomain: userData.referrerDomain,
          utmSource: userData.utmSource,
          utmMedium: userData.utmMedium,
          utmCampaign: userData.utmCampaign,
          utmTerm: userData.utmTerm,
          utmContent: userData.utmContent,
          // Store OTP fields when provided (email verification flow)
          otp: (userData as any).otp,
          otpExpiresAt: (userData as any).otpExpiresAt,
          // Session fields (optional on creation)
          activeDeviceToken: (userData as any).activeDeviceToken || null,
          lastLoginDevice: (userData as any).lastLoginDevice || null,
          passwordResetToken: (userData as any).passwordResetToken || null,
          passwordResetExpires: (userData as any).passwordResetExpires || null,
          lastPasswordResetAt: (userData as any).lastPasswordResetAt || null,
          preferences: userData.preferences ?? {},
          subscription: userData.subscription ?? {},
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActiveAt: new Date()
        });
        await userDoc.save();
        console.log('✅ User saved to MongoDB:', { id: userDoc.id, email: userDoc.email, username: userDoc.username });
        return this.mongoUserToUser(userDoc);
      } catch (err) {
        console.error('❌ MongoDB createUser failed, fallback to in-memory:', err);
      }
    }

    // in-memory fallback
    const id = this.generateId('user-');
    const legacyTier = userData.tier
      || (classification.role === 'super_admin' ? 'super_admin'
        : classification.role === 'admin' ? 'admin'
          : classification.subscriptionLevel === 'premium' ? 'premium'
            : classification.verificationStatus === 'verified' ? 'verified' : 'guest');

    const newUser = {
      id,
      deviceId: userData.deviceId!,
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
      phoneNumber: userData.phoneNumber,
      phoneHash: userData.phoneHash,
      isVerified,
      verificationStatus: classification.verificationStatus,
      subscriptionLevel: classification.subscriptionLevel,
      role: classification.role,
      tier: legacyTier,
      status: userData.status ?? 'active',
      coins: userData.coins ?? 50,
      totalChats: userData.totalChats ?? 0,
      dailyChats: userData.dailyChats ?? 0,
      lastCoinClaim: userData.lastCoinClaim ?? new Date(),
      gender: userData.gender ?? 'others',
      platform: userData.platform ?? 'web',
      signupSource: userData.signupSource ?? 'organic',
      campaignId: userData.campaignId ?? 'unknown',
      signupCountryCode: userData.signupCountryCode ?? 'unknown',
      signupCountryName: userData.signupCountryName,
      signupRegionCode: userData.signupRegionCode,
      signupRegionName: userData.signupRegionName,
      signupSubdivisionCode: userData.signupSubdivisionCode,
      signupCity: userData.signupCity,
      signupLatitude: typeof userData.signupLatitude === 'number' ? userData.signupLatitude : undefined,
      signupLongitude: typeof userData.signupLongitude === 'number' ? userData.signupLongitude : undefined,
      signupAccuracyRadius: typeof userData.signupAccuracyRadius === 'number' ? userData.signupAccuracyRadius : undefined,
      referrerUrl: userData.referrerUrl,
      referrerDomain: userData.referrerDomain,
      utmSource: userData.utmSource,
      utmMedium: userData.utmMedium,
      utmCampaign: userData.utmCampaign,
      utmTerm: userData.utmTerm,
      utmContent: userData.utmContent,
      activeDeviceToken: (userData as any).activeDeviceToken ?? null,
      lastLoginDevice: (userData as any).lastLoginDevice ?? null,
      passwordResetToken: (userData as any).passwordResetToken ?? null,
      passwordResetExpires: (userData as any).passwordResetExpires ?? null,
      lastPasswordResetAt: (userData as any).lastPasswordResetAt ?? null,
      preferences: userData.preferences ?? {},
      subscription: userData.subscription ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };
    this.users.set(id, newUser);
    console.log('✅ User saved to in-memory storage:', { id, email: newUser.email, username: newUser.username });
    return newUser;
  }

  static async getUserById(id: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const user = await UserModel.findOne({ id }).lean();
        return this.mongoUserToUser(user);
      } catch (err) {
        console.error('MongoDB getUserById failed, using fallback:', err);
      }
    }
    return this.users.get(id) || null;
  }

  static async getUserByDeviceId(deviceId: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const user = await UserModel.findOne({ deviceId }).lean();
        return this.mongoUserToUser(user);
      } catch (err) {
        console.error('MongoDB getUserByDeviceId failed, using fallback:', err);
      }
    }
    for (const u of this.users.values()) {
      if (u.deviceId === deviceId) return u;
    }
    return null;
  }

  static async getUsersByStatus(status: string): Promise<any[]> {
    if (this.isConnected) {
      try {
        const users = await UserModel.find({ status }).sort({ createdAt: -1 }).lean();
        return users.map(u => this.mongoUserToUser(u)).filter(Boolean);
      } catch (err) {
        console.error('MongoDB getUsersByStatus failed, using fallback:', err);
      }
    }
    return Array.from(this.users.values()).filter((u: any) => u.status === status);
  }

  static async getUserByPhoneNumber(phoneNumber: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const user = await UserModel.findOne({ phoneNumber }).lean();
        return this.mongoUserToUser(user);
      } catch (err) {
        console.error('MongoDB getUserByPhoneNumber failed, using fallback:', err);
      }
    }
    for (const u of this.users.values()) {
      if (u.phoneNumber === phoneNumber) return u;
    }
    return null;
  }

  static async getUserByEmail(email: string): Promise<any | null> {
    console.log('🔍 Searching for user by email:', { email });
    if (this.isConnected) {
      try {
        const user = await UserModel.findOne({ email }).lean();
        console.log('📊 MongoDB query result:', { found: !!user, email: user?.email });
        return this.mongoUserToUser(user);
      } catch (err) {
        console.error('❌ MongoDB getUserByEmail failed, using fallback:', err);
      }
    }
    // Fallback to in-memory
    console.log('💾 Searching in-memory storage, total users:', this.users.size);
    for (const u of this.users.values()) {
      if (u.email === email) {
        console.log('✅ User found in in-memory:', { id: u.id, email: u.email });
        return u;
      }
    }
    console.log('❌ User not found for email:', email);
    return null;
  }

  static async updateUser(id: string, updates: Partial<IUserDoc>): Promise<any | null> {
    const normalizedUpdates: any = { ...updates };
    const shouldRecomputeClassification = (
      typeof updates.tier !== 'undefined' ||
      typeof updates.role !== 'undefined' ||
      typeof updates.verificationStatus !== 'undefined' ||
      typeof updates.subscriptionLevel !== 'undefined' ||
      typeof updates.isVerified !== 'undefined'
    );

    let recomputedLegacyTier: string | undefined;

    if (shouldRecomputeClassification) {
      const classification = this.normalizeUserClassification(updates as Partial<IUserDoc> & { tier?: string });
      normalizedUpdates.role = classification.role;
      normalizedUpdates.verificationStatus = classification.verificationStatus;
      normalizedUpdates.subscriptionLevel = classification.subscriptionLevel;
      if (typeof updates.isVerified === 'undefined') {
        normalizedUpdates.isVerified = classification.verificationStatus === 'verified';
      }

      recomputedLegacyTier =
        classification.role === 'super_admin' ? 'super_admin'
        : classification.role === 'admin' ? 'admin'
        : classification.subscriptionLevel === 'premium' ? 'premium'
        : classification.verificationStatus === 'verified' ? 'verified'
        : 'guest';
    }

    delete normalizedUpdates.tier;
    normalizedUpdates.updatedAt = new Date();

    if (this.isConnected) {
      try {
        const user = await UserModel.findOneAndUpdate({ id }, normalizedUpdates, { new: true }).lean();
        return this.mongoUserToUser(user);
      } catch (err) {
        console.error('MongoDB updateUser failed, using fallback:', err);
      }
    }
    const user = this.users.get(id);
    if (!user) return null;
    Object.assign(user, normalizedUpdates);
    if (shouldRecomputeClassification) {
      user.verificationStatus = normalizedUpdates.verificationStatus;
      user.subscriptionLevel = normalizedUpdates.subscriptionLevel;
      user.role = normalizedUpdates.role;
      user.isVerified = normalizedUpdates.isVerified;
      user.tier = recomputedLegacyTier ?? user.tier;
    }
    user.updatedAt = normalizedUpdates.updatedAt;
    this.users.set(id, user);
    return user;
  }

  static async setPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    if (this.isConnected) {
      try {
        await UserModel.updateOne(
          { id: userId },
          {
            $set: {
              passwordResetToken: tokenHash,
              passwordResetExpires: expiresAt,
              updatedAt: new Date()
            }
          }
        );
        return;
      } catch (error) {
        console.error('MongoDB setPasswordResetToken failed, using fallback:', error);
      }
    }

    const user = this.users.get(userId);
    if (!user) return;
    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = expiresAt;
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  static async getUserByPasswordResetToken(tokenHash: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const user = await UserModel.findOne({ passwordResetToken: tokenHash }).lean();
        return this.mongoUserToUser(user);
      } catch (error) {
        console.error('MongoDB getUserByPasswordResetToken failed, using fallback:', error);
      }
    }

    for (const user of this.users.values()) {
      if (user.passwordResetToken === tokenHash) {
        return user;
      }
    }
    return null;
  }

  static async clearPasswordResetToken(userId: string): Promise<void> {
    if (this.isConnected) {
      try {
        await UserModel.updateOne(
          { id: userId },
          {
            $set: {
              passwordResetToken: null,
              passwordResetExpires: null,
              updatedAt: new Date()
            }
          }
        );
        return;
      } catch (error) {
        console.error('MongoDB clearPasswordResetToken failed, using fallback:', error);
      }
    }

    const user = this.users.get(userId);
    if (!user) return;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  static async updateUserPassword(userId: string, passwordHash: string): Promise<any | null> {
    const updates = {
      passwordHash,
      activeDeviceToken: null,
      lastPasswordResetAt: new Date(),
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date()
    };

    if (this.isConnected) {
      try {
        const user = await UserModel.findOneAndUpdate(
          { id: userId },
          { $set: updates },
          { new: true }
        ).lean();
        if (user && (user.role === 'admin' || user.role === 'super_admin')) {
          await this.refreshAdminPasswordForUser(user);
        }
        return this.mongoUserToUser(user);
      } catch (error) {
        console.error('MongoDB updateUserPassword failed, using fallback:', error);
      }
    }

    const user = this.users.get(userId);
    if (!user) return null;
    Object.assign(user, updates);
    this.users.set(userId, user);
    if (user.role === 'admin' || user.role === 'super_admin') {
      await this.refreshAdminPasswordForUser(user);
    }
    return user;
  }

  static async resetDailyCoinsIfNeeded(userId: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const userDoc = await UserModel.findOne({ id: userId }).lean();
        if (!userDoc) return null;
        const normalized = await this.ensureDailyReset(userDoc);
        return this.mongoUserToUser(normalized);
      } catch (error) {
        console.error('MongoDB resetDailyCoinsIfNeeded failed:', error);
      }
    }

    const user = this.users.get(userId);
    if (!user) return null;
    const normalized = await this.ensureDailyReset(user);
    return normalized;
  }

  static async spendCoinsForMatch(
    userId: string,
    cost: number
  ): Promise<{
    success: boolean;
    user?: any;
    previous?: { coins: number; totalChats: number; dailyChats: number; lastCoinClaim?: Date };
    reason?: 'NOT_FOUND' | 'INSUFFICIENT_COINS';
  }> {
    const spendAmountRaw = Number(cost);
    if (!Number.isFinite(spendAmountRaw)) {
      console.error('spendCoinsForMatch received invalid cost', { userId, cost });
      return { success: false, reason: 'INSUFFICIENT_COINS' };
    }

    const spendAmount = Math.max(0, Math.floor(spendAmountRaw));
    const shouldCharge = spendAmount > 0;

    if (this.isConnected) {
      try {
        let userDoc = await UserModel.findOne({ id: userId }).lean();
        if (!userDoc) {
          return { success: false, reason: 'NOT_FOUND' };
        }

        userDoc = await this.ensureDailyReset(userDoc);
        if (!userDoc) {
          return { success: false, reason: 'NOT_FOUND' };
        }
        const availableCoins = sanitizeCoinBalance(userDoc.coins);
        if (shouldCharge && availableCoins < spendAmount) {
          return { success: false, reason: 'INSUFFICIENT_COINS' };
        }

        const previous = {
          coins: availableCoins,
          totalChats: userDoc.totalChats ?? 0,
          dailyChats: userDoc.dailyChats ?? 0,
          lastCoinClaim: userDoc.lastCoinClaim
        };

        const filter: Record<string, any> = { id: userId };
        if (shouldCharge) {
          filter.coins = { $gte: spendAmount };
        }

        const update: Record<string, any> = {
          $inc: {
            totalChats: 1,
            dailyChats: 1,
            ...(shouldCharge ? { coins: -spendAmount } : {})
          },
          $set: { updatedAt: new Date(), lastActiveAt: new Date() }
        };

        const updatedDoc = await UserModel.findOneAndUpdate(filter, update, { new: true }).lean();

        if (!updatedDoc) {
          return { success: false, reason: shouldCharge ? 'INSUFFICIENT_COINS' : 'NOT_FOUND' };
        }

        return { success: true, user: this.mongoUserToUser(updatedDoc), previous };
      } catch (error) {
        console.error('MongoDB spendCoinsForMatch failed:', error);
        return { success: false, reason: 'INSUFFICIENT_COINS' };
      }
    }

    const fallbackUser = this.users.get(userId);
    if (!fallbackUser) {
      return { success: false, reason: 'NOT_FOUND' };
    }

    const normalized = await this.ensureDailyReset(fallbackUser);
    if (!normalized) {
      return { success: false, reason: 'NOT_FOUND' };
    }
    const availableCoins = sanitizeCoinBalance(normalized.coins);
    if (shouldCharge && availableCoins < spendAmount) {
      return { success: false, reason: 'INSUFFICIENT_COINS' };
    }

    const previous = {
      coins: availableCoins,
      totalChats: normalized.totalChats ?? 0,
      dailyChats: normalized.dailyChats ?? 0,
      lastCoinClaim: normalized.lastCoinClaim
    };

    const updated = {
      ...normalized,
      coins: shouldCharge ? availableCoins - spendAmount : availableCoins,
      totalChats: previous.totalChats + 1,
      dailyChats: previous.dailyChats + 1,
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };

    this.users.set(userId, updated);
    return { success: true, user: updated, previous };
  }

  static async refundMatchSpend(
    userId: string,
    previous: { coins: number; totalChats: number; dailyChats: number; lastCoinClaim?: Date }
  ): Promise<any | null> {
    if (this.isConnected) {
      try {
        const update: any = {
          coins: previous.coins,
          totalChats: Math.max(previous.totalChats, 0),
          dailyChats: Math.max(previous.dailyChats, 0),
          updatedAt: new Date()
        };

        if (previous.lastCoinClaim) {
          update.lastCoinClaim = previous.lastCoinClaim;
        }

        const userDoc = await UserModel.findOneAndUpdate(
          { id: userId },
          { $set: update },
          { new: true }
        ).lean();

        return this.mongoUserToUser(userDoc);
      } catch (error) {
        console.error('MongoDB refundMatchSpend failed:', error);
        return null;
      }
    }

    const user = this.users.get(userId);
    if (!user) return null;

    const refunded = {
      ...user,
      coins: previous.coins,
      totalChats: Math.max(previous.totalChats, 0),
      dailyChats: Math.max(previous.dailyChats, 0),
      lastCoinClaim: previous.lastCoinClaim ?? user.lastCoinClaim,
      updatedAt: new Date()
    };

    this.users.set(userId, refunded);
    return refunded;
  }

  static async adjustUserCoins(
    userId: string,
    delta: number,
    metadata: { reason?: string; adminId?: string; adminUsername?: string } = {}
  ): Promise<{ success: boolean; user?: any; adjustment?: any; error?: string }> {
    if (!Number.isFinite(delta) || delta === 0) {
      return { success: false, error: 'INVALID_DELTA' };
    }

    const reason = metadata.reason || 'manual_adjustment';
    const now = new Date();

    if (this.isConnected) {
      try {
        let userDoc = await UserModel.findOne({ id: userId }).lean();
        if (!userDoc) {
          return { success: false, error: 'USER_NOT_FOUND' };
        }

        userDoc = await this.ensureDailyReset(userDoc);
        const previousCoins = sanitizeCoinBalance(userDoc?.coins);
        const newCoins = Math.max(previousCoins + delta, 0);

        const updatedDoc = await UserModel.findOneAndUpdate(
          { id: userId },
          {
            $set: {
              coins: newCoins,
              updatedAt: now,
              lastActiveAt: now
            }
          },
          { new: true }
        ).lean();

        if (!updatedDoc) {
          return { success: false, error: 'USER_NOT_FOUND' };
        }

        const adjustmentRecord = {
          id: this.generateId('coinadj-'),
          userId,
          delta,
          reason,
          adminId: metadata.adminId,
          adminUsername: metadata.adminUsername,
          previousCoins,
          newCoins,
          createdAt: now
        };

        await CoinAdjustmentModel.create(adjustmentRecord);
        this.rememberCoinAdjustment(adjustmentRecord);

        return {
          success: true,
          user: this.mongoUserToUser(updatedDoc),
          adjustment: adjustmentRecord
        };
      } catch (error) {
        console.error('MongoDB adjustUserCoins failed:', error);
        return { success: false, error: 'ADJUST_FAILED' };
      }
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    const normalized = await this.ensureDailyReset(user);
    const previousCoins = sanitizeCoinBalance(normalized?.coins);
    const newCoins = Math.max(previousCoins + delta, 0);

    const updated = {
      ...normalized,
      coins: newCoins,
      updatedAt: now,
      lastActiveAt: now
    };

    this.users.set(userId, updated);

    const adjustmentRecord = {
      id: this.generateId('coinadj-'),
      userId,
      delta,
      reason,
      adminId: metadata.adminId,
      adminUsername: metadata.adminUsername,
      previousCoins,
      newCoins,
      createdAt: now
    };

    this.rememberCoinAdjustment(adjustmentRecord);

    return {
      success: true,
      user: updated,
      adjustment: adjustmentRecord
    };
  }

  static async getCoinAdjustmentHistory(userId: string, limit: number = 20): Promise<any[]> {
    if (this.isConnected) {
      try {
        const adjustments = await CoinAdjustmentModel.find({ userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();

        return adjustments.map((doc) => ({ ...doc }));
      } catch (error) {
        console.error('MongoDB getCoinAdjustmentHistory failed:', error);
      }
    }

    const history = this.coinAdjustments.get(userId) || [];
    return history.slice(0, limit).map((entry) => ({ ...entry }));
  }

  static async archiveAndDeleteUser(
    userId: string,
    metadata: {
      reason?: string;
      deletedBy?: string;
      context?: 'user' | 'admin' | 'system';
      adminId?: string;
      adminUsername?: string;
    } = {}
  ): Promise<{ success: boolean; archived?: any; error?: string }> {
    const inferredContext: 'user' | 'admin' | 'system' = metadata.context
      ?? (metadata.deletedBy === 'system'
        ? 'system'
        : metadata.deletedBy && metadata.deletedBy !== userId
          ? 'admin'
          : 'user');

    console.log('🗑️ archiveAndDeleteUser invoked:', {
      userId,
      context: inferredContext,
      reason: metadata.reason,
      deletedBy: metadata.deletedBy,
      hasAdminMeta: !!(metadata.adminId || metadata.adminUsername)
    });

    if (this.isConnected) {
      try {
        const lookup: any[] = [{ id: userId }];
        if (mongoose.Types.ObjectId.isValid(userId)) {
          lookup.push({ _id: new mongoose.Types.ObjectId(userId) });
        }

        const userDoc = await UserModel.findOne({ $or: lookup }).lean();
        if (!userDoc) {
          console.warn('⚠️ archiveAndDeleteUser: user not found in MongoDB', { userId });
          return { success: false, error: 'USER_NOT_FOUND' };
        }

        const archiveBase: any = {
          userId: userDoc.id || userDoc._id?.toString(),
          reason: metadata.reason || 'user_request',
          deletedBy: metadata.deletedBy || userId,
          deletedAt: new Date(),
          originalData: userDoc
        };

        let archivedDoc: any;
        if (inferredContext === 'admin') {
          archivedDoc = await AdminDeletedAccountModel.create({
            ...archiveBase,
            adminId: metadata.adminId || metadata.deletedBy,
            adminUsername: metadata.adminUsername || null
          });
        } else {
          archivedDoc = await DeletedAccountModel.create(archiveBase);
        }

        await UserModel.deleteOne({ $or: lookup });
        await ChatSessionModel.updateMany(
          { $or: [{ user1Id: userId }, { user2Id: userId }], status: { $ne: 'ended' } },
          { $set: { status: 'ended', endedAt: new Date() } }
        );

        const archivedPayload = archivedDoc?.toObject?.() ?? archivedDoc;

        if (archivedPayload) {
          if (inferredContext === 'admin') {
            this.adminDeletedAccounts.set(userId, archivedPayload);
          } else {
            this.deletedAccounts.set(userId, archivedPayload);
          }
        }

        this.users.delete(userId);

        console.log('✅ archiveAndDeleteUser success', { userId, context: inferredContext });
        return { success: true, archived: archivedPayload };
      } catch (error) {
        console.error('MongoDB archiveAndDeleteUser failed:', error);
        return { success: false, error: 'DELETE_FAILED' };
      }
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    const archivedBase: any = {
      userId,
      reason: metadata?.reason || 'user_request',
      deletedBy: metadata?.deletedBy || userId,
      deletedAt: new Date(),
      originalData: { ...user }
    };

    let archivedResult: any = archivedBase;
    if (inferredContext === 'admin') {
      archivedResult = {
        ...archivedBase,
        adminId: metadata?.adminId || metadata?.deletedBy,
        adminUsername: metadata?.adminUsername || null
      };
      this.adminDeletedAccounts.set(userId, archivedResult);
    } else {
      this.deletedAccounts.set(userId, archivedResult);
    }

    this.users.delete(userId);

    for (const [sessionId, session] of this.chatSessions.entries()) {
      if (session.user1Id === userId || session.user2Id === userId) {
        this.chatSessions.delete(sessionId);
      }
    }

    console.log('✅ archiveAndDeleteUser success (in-memory fallback)', { userId, context: inferredContext });
    return { success: true, archived: archivedResult };
  }

  static async checkUserBanned(deviceId: string): Promise<boolean> {
    const user = await this.getUserByDeviceId(deviceId);
    return user?.status === 'banned' || user?.status === 'suspended' || false;
  }

  static async verifyUserPhone(userId: string, phoneHash: string): Promise<any | null> {
  return this.updateUser(userId, { phoneHash, isVerified: true, verificationStatus: 'verified' } as any);
  }

  static async updateLastActive(userId: string): Promise<void> {
    await this.updateUser(userId, { lastActiveAt: new Date() } as any);
  }

  /* ---------- Random matching (Omegle style) ---------- */
  static async getRandomUser(excludeUserId?: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const match: any = {
          status: 'active',
          isOnline: true
        };
        if (excludeUserId) match.id = { $ne: excludeUserId };
        const pipeline = [{ $match: match }, { $sample: { size: 1 } }];
        const result = await UserModel.aggregate(pipeline);
        if (result.length > 0) return this.mongoUserToUser(result[0]);
      } catch (err) {
        console.error('MongoDB getRandomUser failed, using fallback:', err);
      }
    }

    const candidates = Array.from(this.users.values()).filter((u: any) => u.status === 'active' && u.isOnline);
    const filtered = excludeUserId ? candidates.filter((u: any) => u.id !== excludeUserId) : candidates;
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /* ---------- Shadow Login Guest System ---------- */
  static async createGuest(guestData: { guestId: string; deviceMeta: any }): Promise<any> {
    const guestObj = {
      guestId: guestData.guestId,
      deviceMeta: guestData.deviceMeta,
      sessions: 1,
      lastSeen: new Date(),
      createdAt: new Date(),
      status: 'active'
    };

    if (this.isConnected) {
      try {
        const doc = new GuestUserModel(guestObj);
        await doc.save();
        console.log(`✅ Guest created: ${guestData.guestId.substring(0, 12)}...`);
        return doc.toObject();
      } catch (err: any) {
        if (err.code === 11000) {
          // Duplicate guestId - guest already exists
          console.warn(`⚠️ Guest already exists: ${guestData.guestId.substring(0, 12)}...`);
          return await this.getGuestById(guestData.guestId);
        }
        console.error('MongoDB createGuest failed:', err);
        throw err;
      }
    }

    // Fallback (in-memory - not persistent, but works for dev)
    const existing = Array.from(this.users.values()).find((u: any) => u.guestId === guestData.guestId);
    if (existing) return existing;

    const guestUser = { id: this.generateId('guest-'), ...guestObj };
    this.users.set(guestUser.id, guestUser);
    return guestUser;
  }

  static async getGuestById(guestId: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const doc = await GuestUserModel.findOne({ guestId, status: 'active' }).lean();
        return doc || null;
      } catch (err) {
        console.error('MongoDB getGuestById failed:', err);
        return null;
      }
    }

    // Fallback
    const found = Array.from(this.users.values()).find((u: any) => u.guestId === guestId && u.status === 'active');
    return found || null;
  }

  static async updateGuestLastSeen(guestId: string): Promise<boolean> {
    if (this.isConnected) {
      try {
        const result = await GuestUserModel.updateOne(
          { guestId, status: 'active' },
          {
            $set: { lastSeen: new Date() },
            $inc: { sessions: 1 }
          }
        );
        return result.modifiedCount > 0;
      } catch (err) {
        console.error('MongoDB updateGuestLastSeen failed:', err);
        return false;
      }
    }

    // Fallback
    const found = Array.from(this.users.values()).find((u: any) => u.guestId === guestId);
    if (!found) return false;
    found.lastSeen = new Date();
    found.sessions = (found.sessions || 0) + 1;
    return true;
  }

  static async deleteGuest(guestId: string): Promise<boolean> {
    if (this.isConnected) {
      try {
        // Soft delete
        const result = await GuestUserModel.updateOne(
          { guestId },
          { $set: { status: 'deleted' } }
        );
        console.log(`🗑️ Guest deleted (soft): ${guestId.substring(0, 12)}...`);
        return result.modifiedCount > 0;
      } catch (err) {
        console.error('MongoDB deleteGuest failed:', err);
        return false;
      }
    }

    // Fallback
    const found = Array.from(this.users.values()).find((u: any) => u.guestId === guestId);
    if (!found) return false;
    found.status = 'deleted';
    return true;
  }

  static async getGuestStats(): Promise<any> {
    if (this.isConnected) {
      try {
        const totalGuests = await GuestUserModel.countDocuments({ status: 'active' });
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const activeToday = await GuestUserModel.countDocuments({
          status: 'active',
          lastSeen: { $gte: todayStart }
        });
        
        // Unique device count (approximate - based on unique guestIds)
        const uniqueDevices = await GuestUserModel.distinct('guestId', { status: 'active' });

        return {
          totalGuests,
          activeToday,
          uniqueDevices: uniqueDevices.length,
          timestamp: new Date()
        };
      } catch (err) {
        console.error('MongoDB getGuestStats failed:', err);
        return { totalGuests: 0, activeToday: 0, uniqueDevices: 0 };
      }
    }

    // Fallback
    const guests = Array.from(this.users.values()).filter((u: any) => u.guestId && u.status === 'active');
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const activeToday = guests.filter((g: any) => g.lastSeen >= todayStart);

    return {
      totalGuests: guests.length,
      activeToday: activeToday.length,
      uniqueDevices: guests.length,
      timestamp: new Date()
    };
  }

  /* ---------- Chat session operations ---------- */
  static async createChatSession(sessionData: { user1Id: string; user2Id: string; mode?: string }): Promise<any> {
    const sessionObj = {
      id: this.generateId('session-'),
      user1Id: sessionData.user1Id,
      user2Id: sessionData.user2Id,
      mode: (sessionData.mode as any) || 'video',
      status: 'active',
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (this.isConnected) {
      try {
        const doc = new ChatSessionModel(sessionObj);
        await doc.save();
        return doc.toObject();
      } catch (err) {
        console.error('MongoDB createChatSession failed, using fallback:', err);
      }
    }
    this.chatSessions.set(sessionObj.id, sessionObj);
    return sessionObj;
  }

  static async endChatSession(sessionId: string, duration?: number): Promise<boolean> {
    if (this.isConnected) {
      try {
        const session = await ChatSessionModel.findOneAndUpdate(
          { id: sessionId },
          { status: 'ended', endedAt: new Date(), ...(duration ? { duration } : {}) },
          { new: true }
        );
        return !!session;
      } catch (err) {
        console.error('MongoDB endChatSession failed, using fallback:', err);
      }
    }
    const s = this.chatSessions.get(sessionId);
    if (!s) return false;
    s.status = 'ended';
    s.endedAt = new Date();
    if (duration) s.duration = duration;
    this.chatSessions.set(sessionId, s);
    return true;
  }

  // ==================== FAVOURITES METHODS ====================
  
  /**
   * Add a user to favourites
   */
  static async addFavourite(
    userId: string,
    favouriteUserId: string,
    favouriteUserGender?: string,
    favouriteUserInterests?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConnected) {
      return { success: false, error: 'Database not connected' };
    }

    try {
      // Check if already in favourites
      const existing = await FavouriteModel.findOne({ userId, favouriteUserId }).lean();
      if (existing) {
        return { success: false, error: 'User already in favourites' };
      }

      // Add to favourites
      await FavouriteModel.create({
        userId,
        favouriteUserId,
        favouriteUserGender,
        favouriteUserInterests,
        addedAt: new Date()
      });

      console.log('✅ Favourite added:', { userId, favouriteUserId });
      return { success: true };
    } catch (err: any) {
      console.error('❌ Error adding favourite:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Remove a user from favourites
   */
  static async removeFavourite(userId: string, favouriteUserId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConnected) {
      return { success: false, error: 'Database not connected' };
    }

    try {
      const result = await FavouriteModel.deleteOne({ userId, favouriteUserId });
      
      if (result.deletedCount === 0) {
        return { success: false, error: 'Favourite not found' };
      }

      console.log('✅ Favourite removed:', { userId, favouriteUserId });
      return { success: true };
    } catch (err: any) {
      console.error('❌ Error removing favourite:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get all favourites for a user with their online status
   */
  static async getFavourites(userId: string): Promise<any[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const favourites = await FavouriteModel.find({ userId })
        .sort({ addedAt: -1 })
        .lean();

      // Get user details for each favourite
      const favouriteUsers = await Promise.all(
        favourites.map(async (fav) => {
          const user = await UserModel.findOne({ id: fav.favouriteUserId })
            .select('id email gender isOnline lastActiveAt')
            .lean();
          
          if (!user) return null;

          return {
            favouriteId: fav._id,
            userId: user.id,
            email: user.email,
            gender: fav.favouriteUserGender || user.gender,
            interests: fav.favouriteUserInterests || [],
            isOnline: user.isOnline || false,
            lastActiveAt: user.lastActiveAt,
            addedAt: fav.addedAt
          };
        })
      );

      return favouriteUsers.filter(Boolean);
    } catch (err) {
      console.error('❌ Error getting favourites:', err);
      return [];
    }
  }

  /**
   * Check if a user is in favourites
   */
  static async isFavourite(userId: string, favouriteUserId: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const existing = await FavouriteModel.findOne({ userId, favouriteUserId }).lean();
      return !!existing;
    } catch (err) {
      console.error('❌ Error checking favourite:', err);
      return false;
    }
  }

  static async getChatSession(sessionId: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const s = await ChatSessionModel.findOne({ id: sessionId }).lean();
        return s || null;
      } catch (err) {
        console.error('MongoDB getChatSession failed, using fallback:', err);
      }
    }
    return this.chatSessions.get(sessionId) || null;
  }

  static async getActiveUsersCount(): Promise<number> {
    if (this.isConnected) {
      try {
        return await UserModel.countDocuments({ status: 'active', isOnline: true });
      } catch (err) {
        console.error('MongoDB getActiveUsersCount failed, using fallback:', err);
      }
    }
    return Array.from(this.users.values()).filter((u: any) => u.status === 'active' && u.isOnline).length;
  }

  /* ---------- Moderation operations ---------- */
  static async createModerationReport(reportData: Partial<IModerationReportDoc>): Promise<any> {
    const obj = {
      id: this.generateId('report-'),
      sessionId: reportData.sessionId,
      reportedUserId: reportData.reportedUserId,
      reporterUserId: reportData.reporterUserId,
      violationType: reportData.violationType,
      description: reportData.description,
      evidenceUrls: reportData.evidenceUrls || [],
      autoDetected: reportData.autoDetected ?? false,
      confidenceScore: reportData.confidenceScore ?? 0,
      status: 'pending',
      createdAt: new Date()
    };
    if (this.isConnected) {
      try {
        const doc = new ModerationReportModel(obj);
        await doc.save();
        return doc.toObject();
      } catch (err) {
        console.error('MongoDB createModerationReport failed, fallback to in-memory:', err);
      }
    }
    // fallback: store in chatRooms map keyed by report id (simple)
    this.chatRooms.set(obj.id, obj);
    return obj;
  }

  /* ---------- Chat room operations ---------- */
  static async createChatRoom(roomData: Partial<IChatRoomDoc>): Promise<any> {
    const obj: any = {
      ...roomData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (this.isConnected) {
      try {
        const room = new ChatRoomModel(obj);
        await room.save();
        return room.toObject();
      } catch (err) {
        console.error('MongoDB createChatRoom failed, fallback:', err);
      }
    }
    const id = this.generateId('room-');
    obj.id = id;
    this.chatRooms.set(id, obj);
    return obj;
  }
  static async getChatRoomById(id: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const r = await ChatRoomModel.findById(id).lean();
        return r || null;
      }
      catch (err) {
        console.error('MongoDB getChatRoomById failed, fallback:', err);
      }
    }
    return this.chatRooms.get(id) || null;
  }

  static async updateChatRoom(id: string, updates: Partial<IChatRoomDoc>): Promise<any | null> {
    if (this.isConnected) {
      try {
        const room = await ChatRoomModel.findByIdAndUpdate(id, updates, { new: true }).lean();
        return room || null;
      } catch (err) {
        console.error('MongoDB updateChatRoom failed, fallback:', err);
      }
    }
    const room = this.chatRooms.get(id);
    if (!room) return null;
    Object.assign(room, updates);
    room.updatedAt = new Date();
    this.chatRooms.set(id, room);
    return room;
  }

  static async findAvailableRoom(userId: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const room = await ChatRoomModel.findOne({ status: 'waiting', participants: { $nin: [userId] } }).sort({ updatedAt: -1 }).lean();
        return room || null;
      } catch (err) {
        console.error('MongoDB findAvailableRoom failed, fallback:', err);
      }
    }
    for (const room of this.chatRooms.values()) {
      if ((room.status === 'waiting' || !room.status) && !(room.participants || []).includes(userId)) return room;
    }
    return null;
  }

  static async getUserRooms(userId: string): Promise<any[]> {
    if (this.isConnected) {
      try {
        const rooms = await ChatRoomModel.find({ participants: userId }).sort({ updatedAt: -1 }).lean();
        return rooms;
      } catch (err) {
        console.error('MongoDB getUserRooms failed, fallback:', err);
      }
    }
    return Array.from(this.chatRooms.values()).filter((r: any) => (r.participants || []).includes(userId));
  }

  /* ---------- Message operations ---------- */
  static async createMessage(messageData: Omit<IMessageDoc, 'createdAt' | 'updatedAt'>): Promise<any> {
    const obj = {
      ...messageData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (this.isConnected) {
      try {
        const msg = new MessageModel(obj);
        await msg.save();
        return msg.toObject();
      } catch (err) {
        console.error('MongoDB createMessage failed, fallback:', err);
      }
    }
    const arr = this.messages.get(messageData.roomId) || [];
    arr.push(obj);
    this.messages.set(messageData.roomId, arr);
    return obj;
  }

  static async getRoomMessages(roomId: string, limit = 50): Promise<any[]> {
    if (this.isConnected) {
      try {
        const msgs = await MessageModel.find({ roomId }).sort({ createdAt: -1 }).limit(limit).lean();
        return msgs.reverse();
      } catch (err) {
        console.error('MongoDB getRoomMessages failed, fallback:', err);
      }
    }
    const arr = this.messages.get(roomId) || [];
    return arr.slice(-limit);
  }

  /* ---------- Ban & Report System ---------- */
  
  /**
   * Check if user is currently banned
   * Returns active ban if exists, null otherwise
   */
  static async checkUserBanStatus(userId: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        const activeBan = await BanHistoryModel.findOne({
          userId,
          isActive: true,
          $or: [
            { banType: 'permanent' },
            { expiresAt: { $gt: new Date() } }
          ]
        }).sort({ bannedAt: -1 }).lean();
        
        // If ban expired, mark as inactive
        if (activeBan && activeBan.banType === 'temporary' && activeBan.expiresAt && activeBan.expiresAt < new Date()) {
          await BanHistoryModel.updateOne(
            { id: activeBan.id },
            { isActive: false }
          );
          return null;
        }
        
        return activeBan || null;
      } catch (err) {
        console.error('MongoDB checkUserBanStatus failed:', err);
      }
    }
    return null;
  }

  /**
   * Get total report count for a user
   */
  static async getUserReportCount(userId: string): Promise<number> {
    if (this.isConnected) {
      try {
        return await ModerationReportModel.countDocuments({ 
          reportedUserId: userId,
          status: { $in: ['pending', 'reviewed'] }
        });
      } catch (err) {
        console.error('MongoDB getUserReportCount failed:', err);
      }
    }
    return 0;
  }

  /**
   * Auto-ban user based on report count
   * 3 reports = 7 days ban
   * 6 reports = 14 days ban  
   * 9+ reports = permanent ban
   */
  static async autoBanUserByReports(userId: string, reportCount: number, reason: string): Promise<any | null> {
    if (!this.isConnected) {
      console.warn('MongoDB not connected, cannot auto-ban user');
      return null;
    }

    try {
      let banType: 'temporary' | 'permanent';
      let banDuration: number | undefined;
      let expiresAt: Date | undefined;

      // Escalating ban logic
      if (reportCount >= 9) {
        // Permanent ban
        banType = 'permanent';
        banDuration = undefined;
        expiresAt = undefined;
      } else if (reportCount >= 6) {
        // 14 days ban (2 weeks)
        banType = 'temporary';
        banDuration = 14;
        expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      } else if (reportCount >= 3) {
        // 7 days ban (1 week)
        banType = 'temporary';
        banDuration = 7;
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else {
        // Not enough reports to ban
        return null;
      }

      const banObj = {
        id: this.generateId('ban-'),
        userId,
        reportCount,
        banType,
        banDuration,
        bannedAt: new Date(),
        expiresAt,
        reason,
        bannedBy: 'auto',
        isActive: true,
        createdAt: new Date()
      };

      const banDoc = new BanHistoryModel(banObj);
      await banDoc.save();

      // Update user status to banned
      await UserModel.updateOne(
        { id: userId },
        { status: 'banned', updatedAt: new Date() }
      );

      console.log(`✅ User ${userId} auto-banned: ${banType} (${reportCount} reports)`);
      return banDoc.toObject();
    } catch (err) {
      console.error('MongoDB autoBanUserByReports failed:', err);
      return null;
    }
  }
  
  static async saveReportedChatTranscript(data: {
    sessionId: string;
    reporterUserId: string;
    reporterEmail?: string | null;
    reportedUserId: string;
    reportedEmail?: string | null;
    mode?: string;
    messages: Array<{ senderId: string; content: string; type?: string; timestamp: number | Date; replyTo?: any }>;
  }): Promise<any | null> {
    const normalizedMessages = (data.messages || []).map((msg) => ({
      senderId: msg.senderId,
      content: msg.content,
      type: msg.type || 'text',
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
      ...(msg.replyTo ? { replyTo: msg.replyTo } : {})
    }));

    const payload = {
      sessionId: data.sessionId,
      reporterUserId: data.reporterUserId,
      reporterEmail: data.reporterEmail || null,
      reportedUserId: data.reportedUserId,
      reportedEmail: data.reportedEmail || null,
      mode: data.mode,
      messages: normalizedMessages,
      createdAt: new Date()
    };

    if (this.isConnected) {
      try {
        const doc = await ReportedChatTranscriptModel.create(payload);
        const stored = doc?.toObject?.() ?? doc;
        this.reportedChatTranscripts.set(`${payload.sessionId}:${payload.createdAt.getTime()}`, stored);
        console.log('🗄️ Reported chat transcript saved (MongoDB)', {
          sessionId: payload.sessionId,
          messages: normalizedMessages.length
        });
        return stored;
      } catch (error) {
        console.error('❌ Failed to save reported chat transcript (MongoDB):', error);
        return null;
      }
    }

    const key = `${payload.sessionId}:${Date.now()}`;
    this.reportedChatTranscripts.set(key, payload);
    console.log('🗄️ Reported chat transcript stored in-memory fallback', {
      sessionId: payload.sessionId,
      messages: normalizedMessages.length
    });
    return payload;
  }

  /**
   * Save text chat report with last 30 messages
   */
  static async saveTextChatReport(data: {
    roomId: string;
    reporterId: string;
    reportedUserId: string;
    violationType: 'harassment' | 'spam' | 'inappropriate' | 'other';
    description: string;
    messages: Array<{
      messageId: string;
      senderId: string;
      content: string;
      timestamp: number;
    }>;
  }): Promise<any | null> {
    const normalizedMessages = (data.messages || []).map((msg) => ({
      messageId: msg.messageId,
      senderId: msg.senderId,
      content: msg.content,
      timestamp: typeof msg.timestamp === 'number' ? new Date(msg.timestamp) : msg.timestamp
    }));

    const payload = {
      reportId: this.generateId('text-report-'),
      roomId: data.roomId,
      reporterId: data.reporterId,
      reportedUserId: data.reportedUserId,
      violationType: data.violationType,
      description: data.description,
      messages: normalizedMessages,
      status: 'pending',
      createdAt: new Date()
    };

    if (this.isConnected) {
      try {
        // Use existing ReportedChatTranscriptModel or create new collection
        const doc = await ReportedChatTranscriptModel.create({
          sessionId: payload.roomId,
          reporterUserId: payload.reporterId,
          reportedUserId: payload.reportedUserId,
          mode: 'text',
          violationType: payload.violationType,
          description: payload.description,
          messages: normalizedMessages,
          createdAt: payload.createdAt
        });
        
        console.log('🗄️ Text chat report saved (MongoDB)', {
          roomId: payload.roomId,
          reporterId: payload.reporterId,
          messages: normalizedMessages.length
        });
        
        return doc?.toObject?.() ?? doc;
      } catch (error) {
        console.error('❌ Failed to save text chat report (MongoDB):', error);
        return null;
      }
    }

    // In-memory fallback
    const key = `${payload.roomId}:${Date.now()}`;
    this.reportedChatTranscripts.set(key, payload);
    console.log('🗄️ Text chat report stored in-memory fallback', {
      roomId: payload.roomId,
      messages: normalizedMessages.length
    });
    return payload;
  }

  /**
   * Save voice chat report with call metadata
   */
  static async saveVoiceChatReport(data: {
    roomId: string;
    reporterId: string;
    reportedUserId: string;
    violationType: 'harassment' | 'spam' | 'inappropriate' | 'other';
    description: string;
    session: {
      roomId: string;
      user1Id: string;
      user2Id: string;
      startedAt: number;
      endedAt?: number;
      duration: number;
      metrics: {
        callConnectTime?: number;
        packetLoss?: number;
        jitter?: number;
        averageBitrate?: number;
        currentBitrate?: number;
        callDuration: number;
        reconnectAttempts: number;
        iceConnectionState?: string;
        lastUpdated: number;
      };
      disconnectReason?: string;
    };
    reportedAt: number;
  }): Promise<any | null> {
    const payload = {
      reportId: this.generateId('voice-report-'),
      roomId: data.roomId,
      reporterId: data.reporterId,
      reportedUserId: data.reportedUserId,
      violationType: data.violationType,
      description: data.description,
      session: {
        ...data.session,
        startedAt: new Date(data.session.startedAt),
        endedAt: data.session.endedAt ? new Date(data.session.endedAt) : undefined,
        metrics: {
          ...data.session.metrics,
          lastUpdated: new Date(data.session.metrics.lastUpdated)
        }
      },
      status: 'pending',
      reportedAt: new Date(data.reportedAt),
      createdAt: new Date()
    };

    if (this.isConnected) {
      try {
        const doc = await ReportedChatTranscriptModel.create({
          sessionId: payload.roomId,
          reporterUserId: payload.reporterId,
          reportedUserId: payload.reportedUserId,
          mode: 'audio',
          violationType: payload.violationType,
          description: payload.description,
          session: payload.session,
          createdAt: payload.createdAt
        });
        
        console.log('🗄️ Voice chat report saved (MongoDB)', {
          roomId: payload.roomId,
          reporterId: payload.reporterId,
          duration: data.session.duration,
          metrics: data.session.metrics
        });
        
        return doc?.toObject?.() ?? doc;
      } catch (error) {
        console.error('❌ Failed to save voice chat report (MongoDB):', error);
        return null;
      }
    }

    // In-memory fallback
    const key = `${payload.roomId}:${Date.now()}`;
    this.reportedChatTranscripts.set(key, payload);
    console.log('🗄️ Voice chat report stored in-memory fallback', {
      roomId: payload.roomId,
      duration: data.session.duration
    });
    return payload;
  }

  /**
   * Manually ban user (admin action)
   */
  static async banUser(userId: string, banType: 'temporary' | 'permanent', duration?: number, reason?: string, adminId?: string): Promise<any | null> {
    if (!this.isConnected) {
      console.warn('MongoDB not connected, cannot ban user');
      return null;
    }

    try {
      const expiresAt = banType === 'temporary' && duration 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
        : undefined;

      const banObj = {
        id: this.generateId('ban-'),
        userId,
        reportCount: 0,
        banType,
        banDuration: duration,
        bannedAt: new Date(),
        expiresAt,
        reason: reason || 'Manual ban by admin',
        bannedBy: adminId || 'admin',
        isActive: true,
        createdAt: new Date()
      };

      const banDoc = new BanHistoryModel(banObj);
      await banDoc.save();

      // Update user status
      await UserModel.updateOne(
        { id: userId },
        { status: 'banned', updatedAt: new Date() }
      );

      console.log(`✅ User ${userId} manually banned by ${adminId || 'admin'}`);
      return banDoc.toObject();
    } catch (err) {
      console.error('MongoDB banUser failed:', err);
      return null;
    }
  }

  /**
   * Unban user (admin action)
   */
  static async unbanUser(userId: string, adminId?: string): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('MongoDB not connected, cannot unban user');
      return false;
    }

    try {
      // Deactivate all active bans
      await BanHistoryModel.updateMany(
        { userId, isActive: true },
        { isActive: false }
      );

      // Update user status to active
      await UserModel.updateOne(
        { id: userId },
        { status: 'active', updatedAt: new Date() }
      );

      console.log(`✅ User ${userId} unbanned by ${adminId || 'admin'}`);
      return true;
    } catch (err) {
      console.error('MongoDB unbanUser failed:', err);
      return false;
    }
  }

  /**
   * Get all bans for a user
   */
  static async getUserBanHistory(userId: string): Promise<any[]> {
    if (this.isConnected) {
      try {
        return await BanHistoryModel.find({ userId }).sort({ bannedAt: -1 }).lean();
      } catch (err) {
        console.error('MongoDB getUserBanHistory failed:', err);
      }
    }
    return [];
  }

  /**
   * Set user online/offline status
   */
  static async setUserOnlineStatus(userId: string, isOnline: boolean): Promise<boolean> {
    if (this.isConnected) {
      try {
        await UserModel.updateOne(
          { id: userId },
          { isOnline, updatedAt: new Date() }
        );
        return true;
      } catch (err) {
        console.error('MongoDB setUserOnlineStatus failed:', err);
        return false;
      }
    }
    // Update in-memory fallback
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  /* ---------- Admin Operations ---------- */

  private static async ensureOwnerUserAccount(params: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<IUserDoc | null> {
    if (!this.isConnected) {
      console.warn('MongoDB not connected, cannot ensure owner user account');
      return null;
    }

    const normalizedEmail = params.email.trim().toLowerCase();
    const now = new Date();

    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) {
      const updates: Record<string, any> = {};

      if (existing.role !== 'super_admin') {
        updates.role = 'super_admin';
      }
      if (existing.subscriptionLevel !== 'normal') {
        updates.subscriptionLevel = 'normal';
      }
      if (existing.verificationStatus !== 'verified' || !existing.isVerified) {
        updates.verificationStatus = 'verified';
        updates.isVerified = true;
      }
      if (existing.status !== 'active') {
        updates.status = 'active';
      }
      if (!existing.isVerified) {
        updates.isVerified = true;
      }
      if (normalizedEmail && existing.email !== normalizedEmail) {
        updates.email = normalizedEmail;
      }
      if (!existing.username && params.username) {
        updates.username = params.username;
      }
      if (!existing.deviceId) {
        updates.deviceId = this.generateId('device-');
      }
      if (params.passwordHash && existing.passwordHash !== params.passwordHash) {
        updates.passwordHash = params.passwordHash;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = now;
        updates.lastActiveAt = now;
        await UserModel.updateOne({ _id: existing._id }, { $set: updates });
        const refreshed = await UserModel.findOne({ _id: existing._id }).lean();
        return refreshed as IUserDoc | null;
      }

      return existing.toObject ? (existing.toObject() as IUserDoc) : (existing as unknown as IUserDoc);
    }

    const userDoc: Partial<IUserDoc> & { id: string; deviceId: string } = {
      id: this.generateId('user-'),
      deviceId: this.generateId('device-'),
      email: normalizedEmail,
      username: params.username || normalizedEmail,
      passwordHash: params.passwordHash,
      role: 'super_admin',
      subscriptionLevel: 'normal',
      verificationStatus: 'verified',
      status: 'active',
      isVerified: true,
      coins: 0,
      totalChats: 0,
      dailyChats: 0,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now
    };

    const created = await UserModel.create(userDoc);
    console.log('👑 Ensured owner user account exists');
    return created.toObject() as IUserDoc;
  }

  private static async seedOwnerAdmin(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const configuredEmailRaw = process.env.OWNER_ADMIN_EMAIL || process.env.DEV_ADMIN_EMAIL;
      const email = (configuredEmailRaw || '').trim().toLowerCase();
      if (!email) {
        console.warn('⚠️ OWNER_ADMIN_EMAIL not configured. Skipping owner admin seed.');
        return;
      }

      const configuredUsername = process.env.OWNER_ADMIN_USERNAME || process.env.DEV_ADMIN_USERNAME;
      const username = (configuredUsername || email).trim();

      const hashFromEnv = (process.env.OWNER_ADMIN_PASSWORD_HASH || process.env.DEV_ADMIN_PASSWORD_HASH || '').trim();
      const roundsEnv = Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
      const resolvedRounds = Number.isFinite(roundsEnv) && roundsEnv >= 4 ? roundsEnv : 12;

      const resolveDesiredPassword = () => {
        if (hashFromEnv) {
          return {
            source: 'env-hash' as const,
            hash: hashFromEnv,
            plain: undefined
          };
        }

        const plainCandidate = (process.env.OWNER_ADMIN_PASSWORD || process.env.DEV_ADMIN_PASSWORD || '').trim();
        if (!plainCandidate) {
          return null;
        }

        return {
          source: 'env-password' as const,
          plain: plainCandidate
        };
      };

      const ensurePasswordHash = async (currentHash: string | undefined | null, desired: ReturnType<typeof resolveDesiredPassword> | null) => {
        if (!desired) {
          return { needsUpdate: false, nextHash: currentHash ?? null, source: 'unknown' as const };
        }

        if (desired.source === 'env-hash' && desired.hash) {
          if (!currentHash || currentHash !== desired.hash) {
            return { needsUpdate: true, nextHash: desired.hash, source: desired.source };
          }
          return { needsUpdate: false, nextHash: currentHash, source: desired.source };
        }

        const plain = desired.plain;
        if (!plain) {
          return { needsUpdate: false, nextHash: currentHash ?? null, source: desired.source };
        }

        if (currentHash && currentHash.startsWith('$2')) {
          const matches = await bcrypt.compare(plain, currentHash);
          if (matches) {
            return { needsUpdate: false, nextHash: currentHash, source: desired.source };
          }
        }

        const nextHash = await bcrypt.hash(plain, resolvedRounds);
        return { needsUpdate: true, nextHash, source: desired.source };
      };

      const desiredPassword = resolveDesiredPassword();

      const ownerAdmin = await AdminModel.findOne({ email }).lean();
      const passwordResolution = await ensurePasswordHash(ownerAdmin?.passwordHash ?? null, desiredPassword);
      const effectiveHash = passwordResolution.nextHash || ownerAdmin?.passwordHash || null;

      if (!effectiveHash) {
        console.warn('⚠️ Unable to ensure owner admin: missing password configuration.');
        return;
      }

      await this.ensureOwnerUserAccount({
        email,
        username,
        passwordHash: effectiveHash
      });

      if (ownerAdmin) {
        const setFields: any = {
          role: 'super_admin',
          isOwner: true,
          isActive: true,
          updatedAt: new Date()
        };

        let requiresUpdate = false;

        if (ownerAdmin.role !== 'super_admin' || !ownerAdmin.isOwner || !ownerAdmin.isActive) {
          requiresUpdate = true;
        }

        if (passwordResolution.needsUpdate && passwordResolution.nextHash) {
          setFields.passwordHash = passwordResolution.nextHash;
          requiresUpdate = true;
          console.log('🔐 Owner admin password hash refreshed from', passwordResolution.source);
        }

        const unsetFields: any = {};
        if ((ownerAdmin as any).password) {
          unsetFields.password = '';
          requiresUpdate = true;
        }

        if (requiresUpdate) {
          const updatePayload: any = { $set: setFields };
          if (Object.keys(unsetFields).length > 0) {
            updatePayload.$unset = unsetFields;
          }
          await AdminModel.updateOne({ _id: ownerAdmin._id }, updatePayload);
        }
        return;
      }

      const adminData = {
        id: this.generateId('admin-'),
        username,
        email,
        passwordHash: effectiveHash,
        role: 'super_admin',
        permissions: [
          'view_users',
          'ban_users',
          'unban_users',
          'view_reports',
          'resolve_reports',
          'manage_reports',
          'manage_users',
          'view_stats',
          'view_analytics',
          'manage_status',
          'manage_admins',
          'manage_settings'
        ],
        isActive: true,
        isOwner: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await AdminModel.create(adminData);
      console.log('👑 Seeded owner admin account:', username);

      // No warning needed; password must come via environment.
    } catch (error) {
      console.error('⚠️ Failed to seed owner admin account:', error);
    }
  }

  /**
   * Create admin user
   */
  static async createAdmin(adminData: { username: string; email: string; passwordHash: string; role?: string }): Promise<any | null> {
    if (!this.isConnected) {
      console.warn('MongoDB not connected, cannot create admin');
      return null;
    }

    try {
      const adminObj = {
        id: this.generateId('admin-'),
        username: adminData.username,
        email: adminData.email,
        passwordHash: adminData.passwordHash,
        role: (adminData.role as any) || 'moderator',
        permissions: this.getDefaultPermissions(adminData.role as any || 'moderator'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const adminDoc = new AdminModel(adminObj);
      await adminDoc.save();
      
      console.log(`✅ Admin created: ${adminData.username}`);
      return adminDoc.toObject();
    } catch (err) {
      console.error('MongoDB createAdmin failed:', err);
      return null;
    }
  }

  static async updateAdminPassword(
    adminId: string,
    passwordHash: string,
    options?: { removeLegacyPassword?: boolean }
  ): Promise<void> {
    if (!this.isConnected || !adminId) {
      return;
    }

    try {
      const matchers: any[] = [{ id: adminId }];
      if (mongoose.Types.ObjectId.isValid(adminId)) {
        matchers.push({ _id: new mongoose.Types.ObjectId(adminId) });
      }

      const update: any = {
        $set: {
          passwordHash,
          updatedAt: new Date()
        }
      };

      if (options?.removeLegacyPassword) {
        update.$unset = { password: '' };
      }

      await AdminModel.updateOne({ $or: matchers }, update);
    } catch (err) {
      console.error('MongoDB updateAdminPassword failed:', err);
    }
  }

  /**
   * Find admin by username
   */
  static async findAdminByUsername(username: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        return await AdminModel.findOne({ username, isActive: true }).lean();
      } catch (err) {
        console.error('MongoDB findAdminByUsername failed:', err);
      }
    }
    return null;
  }

  /**
   * Find admin by email
   */
  static async findAdminByEmail(email: string): Promise<any | null> {
    if (this.isConnected) {
      try {
        return await AdminModel.findOne({ email, isActive: true }).lean();
      } catch (err) {
        console.error('MongoDB findAdminByEmail failed:', err);
      }
    }
    return null;
  }

  /**
   * Update admin last login
   */
  static async updateAdminLastLogin(adminId: string): Promise<void> {
    if (this.isConnected) {
      try {
        const matchers: any[] = [{ id: adminId }];
        if (mongoose.Types.ObjectId.isValid(adminId)) {
          matchers.push({ _id: new mongoose.Types.ObjectId(adminId) });
        }

        await AdminModel.updateOne(
          { $or: matchers },
          { lastLoginAt: new Date(), updatedAt: new Date() }
        );
      } catch (err) {
        console.error('MongoDB updateAdminLastLogin failed:', err);
      }
    }
  }

  /**
   * Get all admins
   */
  static async getAllAdmins(): Promise<any[]> {
    if (this.isConnected) {
      try {
        return await AdminModel.find({}).sort({ createdAt: -1 }).lean();
      } catch (err) {
        console.error('MongoDB getAllAdmins failed:', err);
      }
    }
    return [];
  }

  /**
   * Get default permissions by role
   */
  private static getDefaultPermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      super_admin: ['all'],
      admin: ['view_users', 'ban_users', 'view_reports', 'resolve_reports', 'view_stats', 'view_analytics', 'manage_status'],
      moderator: ['view_users', 'view_reports', 'resolve_reports']
    };
    return permissionMap[role] || permissionMap.moderator;
  }

  private static buildAdminUsername(user: any): string {
    const email = typeof user?.email === 'string' ? user.email.trim().toLowerCase() : '';
    if (email) {
      return email;
    }

    const username = typeof user?.username === 'string' ? user.username.trim().toLowerCase() : '';
    if (username) {
      return username;
    }

    return `admin-${String(user?.id || this.generateId('anon-')).toLowerCase()}`;
  }

  private static async ensureAdminAccountFromUser(user: any): Promise<any | null> {
    if (!user || !user.id) {
      return null;
    }

    const username = this.buildAdminUsername(user);
    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : undefined;
  const ownerEmail = (process.env.OWNER_ADMIN_EMAIL || process.env.DEV_ADMIN_EMAIL || '').trim().toLowerCase();
  const isOwner = Boolean(email && ownerEmail && email === ownerEmail);
  const role = (user.role === 'super_admin' || isOwner) ? 'super_admin' : 'admin';

    const now = new Date();

    if (this.isConnected) {
      try {
        const filters: any[] = [{ userId: user.id }];
        if (email) {
          filters.push({ email });
        }
        filters.push({ username });

        const updateDoc: Record<string, any> = {
          userId: user.id,
          username,
          email: email || `${username}@omegoo.local`,
          passwordHash: user.passwordHash,
          role,
          permissions: this.getDefaultPermissions(role),
          isActive: true,
          updatedAt: now
        };

        if (isOwner) {
          updateDoc.isOwner = true;
        }

        const adminDoc = await AdminModel.findOneAndUpdate(
          { $or: filters },
          {
            $set: updateDoc,
            $setOnInsert: {
              id: this.generateId('admin-'),
              createdAt: now
            }
          },
          { new: true, upsert: true }
        ).lean();

        return adminDoc;
      } catch (err) {
        console.error('MongoDB ensureAdminAccountFromUser failed:', err);
        return null;
      }
    }

    // In-memory fallback
    const existing = Array.from(this.admins.values()).find((admin: any) => admin.userId === user.id || admin.email === email);
    const payload = {
      id: existing?.id || this.generateId('admin-'),
      userId: user.id,
      username,
      email: email || `${username}@omegoo.local`,
      passwordHash: user.passwordHash,
      role,
      permissions: this.getDefaultPermissions(role),
      isActive: true,
      isOwner: existing?.isOwner || isOwner,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    this.admins.set(payload.id, { ...existing, ...payload });
    return payload;
  }

  private static async deactivateAdminForUser(user: any): Promise<void> {
    if (!user) {
      return;
    }

    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : undefined;

    if (this.isConnected) {
      try {
        const filters: any[] = [{ userId: user.id }];
        if (email) {
          filters.push({ email });
        }

        await AdminModel.updateMany(
          { $or: filters },
          {
            $set: {
              isActive: false,
              updatedAt: new Date(),
              role: 'moderator',
              permissions: this.getDefaultPermissions('moderator')
            }
          }
        );
      } catch (err) {
        console.error('MongoDB deactivateAdminForUser failed:', err);
      }
      return;
    }

    for (const [id, admin] of this.admins.entries()) {
      if (admin.userId === user.id || (email && admin.email?.toLowerCase() === email)) {
        this.admins.set(id, {
          ...admin,
          isActive: false,
          role: 'moderator',
          permissions: this.getDefaultPermissions('moderator'),
          updatedAt: new Date()
        });
      }
    }
  }

  private static async refreshAdminPasswordForUser(user: any): Promise<void> {
    if (!user?.id || !user.passwordHash) {
      return;
    }

    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : undefined;
    const now = new Date();

    if (this.isConnected) {
      try {
        const filters: any[] = [{ userId: user.id }];
        if (email) {
          filters.push({ email });
        }

        await AdminModel.updateMany(
          { $or: filters },
          {
            $set: {
              passwordHash: user.passwordHash,
              updatedAt: now
            }
          }
        );
      } catch (err) {
        console.error('MongoDB refreshAdminPasswordForUser failed:', err);
      }
      return;
    }

    for (const [id, admin] of this.admins.entries()) {
      if (admin.userId === user.id || (email && admin.email?.toLowerCase() === email)) {
        this.admins.set(id, {
          ...admin,
          passwordHash: user.passwordHash,
          updatedAt: now
        });
      }
    }
  }

  static async syncAdminAccessForRole(userId: string, role: 'guest' | 'user' | 'admin' | 'super_admin'): Promise<any | null> {
    if (!userId) {
      return null;
    }

    const user = await this.getUserById(userId);
    if (!user) {
      return null;
    }

    if (role === 'admin' || role === 'super_admin') {
      if (!user.passwordHash) {
        console.warn('syncAdminAccessForRole skipped: user missing password', { userId });
        return null;
      }
      const updatedUser = await this.updateUser(userId, {
        role,
        verificationStatus: 'verified',
        isVerified: true
      } as Partial<IUserDoc>);

      const effectiveUser = updatedUser || { ...user, role, verificationStatus: 'verified', isVerified: true };
      return this.ensureAdminAccountFromUser(effectiveUser);
    }

    const downgradedUser = await this.updateUser(userId, {
      role: 'user',
      verificationStatus: role === 'guest' ? 'guest' : (user.verificationStatus || 'guest'),
      isVerified: role === 'guest' ? false : user.isVerified
    } as Partial<IUserDoc>);
    await this.deactivateAdminForUser(downgradedUser || user);
    return null;
  }

  /**
   * Get all pending reports
   */
  static async getPendingReports(limit: number = 50): Promise<any[]> {
    if (this.isConnected) {
      try {
        return await ModerationReportModel.find({ status: 'pending' })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
      } catch (err) {
        console.error('MongoDB getPendingReports failed:', err);
      }
    }
    return [];
  }

  /**
   * Get reports filtered by status
   */
  static async getReportsByStatus(status: string, limit: number = 100): Promise<any[]> {
    if (this.isConnected) {
      try {
        return await ModerationReportModel.find({ status })
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
      } catch (err) {
        console.error('MongoDB getReportsByStatus failed:', err);
      }
    }
    return [];
  }

  /**
   * Get all reports (all statuses)
   */
  static async getAllReports(limit: number = 100): Promise<any[]> {
    if (this.isConnected) {
      try {
        return await ModerationReportModel.find({})
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
      } catch (err) {
        console.error('MongoDB getAllReports failed:', err);
      }
    }
    return [];
  }

  /**
   * Get all reports for a specific user
   */
  static async getUserReports(userId: string): Promise<any[]> {
    if (this.isConnected) {
      try {
        return await ModerationReportModel.find({ reportedUserId: userId })
          .sort({ createdAt: -1 })
          .lean();
      } catch (err) {
        console.error('MongoDB getUserReports failed:', err);
      }
    }
    return [];
  }

  /**
   * Update report status
   */
  static async updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved'): Promise<any | null> {
    if (this.isConnected) {
      try {
        console.log('🔄 Updating report status in DB:', { reportId, status });
        
        const result = await ModerationReportModel.findOneAndUpdate(
          { id: reportId },
          { status },
          { new: true } // Return updated document
        ).lean();
        
        if (result) {
          console.log('✅ Report updated successfully:', { id: result.id, newStatus: result.status });
          return result;
        } else {
          console.log('❌ Report not found for update:', reportId);
          return null;
        }
      } catch (err) {
        console.error('❌ MongoDB updateReportStatus failed:', err);
        return null;
      }
    }
    console.log('❌ MongoDB not connected');
    return null;
  }

  /**
   * Get platform statistics
   */
  static async getPlatformStats(): Promise<any> {
    if (this.isConnected) {
      try {
        const [totalUsers, activeUsers, bannedUsers, totalReports, pendingReports, totalSessions] = await Promise.all([
          UserModel.countDocuments(),
          UserModel.countDocuments({ isOnline: true }),
          UserModel.countDocuments({ status: 'banned' }),
          ModerationReportModel.countDocuments(),
          ModerationReportModel.countDocuments({ status: 'pending' }),
          ChatSessionModel.countDocuments()
        ]);

        return {
          totalUsers,
          activeUsers,
          bannedUsers,
          totalReports,
          pendingReports,
          totalSessions
        };
      } catch (err) {
        console.error('MongoDB getPlatformStats failed:', err);
      }
    }
    return {
      totalUsers: 0,
      activeUsers: 0,
      bannedUsers: 0,
      totalReports: 0,
      pendingReports: 0,
      totalSessions: 0
    };
  }

  static async getUserGrowthMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<UserGrowthSummary> {
    const startDay = new Date(start.getTime());
    startDay.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(end.getTime());
    endDay.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(startDay.getTime()) || Number.isNaN(endDay.getTime()) || startDay > endDay) {
      throw new Error('Invalid date range for user growth metrics');
    }

    const endOfDay = new Date(endDay.getTime());
    endOfDay.setUTCHours(23, 59, 59, 999);

    const dateKeys = buildGrowthDateRange(startDay, endDay);
    const dateSet = new Set(dateKeys);

    const sanitizeFilterList = (values?: string[]): string[] | null => {
      if (!values || values.length === 0) {
        return null;
      }

      const normalized = values
        .map((value) => normalizeSegmentValue(value))
        .filter((value) => value && value !== 'all' && value !== 'any' && value !== '*');

      return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
    };

    const filtersNormalized = {
      genders: sanitizeFilterList(filters.genders),
      platforms: sanitizeFilterList(filters.platforms),
      signupSources: sanitizeFilterList(filters.signupSources),
      campaigns: sanitizeFilterList(filters.campaigns)
    };

    const matchesFilters = (record: { gender?: string; platform?: string; signupSource?: string; campaignId?: string }): boolean => {
      const genderValue = normalizeSegmentValue(record.gender);
      const platformValue = normalizeSegmentValue(record.platform);
      const signupValue = normalizeSegmentValue(record.signupSource);
      const campaignValue = normalizeSegmentValue(record.campaignId);

      if (filtersNormalized.genders && !filtersNormalized.genders.includes(genderValue)) {
        return false;
      }

      if (filtersNormalized.platforms && !filtersNormalized.platforms.includes(platformValue)) {
        return false;
      }

      if (filtersNormalized.signupSources && !filtersNormalized.signupSources.includes(signupValue)) {
        return false;
      }

      if (filtersNormalized.campaigns && !filtersNormalized.campaigns.includes(campaignValue)) {
        return false;
      }

      return true;
    };

    const computeSummary = (records: Array<{
      id: string;
      createdAt?: Date;
      lastActiveAt?: Date;
      updatedAt?: Date;
      gender?: string;
      platform?: string;
      signupSource?: string;
      campaignId?: string;
    }>): UserGrowthSummary => {
      const filteredRecords = records.filter((record) => matchesFilters(record));

      const newByDay = new Map<string, Set<string>>();
      const returningByDay = new Map<string, Set<string>>();
      const uniqueRangeUsers = new Set<string>();
      const uniqueNewUsers = new Set<string>();
      const uniqueReturningUsers = new Set<string>();

      filteredRecords.forEach((record) => {
        const createdKey = toGrowthDateKey(record.createdAt ?? null);
        const activityKey = toGrowthDateKey(record.lastActiveAt ?? record.updatedAt ?? record.createdAt ?? null);

        if (createdKey && dateSet.has(createdKey)) {
          if (!newByDay.has(createdKey)) {
            newByDay.set(createdKey, new Set());
          }
          newByDay.get(createdKey)!.add(record.id);
          uniqueNewUsers.add(record.id);
          uniqueRangeUsers.add(record.id);
        }

        if (activityKey && dateSet.has(activityKey)) {
          const createdBeforeActivity = !createdKey || createdKey < activityKey;
          if (createdBeforeActivity) {
            if (!returningByDay.has(activityKey)) {
              returningByDay.set(activityKey, new Set());
            }
            returningByDay.get(activityKey)!.add(record.id);
            uniqueReturningUsers.add(record.id);
            uniqueRangeUsers.add(record.id);
          }
        }
      });

      const daily = dateKeys.map((date) => {
        const newUsersSet = newByDay.get(date) || new Set<string>();
        const returningUsersSet = returningByDay.get(date) || new Set<string>();
        const totalUsersSet = new Set<string>([...newUsersSet, ...returningUsersSet]);

        totalUsersSet.forEach((id) => uniqueRangeUsers.add(id));

        return {
          date,
          newUsers: newUsersSet.size,
          returningUsers: returningUsersSet.size,
          totalUsers: totalUsersSet.size
        };
      });

      return {
        window: {
          start: dateKeys[0] ?? toGrowthDateKey(startDay) ?? '',
          end: dateKeys[dateKeys.length - 1] ?? toGrowthDateKey(endDay) ?? '',
          days: dateKeys.length
        },
        totals: {
          newUsers: uniqueNewUsers.size,
          returningUsers: uniqueReturningUsers.size,
          totalUsers: uniqueRangeUsers.size
        },
        daily
      };
    };

    if (this.isConnected) {
      const records = await UserModel.find(
        {
          $or: [
            { createdAt: { $gte: startDay, $lte: endOfDay } },
            { lastActiveAt: { $gte: startDay, $lte: endOfDay } }
          ]
        },
        { id: 1, createdAt: 1, lastActiveAt: 1, updatedAt: 1, gender: 1, platform: 1, signupSource: 1, campaignId: 1 }
      ).lean();

      return computeSummary(records.map((record) => ({
        id: record.id,
        createdAt: record.createdAt,
        lastActiveAt: record.lastActiveAt,
        updatedAt: record.updatedAt,
        gender: record.gender,
        platform: record.platform,
        signupSource: record.signupSource,
        campaignId: record.campaignId
      })));
    }

    return computeSummary(Array.from(this.users.values()).map((user: any) => ({
      id: user.id,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      updatedAt: user.updatedAt,
      gender: user.gender,
      platform: user.platform,
      signupSource: user.signupSource,
      campaignId: user.campaignId
    })));
  }

  static async getUserRetentionMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<UserRetentionSummary> {
    const startDay = new Date(start.getTime());
    startDay.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(end.getTime());
    endDay.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(startDay.getTime()) || Number.isNaN(endDay.getTime()) || startDay > endDay) {
      throw new Error('Invalid date range for retention metrics');
    }

    const windowDays = Math.floor((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1;
    const offsetCap = Math.max(0, windowDays - 1);
    const allowedOffsets = RETENTION_BUCKET_OFFSETS.filter((offset) => offset === 0 || offset <= offsetCap);
    if (!allowedOffsets.includes(0)) {
      allowedOffsets.unshift(0);
    }
    const maxOffset = allowedOffsets[allowedOffsets.length - 1] ?? 0;

    const sanitizeFilterList = (values?: string[]): string[] | null => {
      if (!values || values.length === 0) {
        return null;
      }

      const normalized = values
        .map((value) => normalizeSegmentValue(value))
        .filter((value) => value && value !== 'all' && value !== 'any' && value !== '*');

      return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
    };

    const filtersNormalized = {
      genders: sanitizeFilterList(filters.genders),
      platforms: sanitizeFilterList(filters.platforms),
      signupSources: sanitizeFilterList(filters.signupSources),
      campaigns: sanitizeFilterList(filters.campaigns)
    };

    const matchesFilters = (record: { gender?: string; platform?: string; signupSource?: string; campaignId?: string }): boolean => {
      const genderValue = normalizeSegmentValue(record.gender);
      const platformValue = normalizeSegmentValue(record.platform);
      const signupValue = normalizeSegmentValue(record.signupSource);
      const campaignValue = normalizeSegmentValue(record.campaignId);

      if (filtersNormalized.genders && !filtersNormalized.genders.includes(genderValue)) {
        return false;
      }
      if (filtersNormalized.platforms && !filtersNormalized.platforms.includes(platformValue)) {
        return false;
      }
      if (filtersNormalized.signupSources && !filtersNormalized.signupSources.includes(signupValue)) {
        return false;
      }
      if (filtersNormalized.campaigns && !filtersNormalized.campaigns.includes(campaignValue)) {
        return false;
      }

      return true;
    };

    const emptySummary = (): UserRetentionSummary => ({
      window: {
        start: toGrowthDateKey(startDay) ?? '',
        end: toGrowthDateKey(endDay) ?? '',
        cohorts: 0
      },
      maxOffset,
      averages: [],
      cohorts: []
    });

    if (!this.isConnected) {
      return emptySummary();
    }

    const userRecords = await UserModel.find(
      {
        createdAt: { $gte: startDay, $lte: endDay }
      },
      {
        id: 1,
        gender: 1,
        platform: 1,
        signupSource: 1,
        campaignId: 1,
        createdAt: 1,
        lastActiveAt: 1,
        updatedAt: 1
      }
    ).lean();

    const cohorts = new Map<string, Set<string>>();
    const userActivity = new Map<string, Set<string>>();
    const userIdSet = new Set<string>();

    for (const record of userRecords) {
      if (!matchesFilters(record)) {
        continue;
      }

      const recordId = typeof record.id === 'string' ? record.id : record._id ? String(record._id) : null;
      if (!recordId) {
        continue;
      }

      const createdAt = record.createdAt ? new Date(record.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) {
        continue;
      }

      const cohortKey = toGrowthDateKey(createdAt);
      if (!cohortKey) {
        continue;
      }

      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, new Set());
      }
      cohorts.get(cohortKey)!.add(recordId);
      userIdSet.add(recordId);

      if (!userActivity.has(recordId)) {
        userActivity.set(recordId, new Set());
      }

      const activity = userActivity.get(recordId)!;
      const lastActiveKey = toGrowthDateKey(record.lastActiveAt ?? null);
      if (lastActiveKey) {
        activity.add(lastActiveKey);
      }
      const updatedKey = toGrowthDateKey(record.updatedAt ?? null);
      if (updatedKey) {
        activity.add(updatedKey);
      }
    }

    if (cohorts.size === 0 || userIdSet.size === 0) {
      return emptySummary();
    }

    const userIdList = Array.from(userIdSet);
    const activityUpperBound = addUtcDays(endDay, maxOffset);

    const sessionRecords = await ChatSessionModel.find(
      {
        $and: [
          {
            $or: [
              { user1Id: { $in: userIdList } },
              { user2Id: { $in: userIdList } }
            ]
          },
          {
            $or: [
              { createdAt: { $gte: startDay, $lte: activityUpperBound } },
              { startedAt: { $gte: startDay, $lte: activityUpperBound } },
              { updatedAt: { $gte: startDay, $lte: activityUpperBound } }
            ]
          }
        ]
      },
      {
        user1Id: 1,
        user2Id: 1,
        createdAt: 1,
        startedAt: 1,
        updatedAt: 1
      }
    ).lean();

    for (const session of sessionRecords) {
      const timestamp = session.startedAt ?? session.createdAt ?? session.updatedAt ?? null;
      if (!timestamp) {
        continue;
      }

      const sessionDate = new Date(timestamp);
      if (Number.isNaN(sessionDate.getTime())) {
        continue;
      }

      sessionDate.setUTCHours(0, 0, 0, 0);
      if (sessionDate < startDay || sessionDate > activityUpperBound) {
        continue;
      }

      const sessionKey = toGrowthDateKey(sessionDate);
      if (!sessionKey) {
        continue;
      }

      const participants = [session.user1Id, session.user2Id];
      for (const participant of participants) {
        if (!participant) {
          continue;
        }
        const activity = userActivity.get(participant);
        if (activity) {
          activity.add(sessionKey);
        }
      }
    }

    const cohortEntries = Array.from(cohorts.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    const retentionCohorts = cohortEntries.map<RetentionCohortSummary>(([cohortKey, userIds]) => {
      const cohortDate = new Date(`${cohortKey}T00:00:00Z`);
      if (Number.isNaN(cohortDate.getTime())) {
        return {
          cohort: cohortKey,
          size: userIds.size,
          buckets: []
        };
      }

      const cohortUsers = Array.from(userIds);
      const cohortSize = cohortUsers.length;
      if (cohortSize === 0) {
        return {
          cohort: cohortKey,
          size: 0,
          buckets: []
        };
      }

      const buckets = allowedOffsets.map((offset) => {
        const targetDate = addUtcDays(cohortDate, offset);
        const targetKey = toGrowthDateKey(targetDate) ?? cohortKey;

        if (offset === 0) {
          return {
            offset,
            date: targetKey,
            retainedUsers: cohortSize,
            retentionRate: 100
          };
        }

        let retainedUsers = 0;
        for (const userId of cohortUsers) {
          const activity = userActivity.get(userId);
          if (activity?.has(targetKey)) {
            retainedUsers += 1;
          }
        }

        return {
          offset,
          date: targetKey,
          retainedUsers,
          retentionRate: toPercentage(retainedUsers, cohortSize)
        };
      });

      return {
        cohort: cohortKey,
        size: cohortSize,
        buckets
      };
    });

    const aggregateMap = new Map<number, { retained: number; total: number }>();
    for (const cohort of retentionCohorts) {
      for (const bucket of cohort.buckets) {
        if (bucket.offset === 0) {
          continue;
        }
        const current = aggregateMap.get(bucket.offset) ?? { retained: 0, total: 0 };
        current.retained += bucket.retainedUsers;
        current.total += cohort.size;
        aggregateMap.set(bucket.offset, current);
      }
    }

    const averages = Array.from(aggregateMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([offset, data]) => ({
        offset,
        retentionRate: toPercentage(data.retained, data.total),
        sampleSize: data.total
      }));

    return {
      window: {
        start: toGrowthDateKey(startDay) ?? '',
        end: toGrowthDateKey(endDay) ?? '',
        cohorts: retentionCohorts.length
      },
      maxOffset,
      averages,
      cohorts: retentionCohorts
    };
  }

  static async getFunnelMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<FunnelSummary> {
    const startDay = new Date(start.getTime());
    startDay.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(end.getTime());
    endDay.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(startDay.getTime()) || Number.isNaN(endDay.getTime()) || startDay > endDay) {
      throw new Error('Invalid date range for funnel metrics');
    }

    const sanitizeFilterList = (values?: string[]): string[] | null => {
      if (!values || values.length === 0) {
        return null;
      }

      const normalized = values
        .map((value) => normalizeSegmentValue(value))
        .filter((value) => value && value !== 'all' && value !== 'any' && value !== '*');

      return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
    };

    const filtersNormalized = {
      genders: sanitizeFilterList(filters.genders),
      platforms: sanitizeFilterList(filters.platforms),
      signupSources: sanitizeFilterList(filters.signupSources),
      campaigns: sanitizeFilterList(filters.campaigns)
    };

    const matchesFilters = (record: { gender?: string; platform?: string; signupSource?: string; campaignId?: string }): boolean => {
      const genderValue = normalizeSegmentValue(record.gender);
      const platformValue = normalizeSegmentValue(record.platform);
      const signupValue = normalizeSegmentValue(record.signupSource);
      const campaignValue = normalizeSegmentValue(record.campaignId);

      if (filtersNormalized.genders && !filtersNormalized.genders.includes(genderValue)) {
        return false;
      }
      if (filtersNormalized.platforms && !filtersNormalized.platforms.includes(platformValue)) {
        return false;
      }
      if (filtersNormalized.signupSources && !filtersNormalized.signupSources.includes(signupValue)) {
        return false;
      }
      if (filtersNormalized.campaigns && !filtersNormalized.campaigns.includes(campaignValue)) {
        return false;
      }

      return true;
    };

    const emptySummary = (): FunnelSummary => ({
      window: {
        start: toGrowthDateKey(startDay) ?? '',
        end: toGrowthDateKey(endDay) ?? ''
      },
      funnels: []
    });

    if (!this.isConnected) {
      return emptySummary();
    }

    const userRecords = await UserModel.find(
      {
        createdAt: { $gte: startDay, $lte: endDay }
      },
      {
        id: 1,
        gender: 1,
        platform: 1,
        signupSource: 1,
        campaignId: 1,
        createdAt: 1,
        lastActiveAt: 1,
        updatedAt: 1,
        totalChats: 1,
        subscriptionLevel: 1,
        verificationStatus: 1,
        isVerified: 1,
        subscription: 1
      }
    ).lean();

    const filteredRecords = userRecords.filter((record) => matchesFilters(record));
    if (!filteredRecords.length) {
      return emptySummary();
    }

    const userIdSet = new Set<string>();
    const userActivity = new Map<string, Set<string>>();
    const sessionCounts = new Map<string, number>();

    for (const record of filteredRecords) {
      const recordId = typeof record.id === 'string' ? record.id : record._id ? String(record._id) : null;
      if (!recordId) {
        continue;
      }

      userIdSet.add(recordId);
      userActivity.set(recordId, new Set());
      sessionCounts.set(recordId, 0);

      const activity = userActivity.get(recordId)!;
      const lastActiveKey = toGrowthDateKey(record.lastActiveAt ?? null);
      if (lastActiveKey) {
        activity.add(lastActiveKey);
      }
      const updatedKey = toGrowthDateKey(record.updatedAt ?? null);
      if (updatedKey) {
        activity.add(updatedKey);
      }
    }

    const userIdList = Array.from(userIdSet);
    const sessionRecords = await ChatSessionModel.find(
      {
        $and: [
          {
            $or: [
              { user1Id: { $in: userIdList } },
              { user2Id: { $in: userIdList } }
            ]
          },
          {
            $or: [
              { createdAt: { $gte: startDay, $lte: endDay } },
              { startedAt: { $gte: startDay, $lte: endDay } },
              { updatedAt: { $gte: startDay, $lte: endDay } }
            ]
          }
        ]
      },
      {
        user1Id: 1,
        user2Id: 1,
        createdAt: 1,
        startedAt: 1,
        updatedAt: 1
      }
    ).lean();

    for (const session of sessionRecords) {
      const timestamp = session.startedAt ?? session.createdAt ?? session.updatedAt ?? null;
      if (!timestamp) {
        continue;
      }

      const sessionDate = new Date(timestamp);
      if (Number.isNaN(sessionDate.getTime())) {
        continue;
      }

      sessionDate.setUTCHours(0, 0, 0, 0);
      if (sessionDate < startDay || sessionDate > endDay) {
        continue;
      }

      const sessionKey = toGrowthDateKey(sessionDate);
      if (!sessionKey) {
        continue;
      }

      const participants = [session.user1Id, session.user2Id];
      for (const participant of participants) {
        if (!participant || !userActivity.has(participant)) {
          continue;
        }
        const activity = userActivity.get(participant);
        if (activity) {
          activity.add(sessionKey);
        }
        sessionCounts.set(participant, (sessionCounts.get(participant) ?? 0) + 1);
      }
    }

    for (const record of filteredRecords) {
      const recordId = typeof record.id === 'string' ? record.id : record._id ? String(record._id) : null;
      if (!recordId) {
        continue;
      }
      const totalChats = record.totalChats ?? 0;
      if (totalChats > (sessionCounts.get(recordId) ?? 0)) {
        sessionCounts.set(recordId, totalChats);
      }
    }

    type FunnelContext = {
      user: any;
      chatCount: number;
      activity: Set<string>;
    };

    const contexts: FunnelContext[] = filteredRecords
      .map((record) => {
        const recordId = typeof record.id === 'string' ? record.id : record._id ? String(record._id) : null;
        if (!recordId) {
          return null;
        }

        return {
          user: record,
          chatCount: sessionCounts.get(recordId) ?? 0,
          activity: userActivity.get(recordId) ?? new Set<string>()
        };
      })
      .filter((value): value is FunnelContext => value !== null);

    const hasRecentActivity = (activity: Set<string>, days: number): boolean => {
      if (!activity.size) {
        return false;
      }

      const threshold = new Date(endDay.getTime() - days * DAY_MS);
      threshold.setUTCHours(0, 0, 0, 0);

      for (const dateKey of activity) {
        const date = new Date(`${dateKey}T00:00:00Z`);
        if (Number.isNaN(date.getTime())) {
          continue;
        }
        if (date >= threshold) {
          return true;
        }
      }

      return false;
    };

    const funnelDefinitions = [
      {
        id: 'onboarding',
        name: 'Onboarding funnel',
        description: 'Signup → verification → first chat → premium',
        steps: [
          { id: 'signed_up', label: 'Signed up', predicate: (_ctx: FunnelContext) => true },
          { id: 'verified', label: 'Verified profile', predicate: (ctx: FunnelContext) => ctx.user.verificationStatus === 'verified' || ctx.user.isVerified },
          { id: 'first_chat', label: 'First chat', predicate: (ctx: FunnelContext) => ctx.chatCount > 0 },
          { id: 'three_sessions', label: '3+ sessions', predicate: (ctx: FunnelContext) => ctx.chatCount >= 3 },
          { id: 'premium', label: 'Premium plan', predicate: (ctx: FunnelContext) => ctx.user.subscriptionLevel === 'premium' || ctx.user.subscription?.type === 'premium' }
        ]
      },
      {
        id: 'engagement',
        name: 'Engagement funnel',
        description: 'Signup → chats → weekly activity',
        steps: [
          { id: 'signed_up', label: 'Signed up', predicate: (_ctx: FunnelContext) => true },
          { id: 'first_chat', label: 'First chat', predicate: (ctx: FunnelContext) => ctx.chatCount > 0 },
          { id: 'repeat_chat', label: 'Repeat chats (3+)', predicate: (ctx: FunnelContext) => ctx.chatCount >= 3 },
          { id: 'active_7d', label: 'Active past 7 days', predicate: (ctx: FunnelContext) => hasRecentActivity(ctx.activity, 7) },
          { id: 'active_30d', label: 'Active past 30 days', predicate: (ctx: FunnelContext) => hasRecentActivity(ctx.activity, 30) }
        ]
      }
    ];

    const baseTotal = contexts.length;
    if (!baseTotal) {
      return emptySummary();
    }

    const funnels = funnelDefinitions.map((definition) => {
      let currentPool = contexts;
      let previousCount = currentPool.length;

      const steps = definition.steps.map((step, index) => {
        const nextPool = currentPool.filter((ctx) => step.predicate(ctx));
        const count = nextPool.length;
        const conversionRate = toPercentage(count, baseTotal);
        const stepRate = index === 0 ? 100 : toPercentage(count, previousCount);

        currentPool = nextPool;
        previousCount = count;

        return {
          id: step.id,
          label: step.label,
          count,
          conversionRate,
          stepRate
        };
      });

      return {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        totalUsers: baseTotal,
        steps
      };
    });

    return {
      window: {
        start: toGrowthDateKey(startDay) ?? '',
        end: toGrowthDateKey(endDay) ?? ''
      },
      funnels
    };
  }

  static async getEngagementHeatmap(start: Date, end: Date, options: EngagementHeatmapOptions = {}): Promise<EngagementHeatmapSnapshot> {
    const normalizedStart = new Date(start.getTime());
    normalizedStart.setUTCHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end.getTime());
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
      throw new Error('Invalid date range for engagement heatmap');
    }

    const windowEndExclusive = addUtcDays(normalizedEnd, 1);
    const windowDays = Math.floor((normalizedEnd.getTime() - normalizedStart.getTime()) / DAY_MS) + 1;

    const filtersNormalized = normalizeAnalyticsFilters(options.filters ?? {});
    const filtersApplied = Boolean(
      filtersNormalized.genders ||
      filtersNormalized.platforms ||
      filtersNormalized.signupSources ||
      filtersNormalized.campaigns
    );

    const modeFilterSet = (() => {
      if (!options.modes || options.modes.length === 0) {
        return null;
      }
      const normalized = options.modes.map((mode) => normalizeChatMode(mode)).filter(Boolean) as ChatMode[];
      return normalized.length ? new Set(normalized) : null;
    })();

    const rows = Array.from({ length: 7 }, (_, day) => ({
      day,
      label: HEATMAP_DAY_LABELS[day] ?? `Day ${day}`,
      hours: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        totalSessions: 0,
        modeBreakdown: ensureModeBreakdown(),
        uniqueUsers: 0
      }))
    }));

    const bucketUserSets: Array<Array<Set<string>>> = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => new Set<string>())
    );

    const uniqueUsersGlobal = new Set<string>();
    let totalSessions = 0;
    let peak: { day: number; hour: number; totalSessions: number } | null = null;

    const sessions = await this.fetchSessionsInRange(normalizedStart, normalizedEnd);

    const participantUniverse = new Set<string>();
    for (const session of sessions) {
      if (session.user1Id) participantUniverse.add(session.user1Id);
      if (session.user2Id) participantUniverse.add(session.user2Id);
    }

    const userLookup = filtersApplied ? await this.buildUserLookup(participantUniverse) : null;

    const shouldIncludeSession = (participantIds: Set<string>): boolean => {
      if (!filtersApplied) {
        return true;
      }
      if (!participantIds.size || !userLookup) {
        return false;
      }

      for (const participantId of participantIds) {
        if (!participantId) {
          continue;
        }
        const participant = userLookup.get(participantId);
        if (participant && recordMatchesFilters(participant, filtersNormalized)) {
          return true;
        }
      }

      return false;
    };

    for (const session of sessions) {
      const mode = normalizeChatMode(session.mode);
      if (modeFilterSet && !modeFilterSet.has(mode)) {
        continue;
      }

      const startedAt = safeDateFrom(session.startedAt);
      if (!startedAt || startedAt < normalizedStart || startedAt >= windowEndExclusive) {
        continue;
      }

      const dayIndex = startedAt.getUTCDay();
      const hourIndex = startedAt.getUTCHours();

      if (!rows[dayIndex] || !rows[dayIndex].hours[hourIndex]) {
        continue;
      }

      const participantIds = new Set<string>();
      if (session.user1Id) {
        participantIds.add(session.user1Id);
      }
      if (session.user2Id) {
        participantIds.add(session.user2Id);
      }

      if (!shouldIncludeSession(participantIds)) {
        continue;
      }

      const cell = rows[dayIndex].hours[hourIndex];
      cell.totalSessions += 1;
      cell.modeBreakdown[mode] = (cell.modeBreakdown[mode] ?? 0) + 1;

      totalSessions += 1;

      const bucketUsers = bucketUserSets[dayIndex][hourIndex];
      for (const participantId of participantIds) {
        if (!participantId) {
          continue;
        }
        bucketUsers.add(participantId);
        uniqueUsersGlobal.add(participantId);
      }
      cell.uniqueUsers = bucketUsers.size;

      if (!peak || cell.totalSessions > peak.totalSessions) {
        peak = {
          day: dayIndex,
          hour: hourIndex,
          totalSessions: cell.totalSessions
        };
      }
    }

    const modes: ChatMode[] = modeFilterSet
      ? DEFAULT_CHAT_MODES.filter((mode) => modeFilterSet.has(mode))
      : [...DEFAULT_CHAT_MODES];

    return {
      window: {
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? '',
        days: windowDays
      },
      totals: {
        sessions: totalSessions,
        uniqueUsers: uniqueUsersGlobal.size,
        peak: peak ?? undefined
      },
      modes,
      rows
    };
  }

  static async getEngagementSummary(start: Date, end: Date, options: EngagementSummaryOptions = {}): Promise<EngagementSummarySnapshot> {
    const normalizedStart = new Date(start.getTime());
    normalizedStart.setUTCHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end.getTime());
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
      throw new Error('Invalid date range for engagement summary');
    }

    const windowEndExclusive = addUtcDays(normalizedEnd, 1);
    const windowDays = Math.floor((normalizedEnd.getTime() - normalizedStart.getTime()) / DAY_MS) + 1;

    const filtersNormalized = normalizeAnalyticsFilters(options.filters ?? {});
    const filtersApplied = Boolean(
      filtersNormalized.genders ||
      filtersNormalized.platforms ||
      filtersNormalized.signupSources ||
      filtersNormalized.campaigns
    );

    const sessions = await this.fetchSessionsInRange(normalizedStart, normalizedEnd);

    const participantUniverse = new Set<string>();
    for (const session of sessions) {
      if (session.user1Id) participantUniverse.add(session.user1Id);
      if (session.user2Id) participantUniverse.add(session.user2Id);
    }

    const userLookup = await this.buildUserLookup(participantUniverse);

    const perModeSessions: Record<ChatMode, number> = {
      text: 0,
      audio: 0,
      video: 0
    };
    const perUserSessions = new Map<string, number>();
    const uniqueUsers = new Set<string>();
    const durations: number[] = [];

    let totalSessions = 0;
    let completedSessions = 0;
    let activeSessions = 0;

    const matchesFilters = (participantIds: Set<string>): boolean => {
      if (!filtersApplied) {
        return true;
      }
      if (!participantIds.size) {
        return false;
      }

      for (const participantId of participantIds) {
        if (!participantId) {
          continue;
        }
        const participant = userLookup.get(participantId);
        if (participant && recordMatchesFilters(participant, filtersNormalized)) {
          return true;
        }
      }

      return false;
    };

    for (const session of sessions) {
      const startedAt = safeDateFrom(session.startedAt);
      if (!startedAt || startedAt < normalizedStart || startedAt >= windowEndExclusive) {
        continue;
      }

      const participantIds = new Set<string>();
      if (session.user1Id) {
        participantIds.add(session.user1Id);
      }
      if (session.user2Id) {
        participantIds.add(session.user2Id);
      }

      if (!matchesFilters(participantIds)) {
        continue;
      }

      totalSessions += 1;

      const mode = normalizeChatMode(session.mode);
      perModeSessions[mode] = (perModeSessions[mode] ?? 0) + 1;

      for (const participantId of participantIds) {
        if (!participantId) {
          continue;
        }
        uniqueUsers.add(participantId);
        perUserSessions.set(participantId, (perUserSessions.get(participantId) ?? 0) + 1);
      }

      const endedAt = safeDateFrom(session.endedAt);
      let sessionDuration = Number.isFinite(session.durationSeconds) ? Number(session.durationSeconds) : NaN;
      if (!Number.isFinite(sessionDuration) && endedAt) {
        sessionDuration = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
      }

      if (Number.isFinite(sessionDuration) && sessionDuration > 0) {
        durations.push(sessionDuration);
      }

      if (session.status === 'ended' || (endedAt && Number.isFinite(sessionDuration))) {
        completedSessions += 1;
      } else {
        activeSessions += 1;
      }
    }

    const uniqueUsersCount = uniqueUsers.size;
    const repeatUsers = Array.from(perUserSessions.values()).filter((count) => count >= 2).length;
    const repeatRate = toPercentage(repeatUsers, uniqueUsersCount);

    const userRecords = Array.from(uniqueUsers)
      .map((userId) => userLookup.get(userId))
      .filter((user): user is any => Boolean(user));

    const churnThreshold = new Date(normalizedEnd.getTime() - 7 * DAY_MS);
    churnThreshold.setUTCHours(0, 0, 0, 0);

    let churnedUsers = 0;
    for (const user of userRecords) {
      const lastActive = safeDateFrom(user.lastActiveAt ?? user.updatedAt ?? user.createdAt);
      if (!lastActive || lastActive < churnThreshold) {
        churnedUsers += 1;
      }
    }

    const churnRate = toPercentage(churnedUsers, uniqueUsersCount);

    const perUserCounts = Array.from(perUserSessions.values());
    const medianSessionsPerUser = perUserCounts.length ? medianOf(perUserCounts) : 0;
    const averageSessionsPerUser = uniqueUsersCount > 0 ? Math.round((totalSessions / uniqueUsersCount) * 100) / 100 : 0;
    const heavyUserCount = perUserCounts.filter((count) => count >= HEAVY_USER_THRESHOLD).length;
    const heavyUserShare = toPercentage(heavyUserCount, uniqueUsersCount);

    const durationCount = durations.length;
    const medianDuration = durationCount ? Math.round(medianOf(durations)) : 0;
    const averageDuration = durationCount ? Math.round(sumArray(durations) / durationCount) : 0;
    const p90Duration = durationCount ? Math.round(percentileOf(durations, 90)) : 0;

    const distribution: DurationDistributionBin[] = DURATION_BIN_DEFINITIONS.map((definition) => ({
      label: definition.label,
      minSeconds: definition.minSeconds,
      maxSeconds: definition.maxSeconds,
      count: 0,
      share: 0
    }));

    if (durationCount) {
      for (const value of durations) {
        const bin = distribution.find((entry) => {
          const minOk = value >= entry.minSeconds;
          const maxOk = entry.maxSeconds === null ? true : value < entry.maxSeconds;
          return minOk && maxOk;
        });
        if (bin) {
          bin.count += 1;
        }
      }

      for (const entry of distribution) {
        entry.share = toPercentage(entry.count, durationCount);
      }
    }

    const sparkline = distribution.map((entry) => ({
      label: entry.label,
      value: entry.share
    }));

    const cohortMap = new Map<string, { key: string; label: string; type: 'platform' | 'signup_source' | 'gender' | 'subscription'; sessions: number; users: Set<string> }>();

    const registerCohort = (type: 'platform' | 'signup_source' | 'gender' | 'subscription', label: string, userId: string, sessionsForUser: number) => {
      if (!sessionsForUser) {
        return;
      }
      const trimmed = label && label.trim().length ? label.trim() : 'Unknown';
      const key = `${type}:${trimmed.toLowerCase()}`;
      const entry = cohortMap.get(key) ?? {
        key,
        label: trimmed,
        type,
        sessions: 0,
        users: new Set<string>()
      };
      entry.sessions += sessionsForUser;
      entry.users.add(userId);
      cohortMap.set(key, entry);
    };

    for (const user of userRecords) {
      const userId = user.id;
      if (!userId) {
        continue;
      }
      const sessionCount = perUserSessions.get(userId) ?? 0;
      registerCohort('platform', user.platform || 'Unknown', userId, sessionCount);
      registerCohort('signup_source', user.signupSource || user.referrerDomain || 'Unknown', userId, sessionCount);
      registerCohort('gender', user.gender || 'others', userId, sessionCount);
      registerCohort('subscription', user.subscriptionLevel || 'normal', userId, sessionCount);
    }

    const cohorts = Array.from(cohortMap.values())
      .map((entry) => ({
        key: entry.key,
        label: entry.label,
        type: entry.type,
        sessions: entry.sessions,
        uniqueUsers: entry.users.size,
        share: toPercentage(entry.sessions, totalSessions)
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8);

    return {
      window: {
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? '',
        days: windowDays
      },
      totals: {
        sessions: totalSessions,
        completedSessions,
        activeSessions,
        uniqueUsers: uniqueUsersCount,
        repeatUsers,
        repeatRate,
        churnRate
      },
      durations: {
        medianSeconds: medianDuration,
        averageSeconds: averageDuration,
        p90Seconds: p90Duration,
        completedSessions,
        distribution,
        sparkline
      },
      depth: {
        medianSessionsPerUser,
        averageSessionsPerUser,
        heavyUserThreshold: HEAVY_USER_THRESHOLD,
        heavyUserCount,
        heavyUserShare,
        perModeSessions
      },
      cohorts
    };
  }

  static async getAnalyticsFilterOptions(): Promise<AnalyticsFilterOptionsSnapshot> {
    const normalizeArray = (values: any[]): string[] => {
      const unique = new Set<string>();
      values.forEach((value) => {
        unique.add(normalizeSegmentValue(typeof value === 'string' ? value : value?.toString?.() ?? ''));
      });
      return Array.from(unique).sort((a, b) => a.localeCompare(b));
    };

    if (this.isConnected) {
      try {
        const [genders, platforms, signupSources, campaigns] = await Promise.all([
          UserModel.distinct('gender'),
          UserModel.distinct('platform'),
          UserModel.distinct('signupSource'),
          UserModel.distinct('campaignId')
        ]);

        return {
          genders: normalizeArray(genders),
          platforms: normalizeArray(platforms),
          signupSources: normalizeArray(signupSources),
          campaigns: normalizeArray(campaigns)
        };
      } catch (err) {
        console.error('MongoDB getAnalyticsFilterOptions failed:', err);
      }
    }

    const genderSet = new Set<string>();
    const platformSet = new Set<string>();
    const signupSet = new Set<string>();
    const campaignSet = new Set<string>();

    for (const user of this.users.values()) {
      genderSet.add(normalizeSegmentValue(user.gender));
      platformSet.add(normalizeSegmentValue(user.platform));
      signupSet.add(normalizeSegmentValue(user.signupSource));
      campaignSet.add(normalizeSegmentValue(user.campaignId));
    }

    const sortValues = (input: Set<string>): string[] => Array.from(input).sort((a, b) => a.localeCompare(b));

    return {
      genders: sortValues(genderSet),
      platforms: sortValues(platformSet),
      signupSources: sortValues(signupSet),
      campaigns: sortValues(campaignSet)
    };
  }

  static async listGoalDefinitions(): Promise<GoalDefinition[]> {
    await this.ensureGoalsSeeded();

    if (this.isConnected) {
      try {
        const docs = await GoalDefinitionModel.find({}).lean();
        for (const doc of docs) {
          const definition = this.mongoGoalToDefinition(doc);
          this.storeGoalDefinition(definition);
        }
      } catch (error) {
        console.error('MongoDB listGoalDefinitions failed', error);
      }
    }

    return Array.from(this.goalDefinitions.values())
      .map((goal) => this.cloneGoalDefinition(goal))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async upsertGoalDefinition(input: GoalDefinitionInput): Promise<GoalDefinition> {
    await this.ensureGoalsSeeded();

    const now = new Date();
    const normalizedKey = this.normalizeGoalKey(input.key || input.name || input.id || this.generateId('goal-'));

    let existing: GoalDefinition | null = null;

    if (input.id) {
      existing = Array.from(this.goalDefinitions.values()).find((goal) => goal.id === input.id) ?? null;
      if (!existing && this.isConnected) {
        const existingDoc = await GoalDefinitionModel.findOne({ id: input.id }).lean();
        if (existingDoc) {
          existing = this.mongoGoalToDefinition(existingDoc);
        }
      }
    }

    if (!existing) {
      existing = await this.fetchGoalDefinition(normalizedKey);
    }

    if (!existing && this.isConnected) {
      const fallbackDoc = await GoalDefinitionModel.findOne({ key: normalizedKey }).lean();
      if (fallbackDoc) {
        existing = this.mongoGoalToDefinition(fallbackDoc);
      }
    }

    const createdAt = existing?.createdAt ?? now;
    const goal: GoalDefinition = this.cloneGoalDefinition(existing ?? {
      id: input.id?.trim() || this.generateId('goal-'),
      key: normalizedKey,
      name: input.name?.trim() || normalizedKey,
      description: input.description,
      metric: input.metric || 'custom',
      targetValue: Number.isFinite(Number(input.targetValue)) ? Number(input.targetValue) : 0,
      unit: input.unit,
      tags: this.ensureGoalTags(input.tags),
      isActive: input.isActive ?? true,
      ownerEmail: input.ownerEmail,
      color: input.color,
      alertThresholdPercent: input.alertThresholdPercent ?? GOAL_DEFAULT_WARN_THRESHOLD,
      metadata: input.metadata ? { ...input.metadata } : undefined,
      createdAt,
      updatedAt: now
    });

    goal.key = normalizedKey;
    goal.name = input.name?.trim() || goal.name || normalizedKey;
    if (input.description !== undefined) {
      goal.description = input.description;
    }
    if (input.metric) {
      goal.metric = input.metric;
    }
    if (input.targetValue !== undefined && Number.isFinite(Number(input.targetValue))) {
      goal.targetValue = Number(input.targetValue);
    }
    if (input.unit !== undefined) {
      goal.unit = input.unit;
    }
    if (input.tags !== undefined) {
      goal.tags = this.ensureGoalTags(input.tags);
    }
    if (input.isActive !== undefined) {
      goal.isActive = input.isActive;
    }
    if (input.ownerEmail !== undefined) {
      goal.ownerEmail = input.ownerEmail;
    }
    if (input.color !== undefined) {
      goal.color = input.color;
    }
    if (input.alertThresholdPercent !== undefined && Number.isFinite(Number(input.alertThresholdPercent))) {
      goal.alertThresholdPercent = Number(input.alertThresholdPercent);
    }
    if (input.metadata) {
      goal.metadata = { ...(goal.metadata ?? {}), ...input.metadata };
    }
    goal.updatedAt = now;

    const stored = this.storeGoalDefinition(goal);

    if (this.isConnected) {
      try {
        await GoalDefinitionModel.updateOne(
          { id: stored.id },
          {
            $set: {
              id: stored.id,
              key: stored.key,
              name: stored.name,
              description: stored.description,
              metric: stored.metric,
              targetValue: stored.targetValue,
              unit: stored.unit,
              tags: stored.tags,
              isActive: stored.isActive,
              ownerEmail: stored.ownerEmail,
              color: stored.color,
              alertThresholdPercent: stored.alertThresholdPercent,
              metadata: stored.metadata,
              updatedAt: stored.updatedAt
            },
            $setOnInsert: {
              id: stored.id,
              createdAt: stored.createdAt
            }
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('MongoDB upsertGoalDefinition failed', error);
      }
    }

    if (stored.isActive) {
      this.scheduleGoalRecompute(stored.key, 500);
    }

    return this.cloneGoalDefinition(stored);
  }

  static async deleteGoalDefinition(goalKey: string): Promise<boolean> {
    await this.ensureGoalsSeeded();
    if (!goalKey) {
      return false;
    }

    const normalizedKey = this.normalizeGoalKey(goalKey);
    let goal = await this.fetchGoalDefinition(normalizedKey);

    if (!goal && this.isConnected) {
      const doc = await GoalDefinitionModel.findOne({ $or: [{ id: goalKey }, { key: normalizedKey }] }).lean();
      if (doc) {
        goal = this.mongoGoalToDefinition(doc);
      }
    }

    if (!goal) {
      return false;
    }

    const updated: GoalDefinition = {
      ...goal,
      isActive: false,
      updatedAt: new Date()
    };

    this.storeGoalDefinition(updated);

    if (this.isConnected) {
      try {
        await GoalDefinitionModel.updateOne(
          { id: updated.id },
          {
            $set: {
              isActive: false,
              updatedAt: updated.updatedAt
            }
          }
        );
      } catch (error) {
        console.error('MongoDB deleteGoalDefinition failed', error);
      }
    }

    return true;
  }

  static async recordGoalSnapshot(snapshot: GoalSnapshotRecord): Promise<void> {
    await this.ensureGoalsSeeded();
    if (!snapshot?.goalKey) {
      return;
    }

    const normalizedKey = this.normalizeGoalKey(snapshot.goalKey);
    const goal = await this.fetchGoalDefinition(normalizedKey);
    if (!goal) {
      return;
    }

    const timestamp = snapshot.timestamp instanceof Date ? snapshot.timestamp : new Date(snapshot.timestamp);
    const record: GoalSnapshotRecord = {
      goalKey: goal.key,
      timestamp,
      value: Number.isFinite(snapshot.value) ? Number(snapshot.value) : 0,
      targetValue: Number.isFinite(snapshot.targetValue) ? Number(snapshot.targetValue) : goal.targetValue,
      delta: snapshot.delta,
      metadata: snapshot.metadata ? { ...snapshot.metadata } : undefined
    };

    this.storeGoalSnapshot(record);

    if (this.isConnected) {
      try {
        await GoalSnapshotModel.create({
          goalKey: record.goalKey,
          timestamp: record.timestamp,
          value: record.value,
          targetValue: record.targetValue,
          delta: record.delta ?? 0,
          metadata: record.metadata,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('MongoDB recordGoalSnapshot failed', error);
      }
    }
  }

  static async getGoalSummary(start: Date, end: Date, options: GoalSummaryOptions = {}): Promise<GoalSummarySnapshot> {
    await this.ensureGoalsSeeded();

    const normalizedStart = new Date(start);
    const normalizedEnd = new Date(end);
    normalizedStart.setUTCHours(0, 0, 0, 0);
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
      throw new Error('Invalid date range for goal summary');
    }

    const windowDays = Math.floor((normalizedEnd.getTime() - normalizedStart.getTime()) / DAY_MS) + 1;
    const endExclusive = addUtcDays(normalizedEnd, 1);

    const goalKeyFilter = options.goalKeys?.map((key) => this.normalizeGoalKey(key));
    const includeInactive = options.includeInactive ?? false;

    const goals = (await this.listGoalDefinitions()).filter((goal) => {
      if (!includeInactive && !goal.isActive) {
        return false;
      }
      if (goalKeyFilter && goalKeyFilter.length > 0) {
        return goalKeyFilter.includes(goal.key);
      }
      return true;
    });

    const goalKeys = goals.map((goal) => goal.key);
    const snapshotMap = await this.loadGoalSnapshotsFromDb(goalKeys, normalizedStart, endExclusive);

    const totals = {
      goals: goals.length,
      active: goals.filter((goal) => goal.isActive).length,
      completed: 0,
      atRisk: 0,
      offTrack: 0
    };

    const entries: GoalSummaryEntry[] = [];

    for (const goal of goals) {
      const snapshotsAll = snapshotMap.get(goal.key) ?? this.getGoalSnapshots(goal.key);
      const inWindow = snapshotsAll.filter((snapshot) => snapshot.timestamp >= normalizedStart && snapshot.timestamp < endExclusive);
      const candidateSnapshots = inWindow.length ? inWindow : snapshotsAll;
      const latestSnapshot = candidateSnapshots.length ? candidateSnapshots[candidateSnapshots.length - 1] : null;
      const latestValue = latestSnapshot ? latestSnapshot.value : 0;

      const progressPercent = toProgressPercent(latestValue, goal.targetValue);
      const status = resolveGoalStatus(progressPercent, goal.alertThresholdPercent ?? GOAL_DEFAULT_WARN_THRESHOLD);

      if (status === 'completed') {
        totals.completed += 1;
      } else if (status === 'at_risk') {
        totals.atRisk += 1;
      } else if (status === 'off_track') {
        totals.offTrack += 1;
      }

      const computeTrend = (days: number): number => {
        if (!latestSnapshot) {
          return 0;
        }
        const threshold = latestSnapshot.timestamp.getTime() - days * DAY_MS;
        const historical = [...snapshotsAll]
          .reverse()
          .find((snapshot) => snapshot.timestamp.getTime() <= threshold);
        if (!historical) {
          return 0;
        }
        return Math.round((latestSnapshot.value - historical.value) * 100) / 100;
      };

      const sparklineSource = candidateSnapshots.length ? candidateSnapshots : snapshotsAll.slice(-7);
      const sparkline = sparklineSource
        .slice(-7)
        .map((snapshot) => ({
          date: toDateKey(snapshot.timestamp) ?? snapshot.timestamp.toISOString().split('T')[0],
          value: snapshot.value
        }));

      entries.push({
        goal: this.cloneGoalDefinition(goal),
        latestValue: Math.round(latestValue * 100) / 100,
        targetValue: goal.targetValue,
        progressPercent,
        status,
        lastUpdated: latestSnapshot ? latestSnapshot.timestamp.toISOString() : normalizedEnd.toISOString(),
        trend7d: computeTrend(7),
        trend30d: computeTrend(30),
        sparkline
      });
    }

    entries.sort((a, b) => a.goal.name.localeCompare(b.goal.name));

    return {
      window: {
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? '',
        days: windowDays
      },
      totals,
      goals: entries
    };
  }

  static async getGoalTimeseries(start: Date, end: Date, options: GoalTimeseriesOptions): Promise<GoalTimeseriesResponse> {
    await this.ensureGoalsSeeded();

    const normalizedStart = new Date(start);
    const normalizedEnd = new Date(end);
    normalizedStart.setUTCHours(0, 0, 0, 0);
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
      throw new Error('Invalid date range for goal timeseries');
    }

    const interval: GoalTimeseriesInterval = options?.interval ?? 'day';
    const intervalMs = goalIntervalToMs(interval);
    const endExclusive = addUtcDays(normalizedEnd, 1);
    const startMs = normalizedStart.getTime();

    const requestedKeys = options?.goalKeys?.length
      ? options.goalKeys.map((key) => this.normalizeGoalKey(key))
      : (await this.listGoalDefinitions()).filter((goal) => goal.isActive).map((goal) => goal.key);

    const uniqueKeys = Array.from(new Set(requestedKeys));
    const snapshotMap = await this.loadGoalSnapshotsFromDb(uniqueKeys, normalizedStart, endExclusive);

    const series: GoalTimeseriesSeries[] = [];

    for (const key of uniqueKeys) {
      const goal = this.goalDefinitions.get(key);
      if (!goal) {
        continue;
      }

      const snapshots = (snapshotMap.get(goal.key) ?? this.getGoalSnapshots(goal.key)).filter(
        (snapshot) => snapshot.timestamp >= normalizedStart && snapshot.timestamp < endExclusive
      );

      if (!snapshots.length) {
        series.push({
          key: goal.key,
          name: goal.name,
          unit: goal.unit,
          points: []
        });
        continue;
      }

      const buckets = new Map<number, GoalTimeseriesPoint>();

      for (const snapshot of snapshots) {
        const bucketIndex = Math.floor((snapshot.timestamp.getTime() - startMs) / intervalMs);
        const bucketStartTime = startMs + bucketIndex * intervalMs;
        const bucketDate = new Date(bucketStartTime);
        const label = interval === 'day' ? toDateKey(bucketDate) ?? bucketDate.toISOString() : bucketDate.toISOString();

        buckets.set(bucketStartTime, {
          date: label,
          value: Math.round(snapshot.value * 100) / 100,
          targetValue: Math.round(goal.targetValue * 100) / 100,
          metadata: snapshot.metadata ? { ...snapshot.metadata } : undefined
        });
      }

      const points = Array.from(buckets.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, point]) => point);

      series.push({
        key: goal.key,
        name: goal.name,
        unit: goal.unit,
        points
      });
    }

    return {
      window: {
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? '',
        interval
      },
      series
    };
  }

  static async getAnomalyFeed(start: Date, end: Date): Promise<AnomalyFeedResponse> {
    const normalizedStart = new Date(start);
    const normalizedEnd = new Date(end);
    normalizedStart.setUTCHours(0, 0, 0, 0);
    normalizedEnd.setUTCHours(0, 0, 0, 0);
    const endExclusive = addUtcDays(normalizedEnd, 1);

    let events: AnomalyEventEntry[] = [];

    if (this.isConnected) {
      try {
        const docs = await AnomalyEventModel.find({
          timestamp: {
            $gte: normalizedStart,
            $lt: endExclusive
          }
        })
          .sort({ timestamp: -1 })
          .limit(200)
          .lean();

        events = docs.map((doc) => this.mongoAnomalyToEntry(doc));
        this.anomalyEvents = [...events];
      } catch (error) {
        console.error('MongoDB getAnomalyFeed failed', error);
      }
    }

    if (!events.length) {
      events = this.anomalyEvents
        .filter((event) => {
          const timestamp = new Date(event.timestamp);
          return timestamp >= normalizedStart && timestamp < endExclusive;
        })
        .slice(0, 200)
        .map((event) => ({
          ...event,
          metadata: event.metadata ? { ...event.metadata } : undefined
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return {
      window: {
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? ''
      },
      events,
      latestUpdatedAt: events.length ? events[0].timestamp : undefined
    };
  }

  static async getBenchmarkSummary(start: Date, end: Date): Promise<BenchmarkSummary> {
    const normalizedStart = new Date(start);
    const normalizedEnd = new Date(end);
    normalizedStart.setUTCHours(0, 0, 0, 0);
    normalizedEnd.setUTCHours(0, 0, 0, 0);
    const endExclusive = addUtcDays(normalizedEnd, 1);

    let baselines: AnomalyBaselineEntry[] = [];

    if (this.isConnected) {
      try {
        const docs = await AnomalyBaselineModel.find({
          updatedAt: {
            $gte: normalizedStart,
            $lt: endExclusive
          }
        }).lean();

        baselines = docs.map((doc) => {
          const entry = this.mongoBaselineToEntry(doc);
          const key = this.baselineKey(entry.metric, entry.period);
          this.anomalyBaselines.set(key, entry);
          return entry;
        });
      } catch (error) {
        console.error('MongoDB getBenchmarkSummary failed', error);
      }
    }

    if (!baselines.length) {
      baselines = Array.from(this.anomalyBaselines.values())
        .filter((baseline) => {
          const timestamp = new Date(baseline.updatedAt);
          return timestamp >= normalizedStart && timestamp < endExclusive;
        })
        .map((baseline) => ({
          ...baseline,
          metadata: baseline.metadata ? { ...baseline.metadata } : undefined
        }));
    }

    baselines.sort((a, b) => a.metric.localeCompare(b.metric));

    return {
      window: {
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? ''
      },
      baselines
    };
  }

  static async upsertBenchmark(input: AnomalyBaselineUpsertInput): Promise<AnomalyBaselineEntry> {
    const updatedAt = input.updatedAt ? new Date(input.updatedAt) : new Date();
    const entry: AnomalyBaselineEntry = {
      metric: input.metric,
      period: input.period,
      mean: Math.round(input.mean * 100) / 100,
      standardDeviation: Math.round(input.standardDeviation * 100) / 100,
      sampleSize: input.sampleSize,
      trend: input.trend,
      updatedAt: updatedAt.toISOString(),
      metadata: input.metadata ? { ...input.metadata } : undefined
    };

    const key = this.baselineKey(entry.metric, entry.period);
    this.anomalyBaselines.set(key, entry);

    if (this.isConnected) {
      try {
        await AnomalyBaselineModel.updateOne(
          { metric: entry.metric, period: entry.period },
          {
            $set: {
              mean: entry.mean,
              standardDeviation: entry.standardDeviation,
              sampleSize: entry.sampleSize,
              trend: entry.trend,
              metadata: entry.metadata,
              updatedAt
            }
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('MongoDB upsertBenchmark failed', error);
      }
    }

    return {
      ...entry,
      metadata: entry.metadata ? { ...entry.metadata } : undefined
    };
  }

  static async recordAnomalyEvent(input: AnomalyEventInput): Promise<AnomalyEventEntry> {
    const entry: AnomalyEventEntry = {
      id: this.generateId('anomaly-'),
      metric: input.metric,
      timestamp: input.timestamp.toISOString(),
      severity: input.severity,
      direction: input.direction,
      actual: Math.round(input.actual * 100) / 100,
      expected: Math.round(input.expected * 100) / 100,
      zScore: Math.round(input.zScore * 100) / 100,
      baselineMean: Math.round(input.baselineMean * 100) / 100,
      baselineStdDev: Math.round(input.baselineStdDev * 100) / 100,
      metadata: input.metadata ? { ...input.metadata } : undefined
    };

    if (this.isConnected) {
      try {
        await AnomalyEventModel.create({
          metric: entry.metric,
          timestamp: new Date(entry.timestamp),
          severity: entry.severity,
          direction: entry.direction,
          actual: entry.actual,
          expected: entry.expected,
          zScore: entry.zScore,
          baselineMean: entry.baselineMean,
          baselineStdDev: entry.baselineStdDev,
          metadata: entry.metadata,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('MongoDB recordAnomalyEvent failed', error);
      }
    }

    this.anomalyEvents.unshift(entry);
    if (this.anomalyEvents.length > 250) {
      this.anomalyEvents = this.anomalyEvents.slice(0, 250);
    }

    return {
      ...entry,
      metadata: entry.metadata ? { ...entry.metadata } : undefined
    };
  }

  /**
   * Get all users with their report counts
   */
  static async getAllUsers(): Promise<any[]> {
    if (this.isConnected) {
      try {
        const users = await UserModel.find({}).lean();
        return users.map((user: any) => {
          const verificationStatus = user.verificationStatus === 'verified' || user.isVerified ? 'verified' : 'guest';
          const subscriptionLevel = user.subscriptionLevel === 'premium' ? 'premium' : 'normal';
          const role = user.role === 'super_admin' ? 'super_admin' : user.role === 'admin' ? 'admin' : 'user';
          const tier = user.tier
            || (role === 'super_admin' ? 'super_admin'
              : role === 'admin' ? 'admin'
                : subscriptionLevel === 'premium' ? 'premium'
                  : verificationStatus === 'verified' ? 'verified'
                    : 'guest');

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role,
            verificationStatus,
            subscriptionLevel,
            tier,
            status: user.status,
            reportCount: user.reportCount || 0,
            isVerified: user.isVerified || false,
            coins: user.coins || 0,
            totalChats: user.totalChats || 0,
            dailyChats: user.dailyChats || 0,
            createdAt: user.createdAt,
            lastActiveAt: user.lastActiveAt
          };
        });
      } catch (err) {
        console.error('MongoDB getAllUsers failed:', err);
      }
    }
    return Array.from(this.users.values());
  }

  /**
   * Update user role (tier)
   */
  static async updateUserRole(userId: string, newRole: 'guest' | 'user' | 'admin' | 'super_admin'): Promise<boolean> {
    if (this.isConnected) {
      try {
        const normalizedRole = newRole === 'guest' ? 'user' : newRole;
        const baseUpdate: Record<string, any> = {
          role: normalizedRole,
          updatedAt: new Date()
        };

        if (newRole === 'admin' || newRole === 'super_admin') {
          baseUpdate.verificationStatus = 'verified';
          baseUpdate.isVerified = true;
        } else if (newRole === 'guest') {
          baseUpdate.verificationStatus = 'guest';
          baseUpdate.isVerified = false;
          baseUpdate.subscriptionLevel = 'normal';
        }

        const result = await UserModel.updateOne(
          { id: userId },
          { $set: baseUpdate }
        );
        const updated = result.modifiedCount > 0;
        if (updated) {
          await this.syncAdminAccessForRole(userId, newRole);
        }
        return updated;
      } catch (err) {
        console.error('MongoDB updateUserRole failed:', err);
      }
    }
    const user = this.users.get(userId);
    if (user) {
      const normalizedRole = newRole === 'guest' ? 'user' : newRole;
      user.role = normalizedRole as typeof user.role;
      if (newRole === 'admin' || newRole === 'super_admin') {
        user.verificationStatus = 'verified';
        user.isVerified = true;
      } else if (newRole === 'guest') {
        user.verificationStatus = 'guest';
        user.isVerified = false;
        user.subscriptionLevel = 'normal';
      } else {
        user.verificationStatus = user.verificationStatus || 'guest';
      }
      user.tier =
        newRole === 'super_admin' ? 'super_admin'
          : newRole === 'admin' ? 'admin'
            : user.subscriptionLevel === 'premium' ? 'premium'
              : user.verificationStatus === 'verified' ? 'verified' : 'guest';
      user.updatedAt = new Date();
      await this.syncAdminAccessForRole(userId, newRole);
      return true;
    }
    return false;
  }

  /**
   * Delete user permanently
   */
  static async deleteUser(
    userId: string,
    metadata: {
      reason?: string;
      deletedBy?: string;
      context?: 'user' | 'admin' | 'system';
      adminId?: string;
      adminUsername?: string;
    } = {}
  ): Promise<boolean> {
    const result = await this.archiveAndDeleteUser(userId, {
      reason: metadata.reason ?? 'system_delete',
      deletedBy: metadata.deletedBy,
      context: metadata.context ?? 'admin',
      adminId: metadata.adminId,
      adminUsername: metadata.adminUsername
    });

    return !!result.success;
  }

  /**
   * Increment user report count
   */
  static async incrementUserReportCount(userId: string): Promise<number> {
    if (this.isConnected) {
      try {
        const user = await UserModel.findOne({ id: userId });
        if (user) {
          const newCount = (user.reportCount || 0) + 1;
          await UserModel.updateOne(
            { id: userId },
            { 
              reportCount: newCount,
              updatedAt: new Date()
            }
          );
          
          // Auto-ban based on report count
          if (newCount === 3) {
            // 1 week ban
            await this.banUser(userId, 'temporary', 7 * 24 * 60 * 60 * 1000, '3 reports received - automatic 1 week ban');
          } else if (newCount === 6) {
            // 2 weeks ban
            await this.banUser(userId, 'temporary', 14 * 24 * 60 * 60 * 1000, '6 reports received - automatic 2 weeks ban');
          } else if (newCount >= 9) {
            // Permanent ban
            await this.banUser(userId, 'permanent', undefined, '9+ reports received - permanent ban');
          }
          
          return newCount;
        }
      } catch (err) {
        console.error('MongoDB incrementUserReportCount failed:', err);
      }
    }
    
    // In-memory fallback
    const user = this.users.get(userId);
    if (user) {
      const newCount = (user.reportCount || 0) + 1;
      user.reportCount = newCount;
      user.updatedAt = new Date();
      
      // Auto-ban logic for in-memory
      if (newCount === 3) {
        await this.banUser(userId, 'temporary', 7 * 24 * 60 * 60 * 1000, '3 reports - 1 week ban');
      } else if (newCount === 6) {
        await this.banUser(userId, 'temporary', 14 * 24 * 60 * 60 * 1000, '6 reports - 2 weeks ban');
      } else if (newCount >= 9) {
        await this.banUser(userId, 'permanent', undefined, '9+ reports - permanent ban');
      }
      
      return newCount;
    }
    return 0;
  }

  /**
   * Search users by username or email
   */
  static async searchUsers(query: string): Promise<any[]> {
    if (this.isConnected) {
      try {
        const users = await UserModel.find({
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }).limit(50).lean();

        return users.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          tier: user.tier || 'guest',
          status: user.status,
          reportCount: user.reportCount || 0,
          isVerified: user.isVerified || false,
          coins: user.coins || 0,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt
        }));
      } catch (err) {
        console.error('MongoDB searchUsers failed:', err);
      }
    }

    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter((user: any) =>
      user.username?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery)
    );
  }

  static async getAcquisitionMapMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<AcquisitionMapSummary> {
    const startDay = new Date(start.getTime());
    startDay.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(end.getTime());
    endDay.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(startDay.getTime()) || Number.isNaN(endDay.getTime()) || startDay > endDay) {
      throw new Error('Invalid date range for acquisition map metrics');
    }

    const windowDays = Math.floor((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1;

    const sanitizeFilterList = (values?: string[]): string[] | null => {
      if (!values || values.length === 0) {
        return null;
      }

      const normalized = values
        .map((value) => normalizeSegmentValue(value))
        .filter((value) => value && value !== 'all' && value !== 'any' && value !== '*');

      return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
    };

    const filtersNormalized = {
      genders: sanitizeFilterList(filters.genders),
      platforms: sanitizeFilterList(filters.platforms),
      signupSources: sanitizeFilterList(filters.signupSources),
      campaigns: sanitizeFilterList(filters.campaigns)
    };

    const normalizeExpression = (path: string) => ({
      $let: {
        vars: {
          raw: {
            $trim: {
              input: {
                $toString: {
                  $ifNull: [`$${path}`, '']
                }
              }
            }
          }
        },
        in: {
          $cond: [
            { $gt: [{ $strLenCP: '$$raw' }, 0] },
            { $toLower: '$$raw' },
            'unknown'
          ]
        }
      }
    });

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: { $gte: startDay, $lte: endDay }
        }
      },
      {
        $addFields: {
          genderNormalized: normalizeExpression('gender'),
          platformNormalized: normalizeExpression('platform'),
          signupSourceNormalized: normalizeExpression('signupSource'),
          campaignNormalized: normalizeExpression('campaignId')
        }
      }
    ];

    if (filtersNormalized.genders) {
      pipeline.push({ $match: { genderNormalized: { $in: filtersNormalized.genders } } });
    }
    if (filtersNormalized.platforms) {
      pipeline.push({ $match: { platformNormalized: { $in: filtersNormalized.platforms } } });
    }
    if (filtersNormalized.signupSources) {
      pipeline.push({ $match: { signupSourceNormalized: { $in: filtersNormalized.signupSources } } });
    }
    if (filtersNormalized.campaigns) {
      pipeline.push({ $match: { campaignNormalized: { $in: filtersNormalized.campaigns } } });
    }

    pipeline.push({
      $project: {
        _id: 0,
        createdAt: 1,
        signupCountryCode: { $ifNull: ['$signupCountryCode', ''] },
        signupCountryName: '$signupCountryName',
        signupRegionCode: '$signupRegionCode',
        signupRegionName: '$signupRegionName',
        signupSubdivisionCode: '$signupSubdivisionCode'
      }
    });

    if (!this.isConnected) {
      return {
        window: {
          start: toGrowthDateKey(startDay) ?? '',
          end: toGrowthDateKey(endDay) ?? '',
          days: windowDays
        },
        totalSignups: 0,
        unknown: 0,
        countries: []
      };
    }

    const records: Array<{
      createdAt: Date;
      signupCountryCode?: string;
      signupCountryName?: string;
      signupRegionCode?: string;
      signupRegionName?: string;
      signupSubdivisionCode?: string;
    }> = await UserModel.aggregate(pipeline).exec();

    const countryBuckets = new Map<string, {
      name?: string;
      count: number;
      regions: Map<string, {
        regionCode?: string;
        subdivisionCode?: string;
        name?: string;
        count: number;
      }>;
    }>();

    let totalSignups = 0;
    let unknownCount = 0;

    for (const record of records) {
      if (!(record.createdAt instanceof Date)) {
        continue;
      }

      const createdAt = new Date(record.createdAt.getTime());
      createdAt.setUTCHours(0, 0, 0, 0);
      if (createdAt < startDay || createdAt > endDay) {
        continue;
      }

      totalSignups += 1;

      const countryCode = (record.signupCountryCode || '').trim().toUpperCase();
      if (!countryCode) {
        unknownCount += 1;
        continue;
      }

      if (!countryBuckets.has(countryCode)) {
        countryBuckets.set(countryCode, {
          name: record.signupCountryName,
          count: 0,
          regions: new Map()
        });
      }

      const countryBucket = countryBuckets.get(countryCode)!;
      countryBucket.count += 1;

      const subdivisionCode = record.signupSubdivisionCode || (record.signupRegionCode ? `${countryCode}-${record.signupRegionCode}` : undefined);
      const regionKey = subdivisionCode || record.signupRegionCode;

      if (!regionKey) {
        continue;
      }

      if (!countryBucket.regions.has(regionKey)) {
        const regionName = record.signupRegionName
          || resolveSubdivisionName(subdivisionCode)
          || undefined;
        countryBucket.regions.set(regionKey, {
          regionCode: record.signupRegionCode,
          subdivisionCode,
          name: regionName,
          count: 0
        });
      }

      const regionBucket = countryBucket.regions.get(regionKey)!;
      regionBucket.count += 1;
    }

    const countries = Array.from(countryBuckets.entries())
      .map(([countryCode, bucket]) => {
        const regions = Array.from(bucket.regions.values())
          .sort((a, b) => b.count - a.count)
          .map((region) => ({
            regionCode: region.regionCode,
            subdivisionCode: region.subdivisionCode,
            name: region.name || 'Unknown region',
            signups: region.count,
            share: bucket.count > 0 ? toPercentage(region.count, bucket.count) : 0
          }));

        return {
          countryCode,
          name: bucket.name || resolveCountryName(countryCode),
          signups: bucket.count,
          share: totalSignups > 0 ? toPercentage(bucket.count, totalSignups) : 0,
          regions
        };
      })
      .sort((a, b) => b.signups - a.signups);

    return {
      window: {
        start: toGrowthDateKey(startDay) ?? '',
        end: toGrowthDateKey(endDay) ?? '',
        days: windowDays
      },
      totalSignups,
      unknown: unknownCount,
      countries
    };
  }

  static async getAcquisitionSourceMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<AcquisitionSourcesSummary> {
    const startDay = new Date(start.getTime());
    startDay.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(end.getTime());
    endDay.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(startDay.getTime()) || Number.isNaN(endDay.getTime()) || startDay > endDay) {
      throw new Error('Invalid date range for acquisition source metrics');
    }

    const windowDays = Math.floor((endDay.getTime() - startDay.getTime()) / DAY_MS) + 1;

    const sanitizeFilterList = (values?: string[]): string[] | null => {
      if (!values || values.length === 0) {
        return null;
      }

      const normalized = values
        .map((value) => normalizeSegmentValue(value))
        .filter((value) => value && value !== 'all' && value !== 'any' && value !== '*');

      return normalized.length > 0 ? Array.from(new Set(normalized)) : null;
    };

    const filtersNormalized = {
      genders: sanitizeFilterList(filters.genders),
      platforms: sanitizeFilterList(filters.platforms),
      signupSources: sanitizeFilterList(filters.signupSources),
      campaigns: sanitizeFilterList(filters.campaigns)
    };

    const normalizeExpression = (path: string) => ({
      $let: {
        vars: {
          raw: {
            $trim: {
              input: {
                $toString: {
                  $ifNull: [`$${path}`, '']
                }
              }
            }
          }
        },
        in: {
          $cond: [
            { $gt: [{ $strLenCP: '$$raw' }, 0] },
            { $toLower: '$$raw' },
            'unknown'
          ]
        }
      }
    });

    const baseMatch = {
      createdAt: { $gte: startDay, $lte: endDay }
    };

    const pipeline: PipelineStage[] = [
      { $match: baseMatch },
      {
        $addFields: {
          genderNormalized: normalizeExpression('gender'),
          platformNormalized: normalizeExpression('platform'),
          signupSourceNormalized: normalizeExpression('signupSource'),
          campaignNormalized: normalizeExpression('campaignId')
        }
      }
    ];

    if (filtersNormalized.genders) {
      pipeline.push({ $match: { genderNormalized: { $in: filtersNormalized.genders } } });
    }
    if (filtersNormalized.platforms) {
      pipeline.push({ $match: { platformNormalized: { $in: filtersNormalized.platforms } } });
    }
    if (filtersNormalized.signupSources) {
      pipeline.push({ $match: { signupSourceNormalized: { $in: filtersNormalized.signupSources } } });
    }
    if (filtersNormalized.campaigns) {
      pipeline.push({ $match: { campaignNormalized: { $in: filtersNormalized.campaigns } } });
    }

    pipeline.push({
      $project: {
        _id: 0,
        createdAt: 1,
        signupSource: { $ifNull: ['$signupSource', ''] },
        campaignId: { $ifNull: ['$campaignId', ''] },
        utmSource: { $ifNull: ['$utmSource', ''] },
        utmMedium: { $ifNull: ['$utmMedium', ''] },
        utmCampaign: { $ifNull: ['$utmCampaign', ''] },
        referrerDomain: { $ifNull: ['$referrerDomain', ''] }
      }
    });

    if (!this.isConnected) {
      return {
        window: {
          start: toGrowthDateKey(startDay) ?? '',
          end: toGrowthDateKey(endDay) ?? '',
          days: windowDays
        },
        totalSignups: 0,
        uniqueSources: 0,
        unknown: 0,
        sources: []
      };
    }

    type SourceRecord = {
      createdAt: Date;
      signupSource?: string;
      campaignId?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      referrerDomain?: string;
    };

    const currentRecords: SourceRecord[] = await UserModel.aggregate(pipeline).exec();

    const previousEnd = new Date(startDay.getTime() - DAY_MS);
    previousEnd.setUTCHours(0, 0, 0, 0);
    const previousStart = new Date(previousEnd.getTime() - (windowDays - 1) * DAY_MS);
    previousStart.setUTCHours(0, 0, 0, 0);

    const previousPipeline = pipeline
      .map((stage, index) => {
        if (index === 0) {
          return {
            $match: {
              createdAt: { $gte: previousStart, $lte: previousEnd }
            }
          } as PipelineStage;
        }
        return stage;
      });

    const previousRecords: SourceRecord[] = await UserModel.aggregate(previousPipeline).exec();

    const buildSourceBuckets = (records: SourceRecord[]) => {
      const map = new Map<string, {
        key: string;
        source: string;
        medium?: string;
        campaign?: string;
        count: number;
      }>();
      let unknown = 0;

      for (const record of records) {
        const sourceRaw = record.utmSource || record.signupSource || record.referrerDomain || 'unknown';
        const mediumRaw = record.utmMedium || undefined;
        const campaignRaw = record.utmCampaign || record.campaignId || undefined;

        const sourceLabel = typeof sourceRaw === 'string' && sourceRaw.trim().length > 0 ? sourceRaw.trim() : 'unknown';
        const mediumLabel = typeof mediumRaw === 'string' && mediumRaw.trim().length > 0 ? mediumRaw.trim() : undefined;
        const campaignLabel = typeof campaignRaw === 'string' && campaignRaw.trim().length > 0 ? campaignRaw.trim() : undefined;

        const normalizedSource = normalizeSegmentValue(sourceLabel);
        const normalizedMedium = normalizeSegmentValue(mediumLabel);
        const normalizedCampaign = normalizeSegmentValue(campaignLabel);

        const key = `${normalizedSource}|${normalizedMedium}|${normalizedCampaign}`;

        if (normalizedSource === 'unknown') {
          unknown += 1;
          continue;
        }

        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          continue;
        }

        map.set(key, {
          key,
          source: sourceLabel,
          medium: mediumLabel,
          campaign: campaignLabel,
          count: 1
        });
      }

      return { buckets: map, unknown };
    };

    const current = buildSourceBuckets(currentRecords);
    const previous = buildSourceBuckets(previousRecords);

    const totalSignups = currentRecords.length;
    const previousLookup = new Map<string, number>();
    previous.buckets.forEach((bucket) => {
      previousLookup.set(bucket.key, bucket.count);
    });

    const sortedBuckets = Array.from(current.buckets.values()).sort((a, b) => b.count - a.count);

    const sources = sortedBuckets.slice(0, 50).map((bucket) => {
      const prevCount = previousLookup.get(bucket.key) ?? 0;
      const share = totalSignups > 0 ? toPercentage(bucket.count, totalSignups) : 0;
      const trendDelta = prevCount > 0
        ? Math.round(((bucket.count - prevCount) / prevCount) * 10000) / 100
        : undefined;

      return {
        source: bucket.source,
        medium: bucket.medium,
        campaign: bucket.campaign,
        signups: bucket.count,
        share,
        previousSignups: prevCount > 0 ? prevCount : undefined,
        trendDelta
      };
    });

    return {
      window: {
        start: toGrowthDateKey(startDay) ?? '',
        end: toGrowthDateKey(endDay) ?? '',
        days: windowDays
      },
      totalSignups,
      uniqueSources: current.buckets.size,
      unknown: current.unknown,
      sources
    };
  }

  /* ---------- Topic Dice Methods ---------- */
  
  /**
   * Get topic dice prompts with filters
   */
  static async getTopicDicePrompts(filter: any = {}): Promise<any[]> {
    if (this.isConnected) {
      try {
        const prompts = await TopicDicePromptModel.find(filter).lean();
        return prompts.map(p => ({
          id: p.promptId,
          promptEn: p.promptEn,
          category: p.category,
          maturityRating: p.maturityRating,
          localizedVariants: p.localizedVariants || {},
          tags: p.tags || [],
          active: p.active,
          createdAt: p.createdAt
        }));
      } catch (error) {
        console.error('❌ Error getting topic dice prompts from MongoDB:', error);
        return this.getTopicDicePromptsInMemory(filter);
      }
    }
    return this.getTopicDicePromptsInMemory(filter);
  }

  private static getTopicDicePromptsInMemory(filter: any = {}): any[] {
    const allPrompts = Array.from(this.topicDicePrompts.values());
    
    // Apply filters
    return allPrompts.filter(prompt => {
      if (filter.category && prompt.category !== filter.category) return false;
      if (filter.active !== undefined && prompt.active !== filter.active) return false;
      if (filter.maturityRating && Array.isArray(filter.maturityRating.$in)) {
        if (!filter.maturityRating.$in.includes(prompt.maturityRating)) return false;
      }
      return true;
    });
  }

  /**
   * Create topic dice prompt
   */
  static async createTopicDicePrompt(prompt: any): Promise<void> {
    if (this.isConnected) {
      try {
        await TopicDicePromptModel.create({
          promptId: prompt.id,
          promptEn: prompt.promptEn,
          category: prompt.category,
          maturityRating: prompt.maturityRating,
          localizedVariants: new Map(Object.entries(prompt.localizedVariants || {})),
          tags: prompt.tags || [],
          active: prompt.active !== undefined ? prompt.active : true,
          createdAt: prompt.createdAt || new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Created topic dice prompt in MongoDB:', prompt.id);
      } catch (error) {
        console.error('❌ Error creating topic dice prompt in MongoDB:', error);
        this.topicDicePrompts.set(prompt.id, prompt);
      }
    } else {
      this.topicDicePrompts.set(prompt.id, prompt);
    }
  }

  /**
   * Update topic dice prompt
   */
  static async updateTopicDicePrompt(promptId: string, updates: any): Promise<void> {
    if (this.isConnected) {
      try {
        const updateData: any = { ...updates, updatedAt: new Date() };
        
        // Convert localizedVariants object to Map if present
        if (updates.localizedVariants) {
          updateData.localizedVariants = new Map(Object.entries(updates.localizedVariants));
        }

        await TopicDicePromptModel.updateOne(
          { promptId },
          { $set: updateData }
        );
        console.log('✅ Updated topic dice prompt in MongoDB:', promptId);
      } catch (error) {
        console.error('❌ Error updating topic dice prompt in MongoDB:', error);
        const existing = this.topicDicePrompts.get(promptId);
        if (existing) {
          this.topicDicePrompts.set(promptId, { ...existing, ...updates });
        }
      }
    } else {
      const existing = this.topicDicePrompts.get(promptId);
      if (existing) {
        this.topicDicePrompts.set(promptId, { ...existing, ...updates });
      }
    }
  }

  /**
   * Delete topic dice prompt
   */
  static async deleteTopicDicePrompt(promptId: string): Promise<void> {
    if (this.isConnected) {
      try {
        await TopicDicePromptModel.deleteOne({ promptId });
        console.log('✅ Deleted topic dice prompt from MongoDB:', promptId);
      } catch (error) {
        console.error('❌ Error deleting topic dice prompt from MongoDB:', error);
        this.topicDicePrompts.delete(promptId);
      }
    } else {
      this.topicDicePrompts.delete(promptId);
    }
  }

  /* ---------- AR Analytics ---------- */
  
  /**
   * Log AR usage analytics
   */
  static async logARAnalytics(data: {
    sessionId: string;
    userId: string;
    maskType: string;
    blurEnabled: boolean;
    blurDuration: number;
    revealTime: number;
    isAutoReveal: boolean;
    devicePerformance?: string;
    qualityPreset?: string;
    avgFps?: number;
    avgCpuUsage?: number;
    droppedFrames?: number;
  }): Promise<void> {
    if (this.isConnected) {
      try {
        await ARAnalyticsModel.create({
          sessionId: data.sessionId,
          userId: data.userId,
          maskType: data.maskType,
          blurEnabled: data.blurEnabled,
          blurDuration: data.blurDuration,
          revealTime: data.revealTime,
          isAutoReveal: data.isAutoReveal,
          devicePerformance: data.devicePerformance || 'medium',
          qualityPreset: data.qualityPreset || 'medium',
          avgFps: data.avgFps || 0,
          avgCpuUsage: data.avgCpuUsage || 0,
          droppedFrames: data.droppedFrames || 0,
          timestamp: new Date(),
        });
        console.log('✅ Logged AR analytics to MongoDB:', {
          sessionId: data.sessionId,
          userId: data.userId,
          maskType: data.maskType,
          isAutoReveal: data.isAutoReveal,
        });
      } catch (error) {
        console.error('❌ Error logging AR analytics to MongoDB:', error);
      }
    } else {
      console.log('📝 [In-memory mode] AR analytics:', data);
    }
  }

  /**
   * Get AR analytics for a user
   */
  static async getARAnalytics(userId: string, limit = 100): Promise<any[]> {
    if (this.isConnected) {
      try {
        return await ARAnalyticsModel.find({ userId })
          .sort({ timestamp: -1 })
          .limit(limit)
          .lean();
      } catch (error) {
        console.error('❌ Error fetching AR analytics from MongoDB:', error);
        return [];
      }
    } else {
      return [];
    }
  }

  /**
   * Get AR analytics summary
   */
  static async getARAnalyticsSummary(filters?: {
    startDate?: Date;
    endDate?: Date;
    maskType?: string;
  }): Promise<{
    totalSessions: number;
    maskUsage: Record<string, number>;
    avgRevealTime: number;
    autoRevealRate: number;
    avgFps: number;
    avgCpuUsage: number;
  }> {
    if (this.isConnected) {
      try {
        const matchFilter: any = {};
        if (filters?.startDate) matchFilter.timestamp = { $gte: filters.startDate };
        if (filters?.endDate) {
          matchFilter.timestamp = matchFilter.timestamp || {};
          matchFilter.timestamp.$lte = filters.endDate;
        }
        if (filters?.maskType) matchFilter.maskType = filters.maskType;

        const results = await ARAnalyticsModel.aggregate([
          { $match: matchFilter },
          {
            $group: {
              _id: null,
              totalSessions: { $sum: 1 },
              maskTypes: { $push: '$maskType' },
              avgRevealTime: { $avg: '$revealTime' },
              autoReveals: { $sum: { $cond: ['$isAutoReveal', 1, 0] } },
              avgFps: { $avg: '$avgFps' },
              avgCpuUsage: { $avg: '$avgCpuUsage' },
            },
          },
        ]);

        if (results.length === 0) {
          return {
            totalSessions: 0,
            maskUsage: {},
            avgRevealTime: 0,
            autoRevealRate: 0,
            avgFps: 0,
            avgCpuUsage: 0,
          };
        }

        const result = results[0];
        const maskUsage: Record<string, number> = {};
        result.maskTypes.forEach((mask: string) => {
          maskUsage[mask] = (maskUsage[mask] || 0) + 1;
        });

        return {
          totalSessions: result.totalSessions,
          maskUsage,
          avgRevealTime: Math.round(result.avgRevealTime),
          autoRevealRate: result.autoReveals / result.totalSessions,
          avgFps: Math.round(result.avgFps),
          avgCpuUsage: Math.round(result.avgCpuUsage),
        };
      } catch (error) {
        console.error('❌ Error fetching AR analytics summary from MongoDB:', error);
        return {
          totalSessions: 0,
          maskUsage: {},
          avgRevealTime: 0,
          autoRevealRate: 0,
          avgFps: 0,
          avgCpuUsage: 0,
        };
      }
    } else {
      return {
        totalSessions: 0,
        maskUsage: {},
        avgRevealTime: 0,
        autoRevealRate: 0,
        avgFps: 0,
        avgCpuUsage: 0,
      };
    }
  }
}
