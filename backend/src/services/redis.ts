import Redis from 'ioredis';

type GenderValue = 'male' | 'female' | 'others';

type MatchPreferences = {
  language?: string;
  interests?: string[];
  ageRange?: [number, number];
  genderPreference?: 'any' | 'male' | 'female';
  [key: string]: any;
};

interface MatchRequest {
  userId: string;
  mode: string;
  preferences: MatchPreferences;
  userGender?: GenderValue;
  timestamp: number;
}

export class RedisService {
  private static redis: Redis;

  static async initialize() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    await this.redis.connect();
  }

  static async close() {
    await this.redis.quit();
  }

  // Matching queue operations
  static async addToMatchQueue(request: MatchRequest) {
    const key = `match_queue:${request.mode}`;
    await this.redis.zadd(key, request.timestamp, JSON.stringify(request));
  }

  static async removeFromMatchQueue(userId: string, mode: string) {
    const key = `match_queue:${mode}`;
    const members = await this.redis.zrange(key, 0, -1);
    
    for (const member of members) {
      const request = JSON.parse(member);
      if (request.userId === userId) {
        await this.redis.zrem(key, member);
        break;
      }
    }
  }

  static async findMatch(request: MatchRequest): Promise<MatchRequest | null> {
    const key = `match_queue:${request.mode}`;
    const members = await this.redis.zrange(key, 0, -1);
    
    for (const member of members) {
      const otherRequest = JSON.parse(member);
      
      // Don't match with self
      if (otherRequest.userId === request.userId) continue;
      
      // Check compatibility (simple version)
  const compatibility = this.calculateCompatibility(request, otherRequest);
      if (compatibility > 0.5) {
        // Remove the matched user from queue
        await this.redis.zrem(key, member);
        return otherRequest;
      }
    }
    
    return null;
  }

  private static calculateCompatibility(req1: MatchRequest, req2: MatchRequest): number {
    if (!this.isGenderCompatible(req1, req2)) {
      return 0;
    }

    let score = 0.5; // Base compatibility
    
    // Language preference
    if (req1.preferences?.language && req2.preferences?.language) {
      if (req1.preferences.language === req2.preferences.language) {
        score += 0.3;
      }
    }
    
    // Interest overlap
    if (req1.preferences?.interests && req2.preferences?.interests) {
      const interests1 = req1.preferences.interests;
      const interests2 = req2.preferences.interests;
      const common = interests1.filter((i: string) => interests2.includes(i));
      score += (common.length / Math.max(interests1.length, interests2.length)) * 0.2;
    }
    
    return Math.min(score, 1);
  }

  private static isGenderCompatible(req1: MatchRequest, req2: MatchRequest): boolean {
    const req1Preference = req1.preferences?.genderPreference || 'any';
    const req2Preference = req2.preferences?.genderPreference || 'any';
    const req1Gender = req1.userGender;
    const req2Gender = req2.userGender;

    const req1AcceptsReq2 = req1Preference === 'any' || (req2Gender !== undefined && req2Gender === req1Preference);
    const req2AcceptsReq1 = req2Preference === 'any' || (req1Gender !== undefined && req1Gender === req2Preference);

    return req1AcceptsReq2 && req2AcceptsReq1;
  }

  // Rate limiting
  static async checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    }
    
    return current <= limit;
  }

  // Session management
  static async setUserSession(userId: string, sessionData: any) {
    await this.redis.setex(`session:${userId}`, 3600, JSON.stringify(sessionData));
  }

  static async getUserSession(userId: string): Promise<any | null> {
    const data = await this.redis.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  static async deleteUserSession(userId: string) {
    await this.redis.del(`session:${userId}`);
  }

  // User presence
  static async setUserOnline(userId: string) {
    await this.redis.setex(`presence:${userId}`, 30, '1'); // 30 second TTL
  }

  static async isUserOnline(userId: string): Promise<boolean> {
    const exists = await this.redis.exists(`presence:${userId}`);
    return exists === 1;
  }

  // Moderation evidence storage
  static async storeEvidence(sessionId: string, evidenceData: any) {
    const key = `evidence:${sessionId}`;
    await this.redis.setex(key, 7776000, JSON.stringify(evidenceData)); // 90 days
  }

  static async getEvidence(sessionId: string): Promise<any | null> {
    const data = await this.redis.get(`evidence:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  // Ban tracking
  static async setBanStatus(userId: string, banData: any) {
    await this.redis.set(`ban:${userId}`, JSON.stringify(banData));
  }

  static async getBanStatus(userId: string): Promise<any | null> {
    const data = await this.redis.get(`ban:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  // Analytics caching
  static async cacheAnalytics(key: string, data: any, ttl: number = 3600) {
    await this.redis.setex(`analytics:${key}`, ttl, JSON.stringify(data));
  }

  static async getCachedAnalytics(key: string): Promise<any | null> {
    const data = await this.redis.get(`analytics:${key}`);
    return data ? JSON.parse(data) : null;
  }

  // Generic cache operations
  static async set(key: string, value: any, ttl?: number) {
    if (ttl) {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } else {
      await this.redis.set(key, JSON.stringify(value));
    }
  }

  static async get(key: string): Promise<any | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async del(key: string) {
    await this.redis.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}