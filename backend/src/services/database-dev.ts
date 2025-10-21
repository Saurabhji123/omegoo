// Simple in-memory database service for development
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  deviceId: string;
  email?: string;
  username?: string;
  passwordHash?: string;
  phoneHash?: string;
  tier: string;
  status: string;
  coins: number;
  reportCount?: number;
  isOnline?: boolean;
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

  static async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  static async createUser(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: userData.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: userData.deviceId!,
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
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

  static async createAdmin(adminData: any): Promise<any | null> {
    console.log('👤 Admin created (dev):', adminData.username);
    return {
      id: `admin-${Date.now()}`,
      ...adminData,
      createdAt: new Date()
    };
  }

  static async findAdminByUsername(username: string): Promise<any | null> {
    // Mock: return null in dev (admins require MongoDB)
    console.log('🔍 Admin lookup (dev):', username);
    return null;
  }

  static async findAdminByEmail(email: string): Promise<any | null> {
    return null;
  }

  static async updateAdminLastLogin(adminId: string): Promise<void> {
    console.log('📝 Admin login tracked (dev):', adminId);
  }

  static async getAllAdmins(): Promise<any[]> {
    return [];
  }

  static async getAllUsers(): Promise<any[]> {
    return Array.from(this.users.values());
  }

  static async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (user) {
      user.tier = newRole;
      user.updatedAt = new Date();
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  static async deleteUser(userId: string): Promise<boolean> {
    return this.users.delete(userId);
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
}
