// Service interfaces for Omegoo backend

export interface User {
  id: string;
  deviceId: string;
  phoneHash?: string;
  verificationStatus: 'guest' | 'verified';
  subscriptionLevel: 'normal' | 'premium';
  role: 'user' | 'admin' | 'super_admin';
  /** @deprecated legacy combined tier */
  tier?: 'guest' | 'verified' | 'premium' | 'admin' | 'super_admin';
  status: 'active' | 'banned' | 'suspended';
  coins: number;
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
  preferences: {
    language: string;
    interests: string[];
    ageRange?: [number, number];
    genderPreference: 'any' | 'male' | 'female';
  };
  subscription: {
    type: 'none' | 'starter' | 'standard' | 'premium';
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'system';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  type: 'video' | 'text';
  status: 'waiting' | 'active' | 'ended';
  settings: {
    allowText: boolean;
    allowVideo: boolean;
    allowAudio: boolean;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  endReason?: 'user_left' | 'reported' | 'timeout' | 'technical';
}

export interface DatabaseService {
  // Connection management
  initialize?(): Promise<void>;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  close?(): Promise<void>;

  // User operations
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastActiveAt'>): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByDeviceId(deviceId: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;

  // Chat room operations
  createChatRoom(roomData: Omit<ChatRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatRoom>;
  getChatRoomById(id: string): Promise<ChatRoom | null>;
  updateChatRoom(id: string, updates: Partial<ChatRoom>): Promise<ChatRoom | null>;
  findAvailableRoom(userId: string): Promise<ChatRoom | null>;
  getUserRooms(userId: string): Promise<ChatRoom[]>;

  // Message operations
  createMessage(messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message>;
  getRoomMessages(roomId: string, limit?: number): Promise<Message[]>;

  // Online user management
  setUserOnline(userId: string, socketId: string): Promise<void>;
  setUserOffline(userId: string): Promise<void>;
  getOnlineUsers(): Promise<User[]>;

  // Analytics helpers
  getUserGrowthMetrics?(start: Date, end: Date, filters?: AnalyticsFilterParams): Promise<UserGrowthSummary>;
  getUserRetentionMetrics?(start: Date, end: Date, filters?: AnalyticsFilterParams): Promise<UserRetentionSummary>;
  getFunnelMetrics?(start: Date, end: Date, filters?: AnalyticsFilterParams): Promise<FunnelSummary>;
  getAcquisitionMapMetrics?(start: Date, end: Date, filters?: AnalyticsFilterParams): Promise<AcquisitionMapSummary>;
  getAcquisitionSourceMetrics?(start: Date, end: Date, filters?: AnalyticsFilterParams): Promise<AcquisitionSourcesSummary>;
  getAnalyticsFilterOptions?(): Promise<AnalyticsFilterOptionsSnapshot>;
  getEngagementHeatmap?(start: Date, end: Date, options?: EngagementHeatmapOptions): Promise<EngagementHeatmapSnapshot>;
  getEngagementSummary?(start: Date, end: Date, options?: EngagementSummaryOptions): Promise<EngagementSummarySnapshot>;
  listGoalDefinitions?(): Promise<GoalDefinition[]>;
  upsertGoalDefinition?(input: GoalDefinitionInput): Promise<GoalDefinition>;
  deleteGoalDefinition?(goalKey: string): Promise<boolean>;
  recordGoalSnapshot?(snapshot: GoalSnapshotRecord): Promise<void>;
  getGoalSummary?(start: Date, end: Date, options?: GoalSummaryOptions): Promise<GoalSummarySnapshot>;
  getGoalTimeseries?(start: Date, end: Date, options: GoalTimeseriesOptions): Promise<GoalTimeseriesResponse>;
  getAnomalyFeed?(start: Date, end: Date): Promise<AnomalyFeedResponse>;
  getBenchmarkSummary?(start: Date, end: Date): Promise<BenchmarkSummary>;
  upsertBenchmark?(input: AnomalyBaselineUpsertInput): Promise<AnomalyBaselineEntry>;
  recordAnomalyEvent?(input: AnomalyEventInput): Promise<AnomalyEventEntry>;
}

export interface RedisService {
  // Connection management
  initialize?(): Promise<void>;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  close?(): Promise<void>;

  // Basic operations
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;

  // Session management
  setSession(sessionId: string, data: any, ttl?: number): Promise<void>;
  getSession(sessionId: string): Promise<any>;
  deleteSession(sessionId: string): Promise<void>;

  // Rate limiting
  incrementCounter(key: string, ttl?: number): Promise<number>;
  
  // Queue operations (for matching users)
  addToQueue(queueName: string, data: any): Promise<void>;
  getFromQueue(queueName: string): Promise<any>;
  removeFromQueue(queueName: string, data: any): Promise<void>;

  // Admin session helpers
  storeAdminSession?(sessionId: string, data: any, ttlSeconds: number): Promise<void>;
  getAdminSession?(sessionId: string): Promise<any | null>;
  deleteAdminSession?(sessionId: string): Promise<void>;
  refreshAdminSession?(sessionId: string, ttlSeconds: number): Promise<any | null>;
}

export interface UserGrowthDay {
  date: string;
  newUsers: number;
  returningUsers: number;
  totalUsers: number;
}

export interface UserGrowthSummary {
  window: {
    start: string;
    end: string;
    days: number;
  };
  totals: {
    newUsers: number;
    returningUsers: number;
    totalUsers: number;
  };
  daily: UserGrowthDay[];
}

export interface AnalyticsFilterParams {
  genders?: string[];
  platforms?: string[];
  signupSources?: string[];
  campaigns?: string[];
}

export interface RetentionBucketSummary {
  offset: number;
  date: string;
  retainedUsers: number;
  retentionRate: number;
}

export interface RetentionCohortSummary {
  cohort: string;
  size: number;
  buckets: RetentionBucketSummary[];
}

export interface RetentionAverageSummary {
  offset: number;
  retentionRate: number;
  sampleSize: number;
}

export interface UserRetentionSummary {
  window: {
    start: string;
    end: string;
    cohorts: number;
  };
  maxOffset: number;
  averages: RetentionAverageSummary[];
  cohorts: RetentionCohortSummary[];
}

export interface FunnelStepSummary {
  id: string;
  label: string;
  count: number;
  conversionRate: number;
  stepRate: number;
}

export interface FunnelDefinitionSummary {
  id: string;
  name: string;
  description?: string;
  totalUsers: number;
  steps: FunnelStepSummary[];
}

export interface FunnelSummary {
  window: {
    start: string;
    end: string;
  };
  funnels: FunnelDefinitionSummary[];
}

export interface AcquisitionRegionBreakdown {
  regionCode?: string;
  subdivisionCode?: string;
  name: string;
  signups: number;
  share: number;
}

export interface AcquisitionMapCountry {
  countryCode: string;
  name: string;
  signups: number;
  share: number;
  regions: AcquisitionRegionBreakdown[];
}

export interface AcquisitionMapSummary {
  window: {
    start: string;
    end: string;
    days: number;
  };
  totalSignups: number;
  unknown: number;
  countries: AcquisitionMapCountry[];
}

export interface AcquisitionSourceEntry {
  source: string;
  medium?: string;
  campaign?: string;
  signups: number;
  share: number;
  previousSignups?: number;
  trendDelta?: number;
}

export interface AcquisitionSourcesSummary {
  window: {
    start: string;
    end: string;
    days: number;
  };
  totalSignups: number;
  uniqueSources: number;
  unknown: number;
  sources: AcquisitionSourceEntry[];
}

export interface AnalyticsFilterOptionsSnapshot {
  genders: string[];
  platforms: string[];
  signupSources: string[];
  campaigns: string[];
}

export type ChatMode = 'text' | 'audio' | 'video';

export interface EngagementHeatmapCell {
  hour: number;
  totalSessions: number;
  modeBreakdown: Record<ChatMode, number>;
  uniqueUsers: number;
}

export interface EngagementHeatmapRow {
  day: number;
  label: string;
  hours: EngagementHeatmapCell[];
}

export interface EngagementHeatmapSnapshot {
  window: {
    start: string;
    end: string;
    days: number;
  };
  totals: {
    sessions: number;
    uniqueUsers: number;
    peak?: {
      day: number;
      hour: number;
      totalSessions: number;
    };
  };
  modes: ChatMode[];
  rows: EngagementHeatmapRow[];
}

export interface DurationDistributionBin {
  label: string;
  minSeconds: number;
  maxSeconds: number | null;
  count: number;
  share: number;
}

export interface EngagementDurationMetrics {
  medianSeconds: number;
  averageSeconds: number;
  p90Seconds: number;
  completedSessions: number;
  distribution: DurationDistributionBin[];
  sparkline: Array<{ label: string; value: number }>;
}

export interface EngagementDepthMetrics {
  medianSessionsPerUser: number;
  averageSessionsPerUser: number;
  heavyUserThreshold: number;
  heavyUserCount: number;
  heavyUserShare: number;
  perModeSessions: Record<ChatMode, number>;
}

export interface EngagementCohortEntry {
  key: string;
  label: string;
  type: 'platform' | 'signup_source' | 'gender' | 'subscription';
  sessions: number;
  uniqueUsers: number;
  share: number;
}

export interface EngagementSummarySnapshot {
  window: {
    start: string;
    end: string;
    days: number;
  };
  totals: {
    sessions: number;
    completedSessions: number;
    activeSessions: number;
    uniqueUsers: number;
    repeatUsers: number;
    repeatRate: number;
    churnRate: number;
  };
  durations: EngagementDurationMetrics;
  depth: EngagementDepthMetrics;
  cohorts: EngagementCohortEntry[];
}

export interface EngagementHeatmapOptions {
  modes?: ChatMode[];
  filters?: AnalyticsFilterParams;
}

export interface EngagementSummaryOptions {
  filters?: AnalyticsFilterParams;
}

export type GoalMetricKey = 'coins' | 'profile_completion' | 'matches' | string;

export interface GoalDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  metric: GoalMetricKey;
  targetValue: number;
  unit?: string;
  tags: string[];
  isActive: boolean;
  ownerEmail?: string;
  color?: string;
  alertThresholdPercent?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalDefinitionInput {
  id?: string;
  key: string;
  name: string;
  description?: string;
  metric: GoalMetricKey;
  targetValue: number;
  unit?: string;
  tags?: string[];
  isActive?: boolean;
  ownerEmail?: string;
  color?: string;
  alertThresholdPercent?: number;
  metadata?: Record<string, any>;
}

export interface GoalSnapshotRecord {
  goalKey: string;
  timestamp: Date;
  value: number;
  targetValue: number;
  delta?: number;
  metadata?: Record<string, any>;
}

export interface GoalProgressSnapshot {
  goalKey: string;
  timestamp: string;
  value: number;
  targetValue: number;
  delta: number;
  metadata?: Record<string, any>;
}

export interface GoalSummaryEntry {
  goal: GoalDefinition;
  latestValue: number;
  targetValue: number;
  progressPercent: number;
  status: 'on_track' | 'at_risk' | 'off_track' | 'completed';
  lastUpdated: string;
  trend7d?: number;
  trend30d?: number;
  sparkline: Array<{ date: string; value: number }>;
}

export interface GoalSummarySnapshot {
  window: {
    start: string;
    end: string;
    days: number;
  };
  totals: {
    goals: number;
    active: number;
    completed: number;
    atRisk: number;
    offTrack: number;
  };
  goals: GoalSummaryEntry[];
}

export type GoalTimeseriesInterval = 'day' | 'week' | 'month';

export interface GoalTimeseriesOptions {
  goalKeys: string[];
  interval?: GoalTimeseriesInterval;
}

export interface GoalSummaryOptions {
  goalKeys?: string[];
  includeInactive?: boolean;
  filters?: AnalyticsFilterParams;
}

export interface GoalTimeseriesPoint {
  date: string;
  value: number;
  targetValue?: number;
  metadata?: Record<string, any>;
}

export interface GoalTimeseriesSeries {
  key: string;
  name: string;
  unit?: string;
  points: GoalTimeseriesPoint[];
}

export interface GoalTimeseriesResponse {
  window: {
    start: string;
    end: string;
    interval: GoalTimeseriesInterval;
  };
  series: GoalTimeseriesSeries[];
}

export interface AnomalyBaselineEntry {
  metric: string;
  period: GoalTimeseriesInterval | 'hour';
  mean: number;
  standardDeviation: number;
  sampleSize: number;
  trend?: number;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface AnomalyBaselineUpsertInput {
  metric: string;
  period: GoalTimeseriesInterval | 'hour';
  mean: number;
  standardDeviation: number;
  sampleSize: number;
  trend?: number;
  updatedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AnomalyEventEntry {
  id: string;
  metric: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  direction: 'positive' | 'negative';
  actual: number;
  expected: number;
  zScore: number;
  baselineMean: number;
  baselineStdDev: number;
  metadata?: Record<string, any>;
}

export interface AnomalyEventInput {
  metric: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  direction: 'positive' | 'negative';
  actual: number;
  expected: number;
  zScore: number;
  baselineMean: number;
  baselineStdDev: number;
  metadata?: Record<string, any>;
}

export interface AnomalyFeedResponse {
  window: {
    start: string;
    end: string;
  };
  events: AnomalyEventEntry[];
  latestUpdatedAt?: string;
}

export interface BenchmarkSummary {
  window: {
    start: string;
    end: string;
  };
  baselines: AnomalyBaselineEntry[];
}