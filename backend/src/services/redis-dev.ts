// Simple in-memory Redis service for development

interface MatchRequest {
  userId: string;
  mode: string;
  preferences: any;
  timestamp: number;
}

export class RedisService {
  private static storage: Map<string, any> = new Map();
  private static queues: Map<string, MatchRequest[]> = new Map();

  static async initialize() {
    console.log('✅ Development Redis initialized (in-memory)');
  }

  static async close() {
    console.log('📦 Development Redis closed');
  }

  // Basic key-value operations
  static async set(key: string, value: any, ttl?: number) {
    this.storage.set(key, JSON.stringify(value));
    
    if (ttl) {
      setTimeout(() => {
        this.storage.delete(key);
      }, ttl * 1000);
    }
  }

  static async get(key: string): Promise<any | null> {
    const value = this.storage.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async del(key: string) {
    this.storage.delete(key);
  }

  static async exists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  // Matching queue operations
  static async addToMatchQueue(request: MatchRequest) {
    const key = `match_queue:${request.mode}`;
    if (!this.queues.has(key)) {
      this.queues.set(key, []);
    }
    this.queues.get(key)!.push(request);
    console.log(`🔍 Added user ${request.userId} to ${request.mode} queue`);
  }

  static async removeFromMatchQueue(userId: string, mode: string) {
    const key = `match_queue:${mode}`;
    const queue = this.queues.get(key);
    if (queue) {
      const index = queue.findIndex(req => req.userId === userId);
      if (index !== -1) {
        queue.splice(index, 1);
        console.log(`🚪 Removed user ${userId} from ${mode} queue`);
      }
    }
  }

  static async findMatch(request: MatchRequest): Promise<MatchRequest | null> {
    const key = `match_queue:${request.mode}`;
    const queue = this.queues.get(key) || [];
    
    console.log(`🔍 Looking for match: user ${request.userId}, mode: ${request.mode}, queue size: ${queue.length}`);
    
    // Find a suitable match (exclude self only)
    const now = Date.now();
    const eligibleQueue = queue.filter(req => 
      req.userId !== request.userId && 
      req.mode === request.mode &&
      (now - req.timestamp) < 120000 // Match with users waiting less than 2 minutes (more generous)
    );

    console.log(`👥 Eligible matches found: ${eligibleQueue.length}`);

    if (eligibleQueue.length > 0) {
      // Get the user who has been waiting the longest
      const match = eligibleQueue.reduce((oldest, current) => 
        current.timestamp < oldest.timestamp ? current : oldest
      );

      // Remove the matched user from queue
      await this.removeFromMatchQueue(match.userId, match.mode);
      console.log(`💫 MATCH SUCCESSFUL: ${request.userId} <-> ${match.userId} (waited ${(now - match.timestamp)/1000}s)`);
      return match;
    }

    // Clean up very old requests (older than 5 minutes)
    const activeQueue = queue.filter(req => (now - req.timestamp) < 300000);
    this.queues.set(key, activeQueue);
    
    if (activeQueue.length !== queue.length) {
      console.log(`🧹 Cleaned up ${queue.length - activeQueue.length} expired requests from ${request.mode} queue`);
    }

    console.log(`⏳ No match found for user ${request.userId}, adding to queue (${activeQueue.length + 1} total waiting)`);
    
    // Don't add immediately, let the calling function handle it
    return null;
  }

  // Session management
  static async setUserSession(userId: string, sessionData: any) {
    await this.set(`session:${userId}`, sessionData, 3600);
    
    // Also track active sessions globally
    const activeSessions = this.storage.get('active_sessions') || new Set();
    activeSessions.add(userId);
    this.storage.set('active_sessions', activeSessions);
  }

  static async getUserSession(userId: string): Promise<any | null> {
    return await this.get(`session:${userId}`);
  }

  static async deleteUserSession(userId: string) {
    await this.del(`session:${userId}`);
    
    // Remove from active sessions
    const activeSessions = this.storage.get('active_sessions') || new Set();
    activeSessions.delete(userId);
    this.storage.set('active_sessions', activeSessions);
  }

  // User online status
  static setUserOnline(userId: string) {
    const onlineUsers = this.storage.get('online_users') || new Set();
    onlineUsers.add(userId);
    this.storage.set('online_users', onlineUsers);
    console.log(`👤 User ${userId} is now online. Total online: ${onlineUsers.size}`);
  }

  static setUserOffline(userId: string) {
    const onlineUsers = this.storage.get('online_users') || new Set();
    onlineUsers.delete(userId);
    this.storage.set('online_users', onlineUsers);
    console.log(`👤 User ${userId} is now offline. Total online: ${onlineUsers.size}`);
  }

  static isUserOnline(userId: string): boolean {
    const onlineUsers = this.storage.get('online_users') || new Set();
    return onlineUsers.has(userId);
  }

  static getOnlineUserCount(): number {
    const onlineUsers = this.storage.get('online_users') || new Set();
    return onlineUsers.size;
  }

  // Rate limiting
  static async checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const count = this.storage.get(key) || 0;
    if (count >= limit) {
      return false;
    }
    
    this.storage.set(key, count + 1);
    setTimeout(() => {
      this.storage.delete(key);
    }, windowMs);
    
    return true;
  }

  // Removed duplicate methods - using the ones defined above

  // Evidence storage
  static async storeEvidence(sessionId: string, evidenceData: any) {
    await this.set(`evidence:${sessionId}`, evidenceData, 7776000); // 90 days
  }

  static async getEvidence(sessionId: string): Promise<any | null> {
    return await this.get(`evidence:${sessionId}`);
  }

  // Analytics caching
  static async cacheAnalytics(key: string, data: any, ttl: number = 3600) {
    await this.set(`analytics:${key}`, data, ttl);
  }

  static async getCachedAnalytics(key: string): Promise<any | null> {
    return await this.get(`analytics:${key}`);
  }

  // Queue management
  static getQueueStats() {
    const stats: Record<string, number> = {};
    for (const [key, queue] of this.queues.entries()) {
      const mode = key.replace('match_queue:', '');
      stats[mode] = queue.length;
    }
    return {
      queues: stats,
      totalWaiting: Object.values(stats).reduce((sum, count) => sum + count, 0)
    };
  }

  static async clearExpiredRequests() {
    const now = Date.now();
    const maxAge = 60000; // 60 seconds
    
    for (const [key, queue] of this.queues.entries()) {
      const activeQueue = queue.filter(req => (now - req.timestamp) < maxAge);
      if (activeQueue.length !== queue.length) {
        this.queues.set(key, activeQueue);
        console.log(`🧹 Cleared ${queue.length - activeQueue.length} expired requests from ${key}`);
      }
    }
  }
}