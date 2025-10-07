// Simple in-memory database service for development
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  deviceId: string;
  phoneHash?: string;
  tier: string;
  status: string;
  coins: number;
  isVerified: boolean;
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
  mode: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseService {
  private static users: Map<string, User> = new Map();
  private static sessions: Map<string, ChatSession> = new Map();
  private static bans: Map<string, any> = new Map();

  static async initialize() {
    console.log('✅ Development database initialized (in-memory)');
    
    // Create a test user for development
    const testUser: User = {
      id: 'test-user-1',
      deviceId: 'dev-device-1',
      tier: 'guest',
      status: 'active',
      coins: 100,
      isVerified: false,
      preferences: { language: 'en', interests: [] },
      subscription: { type: 'none' },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };
    
    this.users.set(testUser.id, testUser);
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

  static async createUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: userData.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: userData.deviceId!,
      phoneHash: userData.phoneHash,
      tier: userData.tier || 'guest',
      status: userData.status || 'active',
      coins: userData.coins || 100,
      isVerified: userData.isVerified || false,
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

    const updatedUser = { ...user, ...updates, updated_at: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
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
      mode: sessionData.mode,
      status: 'active',
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
    if (user) {
      user.phoneHash = phoneHash;
      user.isVerified = true;
      user.tier = 'verified';
      user.updatedAt = new Date();
      return user;
    }
    return null;
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
      session.updatedAt = new Date();
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
}