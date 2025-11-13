// Simple in-memory database service for development
import bcrypt from 'bcryptjs';
import type {
  AcquisitionMapCountry,
  AcquisitionMapSummary,
  AcquisitionSourceEntry,
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
  GoalTimeseriesOptions,
  GoalTimeseriesResponse,
  GoalTimeseriesInterval,
  GoalSummaryEntry,
  GoalTimeseriesSeries,
  GoalTimeseriesPoint,
  AnomalyBaselineEntry,
  AnomalyBaselineUpsertInput,
  AnomalyEventEntry,
  AnomalyEventInput,
  AnomalyFeedResponse,
  BenchmarkSummary
} from '../types/services';

const toDateKey = (value?: Date | string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split('T')[0];
};

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

const toIsoDate = (input: Date): string => input.toISOString().split('T')[0];

const normalizeSegmentValue = (value?: string | null): string => {
  if (!value) {
    return 'unknown';
  }

  return String(value).trim().toLowerCase() || 'unknown';
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

const recordMatchesFilters = (record: FilterRecord, normalized: NormalizedAnalyticsFilters): boolean => {
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

interface User {
  id: string;
  deviceId: string;
  email?: string;
  username?: string;
  passwordHash?: string;
  phoneHash?: string;
  verificationStatus: 'guest' | 'verified';
  subscriptionLevel: 'normal' | 'premium';
  role: 'user' | 'admin' | 'super_admin';
  tier?: string;
  status: string;
  coins: number;
  totalChats?: number;
  dailyChats?: number;
  lastCoinClaim?: Date;
  reportCount?: number;
  isOnline?: boolean;
  isVerified: boolean;
  gender?: 'male' | 'female' | 'others';
  platform?: 'ios' | 'android' | 'web' | 'desktop' | 'other' | string;
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
  activeDeviceToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  lastPasswordResetAt?: Date | null;
  preferences: any;
  subscription: any;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

interface ChatSession {
  id: string;
  user1Id: string;
  user2Id: string;
  mode: ChatMode;
  status: string;
  startedAt: Date;
  endedAt?: Date | null;
  durationSeconds?: number | null;
  messageCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Admin {
  id: string;
  userId?: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
  isOwner: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseService {
  private static users: Map<string, User> = new Map();
  private static sessions: Map<string, ChatSession> = new Map();
  private static bans: Map<string, any> = new Map();
  private static deletedUsers: Map<string, any> = new Map();
  private static adminDeletedUsers: Map<string, any> = new Map();
  private static reportedChatTranscripts: Map<string, any> = new Map();
  private static admins: Map<string, Admin> = new Map();
  private static coinAdjustments: Map<string, any[]> = new Map();
  private static goalDefinitions: Map<string, GoalDefinition> = new Map();
  private static goalSnapshots: Map<string, GoalSnapshotRecord[]> = new Map();
  private static goalRecomputeTimers: Map<string, NodeJS.Timeout> = new Map();
  private static anomalyBaselines: Map<string, AnomalyBaselineEntry> = new Map();
  private static anomalyEvents: AnomalyEventEntry[] = [];
  private static anomalyScanTimer: NodeJS.Timeout | null = null;
  private static goalsSeeded = false;

  private static generateId(prefix = ''): string {
    return `${prefix}${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  }

  private static normalizeGoalKey(key: string): string {
    return key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      || this.generateId('goal-');
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

  private static findGoalById(id: string): GoalDefinition | undefined {
    return Array.from(this.goalDefinitions.values()).find((goal) => goal.id === id);
  }

  private static ensureGoalTags(tags?: string[]): string[] {
    if (!tags || tags.length === 0) {
      return [];
    }
    const unique = new Set<string>();
    tags.forEach((tag) => {
      if (!tag) {
        return;
      }
      const normalized = tag.trim().toLowerCase();
      if (normalized) {
        unique.add(normalized);
      }
    });
    return Array.from(unique);
  }

  private static storeGoalDefinition(definition: GoalDefinition): GoalDefinition {
    const normalized = this.cloneGoalDefinition({
      ...definition,
      tags: this.ensureGoalTags(definition.tags),
      updatedAt: new Date(definition.updatedAt),
      createdAt: new Date(definition.createdAt)
    });
    this.goalDefinitions.set(normalized.key, normalized);
    return this.cloneGoalDefinition(normalized);
  }

  private static getGoalSnapshots(goalKey: string): GoalSnapshotRecord[] {
    const entries = this.goalSnapshots.get(goalKey) ?? [];
    return entries.map((entry) => ({
      goalKey: entry.goalKey,
      timestamp: new Date(entry.timestamp),
      value: entry.value,
      targetValue: entry.targetValue,
      delta: entry.delta ?? 0,
      metadata: entry.metadata ? { ...entry.metadata } : undefined
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

    // Keep last 720 snapshots (~2 years daily)
    const trimmed = next.length > 720 ? next.slice(next.length - 720) : next;
    this.goalSnapshots.set(snapshot.goalKey, trimmed);
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
    const goal = this.goalDefinitions.get(goalKey);
    if (!goal || !goal.isActive) {
      return;
    }

    const computation = await this.computeGoalValue(goal);
    const snapshots = this.goalSnapshots.get(goalKey) ?? [];
    const previous = snapshots.length ? snapshots[snapshots.length - 1] : null;
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
  }

  private static async computeGoalValue(goal: GoalDefinition): Promise<{ value: number; metadata?: Record<string, any> }> {
    switch (goal.metric) {
      case 'coins': {
        const totals = Array.from(this.users.values()).reduce(
          (acc, user) => {
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
        this.users.forEach((user) => {
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
        this.sessions.forEach((session) => {
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
            totalSessions: this.sessions.size
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

  private static baselineKey(metric: string, period: string): string {
    return `${metric}::${period}`;
  }

  private static ensureAnomalyScanner(): void {
    if (this.anomalyScanTimer) {
      return;
    }
    const runScan = () => {
      this.runAnomalyScan().catch((error) => {
        console.error('Anomaly scan failed', error);
      });
    };
    // Kick off immediately then schedule every 15 minutes
    runScan();
    this.anomalyScanTimer = setInterval(runScan, 15 * 60 * 1000);
  }

  private static async runAnomalyScan(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * DAY_MS);
    const metrics = await this.collectAnomalySeries(windowStart, now);

    for (const metric of metrics) {
      const dailyValues = metric.points;
      if (dailyValues.length < 7) {
        continue;
      }

      const values = dailyValues.map((point) => point.value);
      const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
      const variance = values.reduce((acc, val) => acc + (val - mean) ** 2, 0) / values.length;
      const stdev = Math.sqrt(variance);
      const latestPoint = dailyValues[dailyValues.length - 1];

      const baselineEntry: AnomalyBaselineEntry = {
        metric: metric.metric,
        period: 'day',
        mean: Math.round(mean * 100) / 100,
        standardDeviation: Math.round(stdev * 100) / 100,
        sampleSize: values.length,
        trend: dailyValues.length >= 2 ? latestPoint.value - dailyValues[0].value : undefined,
        updatedAt: new Date().toISOString(),
        metadata: metric.metadata
      };

      await this.upsertBenchmark({
        metric: metric.metric,
        period: 'day',
        mean: baselineEntry.mean,
        standardDeviation: baselineEntry.standardDeviation,
        sampleSize: baselineEntry.sampleSize,
        trend: baselineEntry.trend,
        updatedAt: new Date(),
        metadata: baselineEntry.metadata
      });

      if (stdev === 0) {
        continue;
      }

      const zScore = (latestPoint.value - mean) / stdev;
      const absZ = Math.abs(zScore);
      if (absZ < 1.5) {
        continue;
      }

      const severity: 'low' | 'medium' | 'high' = absZ >= 3.5 ? 'high' : absZ >= 2.5 ? 'medium' : 'low';
      const direction: 'positive' | 'negative' = zScore >= 0 ? 'positive' : 'negative';

      await this.recordAnomalyEvent({
        metric: metric.metric,
        timestamp: new Date(latestPoint.timestamp),
        actual: latestPoint.value,
        expected: baselineEntry.mean,
        baselineMean: baselineEntry.mean,
        baselineStdDev: baselineEntry.standardDeviation,
        zScore,
        severity,
        direction,
        metadata: metric.metadata
      });
    }
  }

  private static async collectAnomalySeries(start: Date, end: Date): Promise<Array<{ metric: string; points: Array<{ timestamp: string; value: number }>; metadata?: Record<string, any> }>> {
    const metrics: Array<{ metric: string; points: Array<{ timestamp: string; value: number }>; metadata?: Record<string, any> }> = [];

    const matchesGoal = this.goalDefinitions.get('matches_completed');
    if (matchesGoal) {
      const snapshots = this.goalSnapshots.get(matchesGoal.key) ?? [];
      const filtered = snapshots.filter((snapshot) => snapshot.timestamp >= start && snapshot.timestamp <= end);
      const daily = new Map<string, number>();
      filtered.forEach((snapshot) => {
        const dateKey = toDateKey(snapshot.timestamp) ?? toIsoDate(snapshot.timestamp);
        daily.set(dateKey, snapshot.value);
      });
      const points = Array.from(daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ timestamp: `${date}T00:00:00.000Z`, value }));
      if (points.length) {
        metrics.push({ metric: 'matches_per_day', points, metadata: { goalKey: matchesGoal.key } });
      }
    }

    const coinsGoal = this.goalDefinitions.get('total_coins');
    if (coinsGoal) {
      const snapshots = this.goalSnapshots.get(coinsGoal.key) ?? [];
      const filtered = snapshots.filter((snapshot) => snapshot.timestamp >= start && snapshot.timestamp <= end);
      const daily = new Map<string, number>();
      filtered.forEach((snapshot) => {
        const dateKey = toDateKey(snapshot.timestamp) ?? toIsoDate(snapshot.timestamp);
        daily.set(dateKey, snapshot.value);
      });
      const points = Array.from(daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ timestamp: `${date}T00:00:00.000Z`, value }));
      if (points.length) {
        metrics.push({ metric: 'coins_balance_total', points, metadata: { goalKey: coinsGoal.key } });
      }
    }

    const profileGoal = this.goalDefinitions.get('profile_completion_rate');
    if (profileGoal) {
      const snapshots = this.goalSnapshots.get(profileGoal.key) ?? [];
      const filtered = snapshots.filter((snapshot) => snapshot.timestamp >= start && snapshot.timestamp <= end);
      const daily = new Map<string, number>();
      filtered.forEach((snapshot) => {
        const dateKey = toDateKey(snapshot.timestamp) ?? toIsoDate(snapshot.timestamp);
        daily.set(dateKey, snapshot.value);
      });
      const points = Array.from(daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ timestamp: `${date}T00:00:00.000Z`, value }));
      if (points.length) {
        metrics.push({ metric: 'profile_completion_percent', points, metadata: { goalKey: profileGoal.key } });
      }
    }

    return metrics;
  }

  private static async seedDefaultGoals(): Promise<void> {
    if (this.goalsSeeded) {
      return;
    }

    this.goalsSeeded = true;

    if (this.goalDefinitions.size > 0) {
      return;
    }

    const defaults: GoalDefinitionInput[] = [
      {
        key: 'total_coins',
        name: 'Total Coins Collected',
        description: 'Tracks cumulative coins in circulation across all users.',
        metric: 'coins',
        targetValue: 50000,
        unit: 'coins',
        tags: ['monetization', 'revenue'],
        color: '#f59e0b',
        isActive: true,
        alertThresholdPercent: 85
      },
      {
        key: 'profile_completion_rate',
        name: 'Profile Completion Rate',
        description: 'Percentage of verified users and rich profiles.',
        metric: 'profile_completion',
        targetValue: 75,
        unit: '%',
        tags: ['onboarding', 'quality'],
        color: '#6366f1',
        isActive: true,
        alertThresholdPercent: 70
      },
      {
        key: 'matches_completed',
        name: 'Completed Matches',
        description: 'Number of chat sessions that reached completion.',
        metric: 'matches',
        targetValue: 1200,
        unit: 'sessions',
        tags: ['engagement'],
        color: '#10b981',
        isActive: true,
        alertThresholdPercent: 80
      }
    ];

    const now = new Date();
    for (const definition of defaults) {
      const key = this.normalizeGoalKey(definition.key);
      const goal: GoalDefinition = {
        id: this.generateId('goal-'),
        key,
        name: definition.name,
        description: definition.description,
        metric: definition.metric,
        targetValue: Number.isFinite(definition.targetValue) ? Number(definition.targetValue) : 0,
        unit: definition.unit,
        tags: this.ensureGoalTags(definition.tags),
        isActive: definition.isActive ?? true,
        ownerEmail: definition.ownerEmail,
        color: definition.color,
        alertThresholdPercent: definition.alertThresholdPercent ?? GOAL_DEFAULT_WARN_THRESHOLD,
        metadata: definition.metadata ? { ...definition.metadata } : undefined,
        createdAt: now,
        updatedAt: now
      };
      this.storeGoalDefinition(goal);
      await this.recomputeGoal(goal.key);
    }
  }

  private static async ensureGoalsSeeded(): Promise<void> {
    if (!this.goalsSeeded) {
      await this.seedDefaultGoals();
    }
  }

  private static deriveClassification(input: Partial<User>): {
    role: 'user' | 'admin' | 'super_admin';
    verificationStatus: 'guest' | 'verified';
    subscriptionLevel: 'normal' | 'premium';
    tier: string;
  } {
    const tier = input.tier;

    const role: 'user' | 'admin' | 'super_admin' = (() => {
      if (input.role === 'super_admin' || tier === 'super_admin') return 'super_admin';
      if (input.role === 'admin' || tier === 'admin') return 'admin';
      return 'user';
    })();

    const verificationStatus: 'guest' | 'verified' = (() => {
      if (input.verificationStatus === 'verified' || input.isVerified) return 'verified';
      if (tier === 'verified' || tier === 'premium' || tier === 'admin' || tier === 'super_admin') {
        return 'verified';
      }
      return 'guest';
    })();

    const subscriptionLevel: 'normal' | 'premium' = (() => {
      if (input.subscriptionLevel === 'premium' || tier === 'premium') return 'premium';
      return 'normal';
    })();

    const legacyTier = tier
      || (role === 'super_admin' ? 'super_admin'
        : role === 'admin' ? 'admin'
          : subscriptionLevel === 'premium' ? 'premium'
            : verificationStatus === 'verified' ? 'verified'
              : 'guest');

    return { role, verificationStatus, subscriptionLevel, tier: legacyTier };
  }

  static async initialize() {
    console.log('✅ Development database initialized (in-memory)');
    
    // Create a test user for development
    const testClassification = this.deriveClassification({});
    const testUser: User = {
      id: 'test-user-1',
      deviceId: 'dev-device-1',
      verificationStatus: testClassification.verificationStatus,
      subscriptionLevel: testClassification.subscriptionLevel,
      role: testClassification.role,
      tier: testClassification.tier,
      status: 'active',
      coins: 100,
      totalChats: 0,
      dailyChats: 0,
      lastCoinClaim: new Date(),
      isVerified: false,
      gender: 'others',
      activeDeviceToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastPasswordResetAt: null,
      preferences: { language: 'en', interests: [] },
      subscription: { type: 'none' },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };
    
    this.users.set(testUser.id, testUser);

    await this.seedDefaultAdmin();
        await this.seedDefaultGoals();
        this.ensureAnomalyScanner();
  }

  private static async seedDefaultAdmin(): Promise<void> {
    const existingAdmins = Array.from(this.admins.values());
    if (existingAdmins.length > 0) {
      return;
    }

    const configuredEmail = process.env.DEV_ADMIN_EMAIL || process.env.OWNER_ADMIN_EMAIL;
    const configuredUsername = process.env.DEV_ADMIN_USERNAME;
    const configuredPasswordHash = process.env.DEV_ADMIN_PASSWORD_HASH;
    const configuredPassword = process.env.DEV_ADMIN_PASSWORD;

    const resolvedEmail = (configuredEmail || 'owner@local.test').trim().toLowerCase();
    const username = (configuredUsername || resolvedEmail).trim();

    let passwordHash = configuredPasswordHash?.trim();
    if (!passwordHash) {
      const passwordToHash = configuredPassword || 'dev-admin-password';
      if (!configuredPassword && !configuredPasswordHash) {
        console.warn('⚠️ DEV_ADMIN_PASSWORD/DEV_ADMIN_PASSWORD_HASH not set. Using non-secure development default password. Set DEV_ADMIN_PASSWORD for your environment.');
      }
      passwordHash = await bcrypt.hash(passwordToHash, 12);
    }

    const admin: Admin = {
      id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username,
    email: resolvedEmail,
      passwordHash,
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

    this.admins.set(admin.id, admin);
    console.log('👑 Seeded development owner admin account');
  }

  static async close() {
    console.log('📦 Development database closed');
  }

  // User methods
  static async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  static async getUserByDeviceId(deviceId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.deviceId === deviceId) {
        return user;
      }
    }
    return null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  static async createUser(userData: Partial<User>): Promise<User> {
    const classification = this.deriveClassification(userData);
    const isVerified = userData.isVerified ?? classification.verificationStatus === 'verified';

    const user: User = {
      id: userData.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: userData.deviceId!,
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
      phoneHash: userData.phoneHash,
      verificationStatus: classification.verificationStatus,
      subscriptionLevel: classification.subscriptionLevel,
      role: classification.role,
      tier: classification.tier,
      status: userData.status || 'active',
      coins: userData.coins ?? 50,
      totalChats: userData.totalChats ?? 0,
      dailyChats: userData.dailyChats ?? 0,
      lastCoinClaim: userData.lastCoinClaim ?? new Date(),
      isVerified,
      gender: userData.gender || 'others',
      platform: userData.platform || 'web',
      signupSource: userData.signupSource || 'organic',
      campaignId: userData.campaignId || 'unknown',
      signupCountryCode: userData.signupCountryCode || 'unknown',
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
      activeDeviceToken: userData.activeDeviceToken ?? null,
      passwordResetToken: userData.passwordResetToken ?? null,
      passwordResetExpires: userData.passwordResetExpires ?? null,
      lastPasswordResetAt: userData.lastPasswordResetAt ?? null,
      preferences: userData.preferences || { 
        language: 'en', 
        interests: [],
        genderPreference: 'any'
      },
      subscription: userData.subscription || { type: 'none' },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const merged = { ...user, ...updates } as Partial<User>;
    const classification = this.deriveClassification(merged);

    const updatedUser: User = {
      ...user,
      ...updates,
      platform: updates.platform ?? user.platform,
      signupSource: updates.signupSource ?? user.signupSource,
      campaignId: updates.campaignId ?? user.campaignId,
      signupCountryCode: updates.signupCountryCode ?? user.signupCountryCode,
      signupCountryName: updates.signupCountryName ?? user.signupCountryName,
      signupRegionCode: updates.signupRegionCode ?? user.signupRegionCode,
      signupRegionName: updates.signupRegionName ?? user.signupRegionName,
      signupSubdivisionCode: updates.signupSubdivisionCode ?? user.signupSubdivisionCode,
      signupCity: updates.signupCity ?? user.signupCity,
      signupLatitude: typeof updates.signupLatitude === 'number' ? updates.signupLatitude : user.signupLatitude,
      signupLongitude: typeof updates.signupLongitude === 'number' ? updates.signupLongitude : user.signupLongitude,
      signupAccuracyRadius: typeof updates.signupAccuracyRadius === 'number' ? updates.signupAccuracyRadius : user.signupAccuracyRadius,
      referrerUrl: updates.referrerUrl ?? user.referrerUrl,
      referrerDomain: updates.referrerDomain ?? user.referrerDomain,
      utmSource: updates.utmSource ?? user.utmSource,
      utmMedium: updates.utmMedium ?? user.utmMedium,
      utmCampaign: updates.utmCampaign ?? user.utmCampaign,
      utmTerm: updates.utmTerm ?? user.utmTerm,
      utmContent: updates.utmContent ?? user.utmContent,
      verificationStatus: classification.verificationStatus,
      subscriptionLevel: classification.subscriptionLevel,
      role: classification.role,
      tier: classification.tier,
      isVerified: typeof updates.isVerified === 'boolean'
        ? updates.isVerified
        : classification.verificationStatus === 'verified',
      updatedAt: new Date()
    } as User;

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  static async setPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;
    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = expiresAt;
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  static async getUserByPasswordResetToken(tokenHash: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.passwordResetToken === tokenHash) {
        return user;
      }
    }
    return null;
  }

  static async clearPasswordResetToken(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  static async updateUserPassword(userId: string, passwordHash: string): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const updated: User = {
      ...user,
      passwordHash,
      activeDeviceToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastPasswordResetAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(userId, updated);
    if (updated.role === 'admin' || updated.role === 'super_admin') {
      this.refreshAdminPasswordMock(updated);
    }
    return updated;
  }

  private static ensureDailyReset(user: User): User {
    const now = new Date();
    const lastClaim = user.lastCoinClaim ? new Date(user.lastCoinClaim) : null;
    if (!lastClaim) {
      const migratedUser: User = {
        ...user,
        lastCoinClaim: now,
        dailyChats: user.dailyChats ?? 0,
        totalChats: user.totalChats ?? 0,
        updatedAt: now
      };
      this.users.set(migratedUser.id, migratedUser);
      return migratedUser;
    }

    if (lastClaim.toDateString() === now.toDateString()) {
      return user;
    }

    const resetUser: User = {
      ...user,
      coins: 50,
      dailyChats: 0,
      lastCoinClaim: now,
      updatedAt: now
    };
    this.users.set(resetUser.id, resetUser);
    return resetUser;
  }

  static async resetDailyCoinsIfNeeded(userId: string): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    const updated = this.ensureDailyReset(user);
    return { ...updated };
  }

  static async spendCoinsForMatch(
    userId: string,
    cost: number
  ): Promise<{
    success: boolean;
    user?: User;
    previous?: { coins: number; totalChats: number; dailyChats: number; lastCoinClaim?: Date };
    reason?: 'NOT_FOUND' | 'INSUFFICIENT_COINS';
  }> {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, reason: 'NOT_FOUND' };
    }

    const normalized = this.ensureDailyReset(user);
    const availableCoins = normalized.coins ?? 0;
    if (availableCoins < cost) {
      return { success: false, reason: 'INSUFFICIENT_COINS' };
    }

    const previous = {
      coins: normalized.coins ?? 0,
      totalChats: normalized.totalChats ?? 0,
      dailyChats: normalized.dailyChats ?? 0,
      lastCoinClaim: normalized.lastCoinClaim
    };

    const updatedUser: User = {
      ...normalized,
      coins: previous.coins - cost,
      totalChats: previous.totalChats + 1,
      dailyChats: previous.dailyChats + 1,
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };

    this.users.set(userId, updatedUser);
    return { success: true, user: { ...updatedUser }, previous };
  }

  static async refundMatchSpend(
    userId: string,
    previous: { coins: number; totalChats: number; dailyChats: number; lastCoinClaim?: Date }
  ): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    const refunded: User = {
      ...user,
      coins: previous.coins,
      totalChats: Math.max(previous.totalChats, 0),
      dailyChats: Math.max(previous.dailyChats, 0),
      lastCoinClaim: previous.lastCoinClaim || user.lastCoinClaim,
      updatedAt: new Date()
    };

    this.users.set(userId, refunded);
    return { ...refunded };
  }

  static async adjustUserCoins(
    userId: string,
    delta: number,
    metadata: { reason?: string; adminId?: string; adminUsername?: string } = {}
  ): Promise<{ success: boolean; user?: User; adjustment?: any; error?: string }> {
    if (!Number.isFinite(delta) || delta === 0) {
      return { success: false, error: 'INVALID_DELTA' };
    }

    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    const normalized = this.ensureDailyReset(user);
    const previousCoins = normalized.coins ?? 0;
    const now = new Date();
    const newCoins = Math.max(previousCoins + delta, 0);

    const updated: User = {
      ...normalized,
      coins: newCoins,
      updatedAt: now,
      lastActiveAt: now
    };

    this.users.set(userId, updated);

    const adjustmentRecord = {
      id: `coinadj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      delta,
      reason: metadata.reason || 'manual_adjustment',
      adminId: metadata.adminId,
      adminUsername: metadata.adminUsername,
      previousCoins,
      newCoins,
      createdAt: now
    };

    const history = this.coinAdjustments.get(userId) || [];
    history.unshift(adjustmentRecord);
    this.coinAdjustments.set(userId, history.slice(0, 50));

    return {
      success: true,
      user: { ...updated },
      adjustment: adjustmentRecord
    };
  }

  static async getCoinAdjustmentHistory(userId: string, limit: number = 20): Promise<any[]> {
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
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    const inferredContext: 'user' | 'admin' | 'system' = metadata.context
      ?? (metadata.deletedBy === 'system'
        ? 'system'
        : metadata.deletedBy && metadata.deletedBy !== userId
          ? 'admin'
          : 'user');

    const archivedBase = {
      userId,
      reason: metadata.reason || 'user_request',
      deletedBy: metadata.deletedBy || userId,
      deletedAt: new Date(),
      originalData: { ...user }
    };

    const archivedRecord = inferredContext === 'admin'
      ? {
          ...archivedBase,
          adminId: metadata.adminId || metadata.deletedBy,
          adminUsername: metadata.adminUsername || null
        }
      : archivedBase;

    if (inferredContext === 'admin') {
      this.adminDeletedUsers.set(userId, archivedRecord);
    } else {
      this.deletedUsers.set(userId, archivedRecord);
    }

    this.users.delete(userId);

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.user1Id === userId || session.user2Id === userId) {
        this.sessions.delete(sessionId);
      }
    }

    return { success: true, archived: archivedRecord };
  }

  // Ban checking
  static async checkUserBanned(deviceHash: string, phoneHash?: string, ipHash?: string): Promise<any> {
    return this.bans.get(deviceHash) || null;
  }

  // Chat session methods
  static async createChatSession(sessionData: { user1Id: string; user2Id: string; mode: string }): Promise<ChatSession> {
    const session: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user1Id: sessionData.user1Id,
      user2Id: sessionData.user2Id,
      mode: normalizeChatMode(sessionData.mode),
      status: 'active',
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: null,
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  static async getChatSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  // Placeholder methods for other functionality
  static async updateLastActive(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.lastActiveAt = new Date();
    }
  }

  static async verifyPhone(userId: string, phoneHash: string): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    const classification = this.deriveClassification({
      ...user,
      verificationStatus: 'verified',
      isVerified: true
    });

    const updated: User = {
      ...user,
      phoneHash,
      isVerified: true,
      verificationStatus: classification.verificationStatus,
      subscriptionLevel: classification.subscriptionLevel,
      role: classification.role,
      tier: classification.tier,
      updatedAt: new Date()
    };

    this.users.set(userId, updated);
    return updated;
  }

  static async verifyUserPhone(userId: string, phoneHash: string): Promise<User | null> {
    return this.verifyPhone(userId, phoneHash);
  }

  static async getUserStats(): Promise<any> {
    return {
      totalUsers: this.users.size,
      activeSessions: this.sessions.size,
      onlineUsers: 0
    };
  }

  // Additional methods needed by socket service
  static async createModerationReport(reportData: any): Promise<any> {
    console.log('📝 Moderation report created (dev):', reportData);
    return { id: `report-${Date.now()}`, ...reportData };
  }

  static async endChatSession(sessionId: string, duration?: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      const endedAt = new Date();
      session.updatedAt = endedAt;
      session.endedAt = endedAt;
      if (Number.isFinite(duration)) {
        session.durationSeconds = Math.max(0, Math.round(Number(duration)));
      } else if (session.startedAt) {
        const computed = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000);
        session.durationSeconds = Math.max(0, computed);
      }
      console.log('✅ Chat session ended (dev):', sessionId);
    }
  }

  static async query(text: string, params?: any[]): Promise<any> {
    console.log('🔍 Database query (dev):', text, params);
    // Simple mock query for basic operations
    if (text.includes('SELECT * FROM chat_sessions')) {
      const sessionId = params?.[0];
      const session = this.sessions.get(sessionId);
      return { rows: session ? [session] : [] };
    }
    return { rows: [] };
  }

  /* ---------- Ban & Report System (Dev Mock) ---------- */
  
  static async checkUserBanStatus(userId: string): Promise<any | null> {
    const ban = this.bans.get(userId);
    if (!ban || !ban.isActive) return null;
    
    // Check if temporary ban expired
    if (ban.banType === 'temporary' && ban.expiresAt && new Date(ban.expiresAt) < new Date()) {
      ban.isActive = false;
      this.bans.set(userId, ban);
      return null;
    }
    
    return ban;
  }

  static async getUserReportCount(userId: string): Promise<number> {
    // Mock: return 0 in dev mode (reports stored in memory would be lost)
    return 0;
  }

  static async autoBanUserByReports(userId: string, reportCount: number, reason: string): Promise<any | null> {
    let banType: 'temporary' | 'permanent';
    let banDuration: number | undefined;
    let expiresAt: Date | undefined;

    if (reportCount >= 9) {
      banType = 'permanent';
    } else if (reportCount >= 6) {
      banType = 'temporary';
      banDuration = 14;
      expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    } else if (reportCount >= 3) {
      banType = 'temporary';
      banDuration = 7;
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else {
      return null;
    }

    const ban = {
      id: `ban-${Date.now()}`,
      userId,
      reportCount,
      banType,
      banDuration,
      bannedAt: new Date(),
      expiresAt,
      reason,
      bannedBy: 'auto',
      isActive: true
    };

    this.bans.set(userId, ban);
    
    const user = this.users.get(userId);
    if (user) {
      user.status = 'banned';
    }

    console.log(`🚫 User ${userId} auto-banned (dev): ${banType}`);
    return ban;
  }

  static async banUser(userId: string, banType: 'temporary' | 'permanent', duration?: number, reason?: string, adminId?: string): Promise<any | null> {
    const expiresAt = banType === 'temporary' && duration 
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : undefined;

    const ban = {
      id: `ban-${Date.now()}`,
      userId,
      reportCount: 0,
      banType,
      banDuration: duration,
      bannedAt: new Date(),
      expiresAt,
      reason: reason || 'Manual ban',
      bannedBy: adminId || 'admin',
      isActive: true
    };

    this.bans.set(userId, ban);
    
    const user = this.users.get(userId);
    if (user) {
      user.status = 'banned';
    }

    console.log(`🚫 User ${userId} manually banned (dev) by ${adminId}`);
    return ban;
  }

  static async unbanUser(userId: string, adminId?: string): Promise<boolean> {
    this.bans.delete(userId);
    
    const user = this.users.get(userId);
    if (user) {
      user.status = 'active';
    }

    console.log(`✅ User ${userId} unbanned (dev) by ${adminId}`);
    return true;
  }

  static async getUserBanHistory(userId: string): Promise<any[]> {
    const ban = this.bans.get(userId);
    return ban ? [ban] : [];
  }

  static async setUserOnlineStatus(userId: string, isOnline: boolean): Promise<boolean> {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  static async getUserReports(userId: string): Promise<any[]> {
    // Mock: return empty array in dev mode
    return [];
  }

  static async getUsersByStatus(status: string): Promise<any[]> {
    return Array.from(this.users.values()).filter(u => u.status === status);
  }

  static async getPendingReports(limit: number = 50): Promise<any[]> {
    // Mock: return empty array in dev mode
    return [];
  }

  static async getReportsByStatus(status: string, limit: number = 100): Promise<any[]> {
    // Mock: return empty array in dev mode
    void status;
    void limit;
    return [];
  }

  static async getAllReports(limit: number = 100): Promise<any[]> {
    // Mock: return empty array in dev mode
    return [];
  }

  static async updateReportStatus(reportId: string, status: string): Promise<boolean> {
    console.log(`📝 Report ${reportId} status updated to ${status} (dev)`);
    return true;
  }

  static async getPlatformStats(): Promise<any> {
    return {
      totalUsers: this.users.size,
      activeUsers: Array.from(this.users.values()).filter(u => u.status === 'active').length,
      bannedUsers: this.bans.size,
      totalReports: 0,
      pendingReports: 0,
      totalSessions: this.sessions.size
    };
  }

  static async getUserGrowthMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<UserGrowthSummary> {
    const normalizedStart = new Date(start.getTime());
    normalizedStart.setUTCHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end.getTime());
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
      throw new Error('Invalid date range for user growth metrics');
    }

    const dateKeys = buildDateRange(normalizedStart, normalizedEnd);
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

    const matchesFilters = (user: User): boolean => {
      const genderValue = normalizeSegmentValue(user.gender);
      const platformValue = normalizeSegmentValue(user.platform);
      const signupValue = normalizeSegmentValue(user.signupSource);
      const campaignValue = normalizeSegmentValue(user.campaignId);

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

    const newByDay = new Map<string, Set<string>>();
    const returningByDay = new Map<string, Set<string>>();
    const uniqueRangeUsers = new Set<string>();
    const uniqueNewUsers = new Set<string>();
    const uniqueReturningUsers = new Set<string>();

    for (const user of this.users.values()) {
      if (!matchesFilters(user)) {
        continue;
      }

      const createdKey = toDateKey(user.createdAt);
      const activityKey = toDateKey(user.lastActiveAt || user.updatedAt || user.createdAt);

      if (createdKey && dateSet.has(createdKey)) {
        if (!newByDay.has(createdKey)) {
          newByDay.set(createdKey, new Set());
        }
        newByDay.get(createdKey)!.add(user.id);
        uniqueNewUsers.add(user.id);
        uniqueRangeUsers.add(user.id);
      }

      if (activityKey && dateSet.has(activityKey)) {
        const createdBeforeActivity = !createdKey || createdKey < activityKey;
        if (createdBeforeActivity) {
          if (!returningByDay.has(activityKey)) {
            returningByDay.set(activityKey, new Set());
          }
          returningByDay.get(activityKey)!.add(user.id);
          uniqueReturningUsers.add(user.id);
          uniqueRangeUsers.add(user.id);
        }
      }
    }

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
        start: dateKeys[0] ?? toDateKey(normalizedStart) ?? '',
        end: dateKeys[dateKeys.length - 1] ?? toDateKey(normalizedEnd) ?? '',
        days: dateKeys.length
      },
      totals: {
        newUsers: uniqueNewUsers.size,
        returningUsers: uniqueReturningUsers.size,
        totalUsers: uniqueRangeUsers.size
      },
      daily
    };
  }

  static async getUserRetentionMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<UserRetentionSummary> {
    const normalizedStart = new Date(start.getTime());
    normalizedStart.setUTCHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end.getTime());
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
      throw new Error('Invalid date range for retention metrics');
    }

    const windowDays = Math.floor((normalizedEnd.getTime() - normalizedStart.getTime()) / DAY_MS) + 1;
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

    const matchesFilters = (user: User): boolean => {
      const genderValue = normalizeSegmentValue(user.gender);
      const platformValue = normalizeSegmentValue(user.platform);
      const signupValue = normalizeSegmentValue(user.signupSource);
      const campaignValue = normalizeSegmentValue(user.campaignId);

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

    const cohorts = new Map<string, Set<string>>();
    const userActivity = new Map<string, Set<string>>();

    for (const user of this.users.values()) {
      if (!matchesFilters(user)) {
        continue;
      }

      const createdAt = new Date(user.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        continue;
      }

      if (createdAt < normalizedStart || createdAt > normalizedEnd) {
        continue;
      }

      const cohortKey = toDateKey(createdAt);
      if (!cohortKey) {
        continue;
      }

      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, new Set());
      }
      cohorts.get(cohortKey)!.add(user.id);

      if (!userActivity.has(user.id)) {
        userActivity.set(user.id, new Set());
      }

      const activity = userActivity.get(user.id)!;
      const lastActiveKey = toDateKey(user.lastActiveAt);
      if (lastActiveKey) {
        activity.add(lastActiveKey);
      }
      const updatedKey = toDateKey(user.updatedAt);
      if (updatedKey) {
        activity.add(updatedKey);
      }
    }

    if (cohorts.size === 0) {
      return {
        window: {
          start: toDateKey(normalizedStart) ?? '',
          end: toDateKey(normalizedEnd) ?? '',
          cohorts: 0
        },
        maxOffset,
        averages: [],
        cohorts: []
      };
    }

    const activityUpperBound = addUtcDays(normalizedEnd, maxOffset);

    for (const session of this.sessions.values()) {
      const timestamp = session.createdAt ?? session.updatedAt ?? null;
      if (!timestamp) {
        continue;
      }

      const sessionDate = timestamp instanceof Date ? new Date(timestamp) : new Date(timestamp);
      if (Number.isNaN(sessionDate.getTime())) {
        continue;
      }

      sessionDate.setUTCHours(0, 0, 0, 0);
      if (sessionDate < normalizedStart || sessionDate > activityUpperBound) {
        continue;
      }

      const sessionKey = toDateKey(sessionDate);
      if (!sessionKey) {
        continue;
      }

      const participants = [session.user1Id, session.user2Id];
      for (const participant of participants) {
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
        const targetKey = toDateKey(targetDate) ?? cohortKey;

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
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? '',
        cohorts: retentionCohorts.length
      },
      maxOffset,
      averages,
      cohorts: retentionCohorts
    };
  }

  static async getFunnelMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<FunnelSummary> {
    const normalizedStart = new Date(start.getTime());
    normalizedStart.setUTCHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end.getTime());
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
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

    const matchesFilters = (user: User): boolean => {
      const genderValue = normalizeSegmentValue(user.gender);
      const platformValue = normalizeSegmentValue(user.platform);
      const signupValue = normalizeSegmentValue(user.signupSource);
      const campaignValue = normalizeSegmentValue(user.campaignId);

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

    const relevantUsers: User[] = [];
    for (const user of this.users.values()) {
      if (!matchesFilters(user)) {
        continue;
      }

      const createdAt = new Date(user.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        continue;
      }

      if (createdAt < normalizedStart || createdAt > normalizedEnd) {
        continue;
      }

      relevantUsers.push(user);
    }

    if (relevantUsers.length === 0) {
      return {
        window: {
          start: toDateKey(normalizedStart) ?? '',
          end: toDateKey(normalizedEnd) ?? ''
        },
        funnels: []
      };
    }
    const userIdSet = new Set(relevantUsers.map((user) => user.id));
    const userActivity = new Map<string, Set<string>>();
    const sessionCounts = new Map<string, number>();

    for (const userId of userIdSet) {
      userActivity.set(userId, new Set());
      sessionCounts.set(userId, 0);
    }

    for (const user of relevantUsers) {
      const activity = userActivity.get(user.id)!;
      const lastActiveKey = toDateKey(user.lastActiveAt);
      if (lastActiveKey) {
        activity.add(lastActiveKey);
      }
      const updatedKey = toDateKey(user.updatedAt);
      if (updatedKey) {
        activity.add(updatedKey);
      }
    }

    for (const session of this.sessions.values()) {
      if (!userIdSet.has(session.user1Id) && !userIdSet.has(session.user2Id)) {
        continue;
      }

      const timestamp = session.createdAt ?? session.updatedAt ?? null;
      if (!timestamp) {
        continue;
      }

      const sessionDate = timestamp instanceof Date ? new Date(timestamp) : new Date(timestamp);
      if (Number.isNaN(sessionDate.getTime())) {
        continue;
      }

      sessionDate.setUTCHours(0, 0, 0, 0);
      if (sessionDate < normalizedStart || sessionDate > normalizedEnd) {
        continue;
      }

      const sessionKey = toDateKey(sessionDate);
      if (!sessionKey) {
        continue;
      }

      const participants = [session.user1Id, session.user2Id];
      for (const participant of participants) {
        if (!userIdSet.has(participant)) {
          continue;
        }
        const activity = userActivity.get(participant);
        if (activity) {
          activity.add(sessionKey);
        }
        sessionCounts.set(participant, (sessionCounts.get(participant) ?? 0) + 1);
      }
    }

    for (const user of relevantUsers) {
      const baselineCount = user.totalChats ?? 0;
      if (baselineCount > (sessionCounts.get(user.id) ?? 0)) {
        sessionCounts.set(user.id, baselineCount);
      }
    }

    type FunnelContext = {
      user: User;
      chatCount: number;
      activity: Set<string>;
    };

    const contexts: FunnelContext[] = relevantUsers.map((user) => ({
      user,
      chatCount: sessionCounts.get(user.id) ?? 0,
      activity: userActivity.get(user.id) ?? new Set<string>()
    }));

    const hasRecentActivity = (activity: Set<string>, days: number): boolean => {
      if (!activity.size) {
        return false;
      }

      const threshold = new Date(normalizedEnd.getTime() - days * DAY_MS);
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
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? ''
      },
      funnels
    };
  }

  static async getAcquisitionMapMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<AcquisitionMapSummary> {
    const normalizedStart = new Date(start.getTime());
    normalizedStart.setUTCHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end.getTime());
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
      throw new Error('Invalid date range for acquisition map metrics');
    }

    const windowDays = Math.floor((normalizedEnd.getTime() - normalizedStart.getTime()) / DAY_MS) + 1;
    const filtersNormalized = normalizeAnalyticsFilters(filters);

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

    for (const user of this.users.values()) {
      if (!recordMatchesFilters(user, filtersNormalized)) {
        continue;
      }

      const createdAt = new Date(user.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        continue;
      }

      createdAt.setUTCHours(0, 0, 0, 0);
      if (createdAt < normalizedStart || createdAt > normalizedEnd) {
        continue;
      }

      totalSignups += 1;

      const countryCode = (user.signupCountryCode || '').trim().toUpperCase();
      if (!countryCode) {
        unknownCount += 1;
        continue;
      }

      if (!countryBuckets.has(countryCode)) {
        countryBuckets.set(countryCode, {
          name: user.signupCountryName,
          count: 0,
          regions: new Map()
        });
      }

      const countryBucket = countryBuckets.get(countryCode)!;
      countryBucket.count += 1;

      const subdivisionCode = user.signupSubdivisionCode || (user.signupRegionCode ? `${countryCode}-${user.signupRegionCode}` : undefined);
      const regionKey = subdivisionCode || user.signupRegionCode;

      if (!regionKey) {
        continue;
      }

      if (!countryBucket.regions.has(regionKey)) {
        const regionName = user.signupRegionName
          || resolveSubdivisionName(subdivisionCode)
          || undefined;
        countryBucket.regions.set(regionKey, {
          regionCode: user.signupRegionCode,
          subdivisionCode,
          name: regionName,
          count: 0
        });
      }

      const regionBucket = countryBucket.regions.get(regionKey)!;
      regionBucket.count += 1;
    }

    const countries: AcquisitionMapCountry[] = Array.from(countryBuckets.entries())
      .map(([countryCode, bucket]) => {
        const countryShareDenominator = totalSignups > 0 ? totalSignups : 1;

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
          share: toPercentage(bucket.count, countryShareDenominator),
          regions
        };
      })
      .sort((a, b) => b.signups - a.signups);

    return {
      window: {
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? '',
        days: windowDays
      },
      totalSignups,
      unknown: unknownCount,
      countries
    };
  }

  static async getAcquisitionSourceMetrics(start: Date, end: Date, filters: AnalyticsFilterParams = {}): Promise<AcquisitionSourcesSummary> {
    const normalizedStart = new Date(start.getTime());
    normalizedStart.setUTCHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end.getTime());
    normalizedEnd.setUTCHours(0, 0, 0, 0);

    if (Number.isNaN(normalizedStart.getTime()) || Number.isNaN(normalizedEnd.getTime()) || normalizedStart > normalizedEnd) {
      throw new Error('Invalid date range for acquisition source metrics');
    }

    const windowDays = Math.floor((normalizedEnd.getTime() - normalizedStart.getTime()) / DAY_MS) + 1;
    const filtersNormalized = normalizeAnalyticsFilters(filters);

    const collectUsersWithinRange = (rangeStart: Date, rangeEnd: Date): User[] => {
      const results: User[] = [];
      for (const user of this.users.values()) {
        if (!recordMatchesFilters(user, filtersNormalized)) {
          continue;
        }
        const createdAt = new Date(user.createdAt);
        if (Number.isNaN(createdAt.getTime())) {
          continue;
        }
        createdAt.setUTCHours(0, 0, 0, 0);
        if (createdAt < rangeStart || createdAt > rangeEnd) {
          continue;
        }
        results.push(user);
      }
      return results;
    };

    const previousEnd = new Date(normalizedStart.getTime() - DAY_MS);
    previousEnd.setUTCHours(0, 0, 0, 0);
    const previousStart = new Date(previousEnd.getTime() - (windowDays - 1) * DAY_MS);
    previousStart.setUTCHours(0, 0, 0, 0);

    const currentUsers = collectUsersWithinRange(normalizedStart, normalizedEnd);
    const previousUsers = collectUsersWithinRange(previousStart, previousEnd);

    type SourceBucket = {
      key: string;
      source: string;
      medium?: string;
      campaign?: string;
      count: number;
    };

    const buildSourceBuckets = (users: User[]): { buckets: Map<string, SourceBucket>; unknown: number } => {
      const map = new Map<string, SourceBucket>();
      let unknown = 0;

      for (const user of users) {
        const sourceRaw = user.utmSource || user.signupSource || user.referrerDomain || 'unknown';
        const mediumRaw = user.utmMedium || undefined;
        const campaignRaw = user.utmCampaign || user.campaignId || undefined;

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

    const current = buildSourceBuckets(currentUsers);
    const previous = buildSourceBuckets(previousUsers);

    const totalSignups = currentUsers.length;
    const previousLookup = new Map<string, number>();
    previous.buckets.forEach((bucket) => {
      previousLookup.set(bucket.key, bucket.count);
    });

    const sortedBuckets = Array.from(current.buckets.values()).sort((a, b) => b.count - a.count);

    const sources: AcquisitionSourceEntry[] = sortedBuckets.slice(0, 50).map((bucket) => {
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
        start: toDateKey(normalizedStart) ?? '',
        end: toDateKey(normalizedEnd) ?? '',
        days: windowDays
      },
      totalSignups,
      uniqueSources: current.buckets.size,
      unknown: current.unknown,
      sources
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

    const sessions = Array.from(this.sessions.values());

    const shouldIncludeSession = (participantIds: Set<string>): boolean => {
      if (!filtersApplied) {
        return true;
      }

      for (const participantId of participantIds) {
        const participant = participantId ? this.users.get(participantId) : undefined;
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

      const startedAt = safeDateFrom(session.startedAt ?? session.createdAt ?? session.updatedAt);
      if (!startedAt) {
        continue;
      }

      if (startedAt < normalizedStart || startedAt >= windowEndExclusive) {
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

    const sessions = Array.from(this.sessions.values());

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

      for (const participantId of participantIds) {
        const participant = participantId ? this.users.get(participantId) : undefined;
        if (participant && recordMatchesFilters(participant, filtersNormalized)) {
          return true;
        }
      }
      return false;
    };

    for (const session of sessions) {
      const startedAt = safeDateFrom(session.startedAt ?? session.createdAt ?? session.updatedAt);
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

      const endedAt = safeDateFrom(session.endedAt ?? session.updatedAt ?? null);
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
      .map((userId) => this.users.get(userId))
      .filter((user): user is User => Boolean(user));

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
      const sessionCount = perUserSessions.get(user.id) ?? 0;
      registerCohort('platform', user.platform || 'Unknown', user.id, sessionCount);
      registerCohort('signup_source', user.signupSource || user.referrerDomain || 'Unknown', user.id, sessionCount);
      registerCohort('gender', user.gender || 'others', user.id, sessionCount);
      registerCohort('subscription', user.subscriptionLevel || 'normal', user.id, sessionCount);
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

  static async listGoalDefinitions(): Promise<GoalDefinition[]> {
    await this.ensureGoalsSeeded();
    return Array.from(this.goalDefinitions.values())
      .map((goal) => this.cloneGoalDefinition(goal))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async upsertGoalDefinition(input: GoalDefinitionInput): Promise<GoalDefinition> {
    await this.ensureGoalsSeeded();

    const now = new Date();
    const normalizedKey = this.normalizeGoalKey(input.key || input.name || input.id || this.generateId('goal-'));
    const existing = (input.id ? this.findGoalById(input.id) : undefined) ?? this.goalDefinitions.get(normalizedKey);

    const base: GoalDefinition = existing
      ? this.cloneGoalDefinition(existing)
      : {
          id: this.generateId('goal-'),
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
          createdAt: now,
          updatedAt: now
        };

    base.key = normalizedKey;
    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      base.name = trimmed || base.name || normalizedKey;
    } else if (!base.name) {
      base.name = normalizedKey;
    }
    if (input.description !== undefined) {
      base.description = input.description;
    }
    if (input.metric) {
      base.metric = input.metric;
    }
    if (input.targetValue !== undefined && Number.isFinite(Number(input.targetValue))) {
      base.targetValue = Number(input.targetValue);
    }
    if (input.unit !== undefined) {
      base.unit = input.unit;
    }
    if (input.tags !== undefined) {
      base.tags = this.ensureGoalTags(input.tags);
    }
    if (input.isActive !== undefined) {
      base.isActive = input.isActive;
    }
    if (input.ownerEmail !== undefined) {
      base.ownerEmail = input.ownerEmail;
    }
    if (input.color !== undefined) {
      base.color = input.color;
    }
    if (input.alertThresholdPercent !== undefined && Number.isFinite(Number(input.alertThresholdPercent))) {
      base.alertThresholdPercent = Number(input.alertThresholdPercent);
    }
    if (input.metadata) {
      base.metadata = { ...(base.metadata ?? {}), ...input.metadata };
    }
    base.updatedAt = now;

    const stored = this.storeGoalDefinition(base);
    if (stored.isActive) {
      this.scheduleGoalRecompute(stored.key, 300);
    }

    return this.cloneGoalDefinition(stored);
  }

  static async deleteGoalDefinition(goalKey: string): Promise<boolean> {
    await this.ensureGoalsSeeded();
    if (!goalKey) {
      return false;
    }

    const existing =
      this.goalDefinitions.get(goalKey) ||
      this.goalDefinitions.get(this.normalizeGoalKey(goalKey)) ||
      this.findGoalById(goalKey) ||
      null;

    if (!existing) {
      return false;
    }

    const updated: GoalDefinition = {
      ...existing,
      isActive: false,
      updatedAt: new Date()
    };

    this.storeGoalDefinition(updated);
    return true;
  }

  static async recordGoalSnapshot(snapshot: GoalSnapshotRecord): Promise<void> {
    await this.ensureGoalsSeeded();
    if (!snapshot?.goalKey) {
      return;
    }

    const existing =
      this.goalDefinitions.get(snapshot.goalKey) ||
      this.goalDefinitions.get(this.normalizeGoalKey(snapshot.goalKey)) ||
      null;

    if (!existing) {
      return;
    }

    this.storeGoalSnapshot({
      ...snapshot,
      goalKey: existing.key,
      timestamp: snapshot.timestamp instanceof Date ? snapshot.timestamp : new Date(snapshot.timestamp)
    });
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

    const goals = Array.from(this.goalDefinitions.values()).filter((goal) => {
      if (!includeInactive && !goal.isActive) {
        return false;
      }
      if (goalKeyFilter && goalKeyFilter.length > 0) {
        return goalKeyFilter.includes(goal.key);
      }
      return true;
    });

    const totals = {
      goals: 0,
      active: 0,
      completed: 0,
      atRisk: 0,
      offTrack: 0
    };

    const entries: GoalSummaryEntry[] = [];

    for (const goal of goals) {
      totals.goals += 1;
      if (goal.isActive) {
        totals.active += 1;
      }

      const snapshotsAll = this.goalSnapshots.get(goal.key) ?? [];
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
          date: toDateKey(snapshot.timestamp) ?? toIsoDate(snapshot.timestamp),
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
      : Array.from(this.goalDefinitions.values())
          .filter((goal) => goal.isActive)
          .map((goal) => goal.key);

    const uniqueKeys = Array.from(new Set(requestedKeys));

    const series: GoalTimeseriesSeries[] = [];

    for (const key of uniqueKeys) {
      const goal = this.goalDefinitions.get(key);
      if (!goal) {
        continue;
      }

      const snapshots = (this.goalSnapshots.get(goal.key) ?? []).filter(
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

    const events = this.anomalyEvents
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

    const baselines = Array.from(this.anomalyBaselines.values())
      .filter((baseline) => {
        const timestamp = new Date(baseline.updatedAt);
        return timestamp >= normalizedStart && timestamp < endExclusive;
      })
      .map((baseline) => ({
        ...baseline,
        metadata: baseline.metadata ? { ...baseline.metadata } : undefined
      }))
      .sort((a, b) => a.metric.localeCompare(b.metric));

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

    this.anomalyEvents.unshift(entry);
    if (this.anomalyEvents.length > 200) {
      this.anomalyEvents = this.anomalyEvents.slice(0, 200);
    }

    return {
      ...entry,
      metadata: entry.metadata ? { ...entry.metadata } : undefined
    };
  }

  static async getAnalyticsFilterOptions(): Promise<AnalyticsFilterOptionsSnapshot> {
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

  private static cloneAdmin(admin: Admin): Admin {
    return {
      ...admin,
      permissions: [...admin.permissions],
      createdAt: new Date(admin.createdAt),
      updatedAt: new Date(admin.updatedAt),
      ...(admin.lastLoginAt ? { lastLoginAt: new Date(admin.lastLoginAt) } : {})
    };
  }

  private static getDefaultPermissions(role: string): string[] {
    const map: Record<string, string[]> = {
      super_admin: ['all'],
      admin: ['view_users', 'ban_users', 'view_reports', 'resolve_reports', 'view_stats', 'view_analytics', 'manage_status'],
      moderator: ['view_users', 'view_reports', 'resolve_reports']
    };

    return map[role] || map.moderator;
  }

  private static deriveAdminUsername(user: User): string {
    if (user.email) {
      return user.email.toLowerCase();
    }

    if (user.username) {
      return user.username.toLowerCase();
    }

    return `admin-${user.id}`;
  }

  private static ensureAdminFromUser(user: User): Admin | null {
    if (!user.email || !user.passwordHash) {
      return null;
    }

    const username = this.deriveAdminUsername(user);
    const normalizedEmail = user.email.toLowerCase();
    const classification = this.deriveClassification(user);
    const adminRole: 'super_admin' | 'admin' = classification.role === 'super_admin' ? 'super_admin' : 'admin';

    const existingEntry = Array.from(this.admins.entries()).find(([, admin]) => admin.userId === user.id || admin.email === normalizedEmail);

    const base: Admin = existingEntry
      ? { ...existingEntry[1] }
      : {
          id: `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: user.id,
          username,
          email: normalizedEmail,
          passwordHash: user.passwordHash,
          role: adminRole,
          permissions: this.getDefaultPermissions(adminRole),
          isActive: true,
          isOwner: adminRole === 'super_admin',
          createdAt: new Date(),
          updatedAt: new Date()
        };

    base.userId = user.id;
    base.username = username;
    base.email = normalizedEmail;
    base.passwordHash = user.passwordHash;
    base.role = adminRole;
    base.permissions = this.getDefaultPermissions(adminRole);
    base.isActive = true;
    base.isOwner = existingEntry ? existingEntry[1].isOwner : base.isOwner;
    base.updatedAt = new Date();

    this.admins.set(base.id, base);
    return this.cloneAdmin(base);
  }

  private static deactivateAdminMock(user: User): void {
    for (const [id, admin] of this.admins.entries()) {
      if (admin.userId === user.id || (user.email && admin.email === user.email.toLowerCase())) {
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

  private static refreshAdminPasswordMock(user: User): void {
    for (const [id, admin] of this.admins.entries()) {
      if (admin.userId === user.id || (user.email && admin.email === user.email.toLowerCase())) {
        this.admins.set(id, {
          ...admin,
          passwordHash: user.passwordHash || admin.passwordHash,
          updatedAt: new Date()
        });
      }
    }
  }

  static async syncAdminAccessForRole(userId: string, role: 'guest' | 'user' | 'admin' | 'super_admin'): Promise<Admin | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    if (role === 'admin' || role === 'super_admin') {
      if (!user.passwordHash) {
        return null;
      }
      return this.ensureAdminFromUser(user);
    }

    this.deactivateAdminMock(user);
    return null;
  }

  static async createAdmin(adminData: any): Promise<any | null> {
    const normalizedEmail = adminData.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return null;
    }

    const existing = await this.findAdminByEmail(normalizedEmail);
    if (existing) {
      return null;
    }

    const usernameDisplay = adminData.username?.trim() || normalizedEmail;

    const admin: Admin = {
      id: adminData.id || `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: adminData.userId,
      username: usernameDisplay,
      email: normalizedEmail,
      passwordHash: adminData.passwordHash,
      role: adminData.role || 'admin',
  permissions: adminData.permissions || ['view_users', 'view_reports', 'view_stats', 'view_analytics', 'manage_status'],
      isActive: adminData.isActive !== false,
      isOwner: !!adminData.isOwner,
      lastLoginAt: adminData.lastLoginAt ? new Date(adminData.lastLoginAt) : undefined,
      createdAt: adminData.createdAt ? new Date(adminData.createdAt) : new Date(),
      updatedAt: new Date()
    };

    this.admins.set(admin.id, admin);
    return this.cloneAdmin(admin);
  }

  static async updateAdminPassword(
    adminId: string,
    passwordHash: string,
    options?: { removeLegacyPassword?: boolean }
  ): Promise<void> {
    if (!adminId) {
      return;
    }

    for (const [storedId, admin] of this.admins.entries()) {
      if (storedId === adminId || admin.id === adminId || admin.email === adminId) {
        const updated: Admin = {
          ...admin,
          passwordHash,
          updatedAt: new Date()
        };

        if (options?.removeLegacyPassword) {
          delete (updated as any).password;
        }

        this.admins.set(storedId, updated);
        return;
      }
    }
  }

  static async findAdminByUsername(username: string): Promise<any | null> {
    if (!username) {
      return null;
    }
    const search = username.trim().toLowerCase();
    for (const admin of this.admins.values()) {
      if (admin.username.toLowerCase() === search) {
        return this.cloneAdmin(admin);
      }
    }
    return null;
  }

  static async findAdminByEmail(email: string): Promise<any | null> {
    if (!email) {
      return null;
    }
    const search = email.trim().toLowerCase();
    for (const admin of this.admins.values()) {
      if (admin.email.toLowerCase() === search) {
        return this.cloneAdmin(admin);
      }
    }
    return null;
  }

  static async updateAdminLastLogin(adminId: string): Promise<void> {
    const admin = this.admins.get(adminId);
    if (!admin) {
      return;
    }
    admin.lastLoginAt = new Date();
    admin.updatedAt = new Date();
    this.admins.set(adminId, admin);
  }

  static async getAllAdmins(): Promise<any[]> {
    return Array.from(this.admins.values()).map((admin) => this.cloneAdmin(admin));
  }

  static async getAllUsers(): Promise<any[]> {
    return Array.from(this.users.values());
  }

  static async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const roleAdjustments: Partial<User> = (() => {
      if (newRole === 'super_admin') {
        return { role: 'super_admin', verificationStatus: 'verified', isVerified: true };
      }
      if (newRole === 'admin') {
        return { role: 'admin', verificationStatus: 'verified', isVerified: true };
      }
      if (newRole === 'user') {
        return { role: 'user', verificationStatus: 'verified', isVerified: true };
      }
      if (newRole === 'guest') {
        return { role: 'user', verificationStatus: 'guest', isVerified: false };
      }
      return { role: 'user' };
    })();

    const tierOverride = newRole === 'super_admin'
      ? 'super_admin'
      : newRole === 'admin'
        ? 'admin'
        : newRole === 'guest'
          ? 'guest'
          : undefined;

    const classification = this.deriveClassification({
      ...user,
      ...roleAdjustments,
      ...(tierOverride ? { tier: tierOverride } : {})
    });

    const updated: User = {
      ...user,
      ...roleAdjustments,
      verificationStatus: classification.verificationStatus,
      subscriptionLevel: classification.subscriptionLevel,
      role: classification.role,
      tier: classification.tier,
      isVerified: typeof roleAdjustments.isVerified === 'boolean'
        ? roleAdjustments.isVerified
        : classification.verificationStatus === 'verified',
      updatedAt: new Date()
    };

    this.users.set(userId, updated);
    await this.syncAdminAccessForRole(userId, newRole as 'guest' | 'user' | 'admin' | 'super_admin');
    return true;
  }

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
      reason: metadata.reason,
      deletedBy: metadata.deletedBy,
      context: metadata.context ?? 'admin',
      adminId: metadata.adminId,
      adminUsername: metadata.adminUsername
    });
    return !!result.success;
  }

  static async searchUsers(query: string): Promise<any[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter((user: any) => 
      user.username?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery)
    );
  }

  static async incrementUserReportCount(userId: string): Promise<number> {
    const user = this.users.get(userId);
    if (user) {
      const newCount = (user.reportCount || 0) + 1;
      user.reportCount = newCount;
      user.updatedAt = new Date();
      this.users.set(userId, user);
      
      // Auto-ban logic
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

  static async saveReportedChatTranscript(data: {
    sessionId: string;
    reporterUserId: string;
    reporterEmail?: string | null;
    reportedUserId: string;
    reportedEmail?: string | null;
    mode?: string;
    messages: Array<{ senderId: string; content: string; type?: string; timestamp: number | Date; replyTo?: any }>;
  }): Promise<any> {
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

    const key = `${payload.sessionId}:${payload.createdAt.getTime()}`;
    this.reportedChatTranscripts.set(key, payload);
    console.log('🗄️ Reported chat transcript stored (dev)', {
      sessionId: payload.sessionId,
      messages: normalizedMessages.length
    });
    return payload;
  }
}
