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
  totalChats?: number;
  dailyChats?: number;
  lastCoinClaim?: Date;
  reportCount?: number;
  isOnline?: boolean;
  isVerified: boolean;
  gender?: 'male' | 'female' | 'others';
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
  mode: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Admin {
  id: string;
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

  static async initialize() {
    console.log('✅ Development database initialized (in-memory)');
    
    // Create a test user for development
    const testUser: User = {
      id: 'test-user-1',
      deviceId: 'dev-device-1',
      tier: 'guest',
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
        'view_analytics',
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
    const user: User = {
      id: userData.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: userData.deviceId!,
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
      phoneHash: userData.phoneHash,
      tier: userData.tier || 'guest',
      status: userData.status || 'active',
      coins: userData.coins ?? 50,
      totalChats: userData.totalChats ?? 0,
      dailyChats: userData.dailyChats ?? 0,
      lastCoinClaim: userData.lastCoinClaim ?? new Date(),
      isVerified: userData.isVerified || false,
      gender: userData.gender || 'others',
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

    const updatedUser = { ...user, ...updates, updatedAt: new Date() } as User;
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

  private static cloneAdmin(admin: Admin): Admin {
    return {
      ...admin,
      permissions: [...admin.permissions],
      createdAt: new Date(admin.createdAt),
      updatedAt: new Date(admin.updatedAt),
      ...(admin.lastLoginAt ? { lastLoginAt: new Date(admin.lastLoginAt) } : {})
    };
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
      username: usernameDisplay,
      email: normalizedEmail,
      passwordHash: adminData.passwordHash,
      role: adminData.role || 'admin',
      permissions: adminData.permissions || ['view_users', 'view_reports'],
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
    if (user) {
      user.tier = newRole;
      user.updatedAt = new Date();
      this.users.set(userId, user);
      return true;
    }
    return false;
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
