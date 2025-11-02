// database.service.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
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
  tier: 'guest' | 'verified' | 'premium';
  status: 'active' | 'banned' | 'suspended';
  coins?: number;
  totalChats?: number;
  dailyChats?: number;
  lastCoinClaim?: Date;
  reportCount?: number;
  preferences?: any;
  subscription?: any;
  isOnline?: boolean;
  socketId?: string | null;
  activeDeviceToken?: string; // 🔒 Single-device session enforcement
  lastLoginDevice?: string; // 🔒 Last login device info
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

interface IAdminDoc extends Document {
  id: string;
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
  tier: { type: String, enum: ['guest', 'verified', 'premium'], default: 'guest' },
  status: { type: String, enum: ['active', 'banned', 'suspended'], default: 'active', index: true }, // 🔍 Index for status filtering
  coins: { type: Number, default: 0 },
  totalChats: { type: Number, default: 0 },
  dailyChats: { type: Number, default: 0 },
  lastCoinClaim: { type: Date },
  reportCount: { type: Number, default: 0 },
  preferences: { type: Schema.Types.Mixed, default: {} },
  subscription: { type: Schema.Types.Mixed, default: {} },
  isOnline: { type: Boolean, default: false, index: true }, // 🔍 Index for active users query
  socketId: { type: String, default: null },
  activeDeviceToken: { type: String, default: null, index: true }, // 🔒🔍 Single-device session token + index for fast validation
  lastLoginDevice: { type: String, default: null }, // 🔒 Last login device info
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
  userId: { type: String, required: true, index: true },
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
  userId: { type: String, required: true, index: true },
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
    } catch (error) {
      console.error('❌ MongoDB connection failed, falling back to in-memory:', error);
      this.isConnected = false;
      this.initializeInMemory();
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
      preferences: { language: 'en', interests: [], genderPreference: 'any' },
      subscription: { type: 'none' },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date()
    };
    this.users.set(testUser.id, testUser);
  }

  /* ---------- Utility ---------- */
  private static generateId(prefix = ''): string {
    return prefix + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }

  private static mongoUserToUser(mongoUser: any) {
    if (!mongoUser) return null;
    return {
      id: mongoUser.id || mongoUser._id?.toString(),
      deviceId: mongoUser.deviceId,
      email: mongoUser.email,
      username: mongoUser.username,
      passwordHash: mongoUser.passwordHash,
      phoneHash: mongoUser.phoneHash,
      phoneNumber: mongoUser.phoneNumber,
      tier: mongoUser.tier,
      status: mongoUser.status,
      coins: mongoUser.coins,
      totalChats: mongoUser.totalChats || 0,
      dailyChats: mongoUser.dailyChats || 0,
  lastCoinClaim: mongoUser.lastCoinClaim,
      isVerified: mongoUser.isVerified,
  // Session & verification related fields (kept optional in returned shape)
  activeDeviceToken: (mongoUser as any).activeDeviceToken || null,
  lastLoginDevice: (mongoUser as any).lastLoginDevice || null,
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

    const updates = {
      coins: 50,
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
          isVerified: userData.isVerified ?? false,
          tier: userData.tier ?? 'guest',
          status: userData.status ?? 'active',
          coins: userData.coins ?? 50,
          totalChats: userData.totalChats ?? 0,
          dailyChats: userData.dailyChats ?? 0,
          lastCoinClaim: userData.lastCoinClaim ?? new Date(),
          // Store OTP fields when provided (email verification flow)
          otp: (userData as any).otp,
          otpExpiresAt: (userData as any).otpExpiresAt,
          // Session fields (optional on creation)
          activeDeviceToken: (userData as any).activeDeviceToken || null,
          lastLoginDevice: (userData as any).lastLoginDevice || null,
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
    const newUser = {
      id,
      deviceId: userData.deviceId!,
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash,
      phoneNumber: userData.phoneNumber,
      phoneHash: userData.phoneHash,
      isVerified: userData.isVerified ?? false,
      tier: userData.tier ?? 'guest',
      status: userData.status ?? 'active',
      coins: userData.coins ?? 50,
      totalChats: userData.totalChats ?? 0,
      dailyChats: userData.dailyChats ?? 0,
      lastCoinClaim: userData.lastCoinClaim ?? new Date(),
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
    if (this.isConnected) {
      try {
        const user = await UserModel.findOneAndUpdate({ id }, { ...updates, updatedAt: new Date() }, { new: true }).lean();
        return this.mongoUserToUser(user);
      } catch (err) {
        console.error('MongoDB updateUser failed, using fallback:', err);
      }
    }
    const user = this.users.get(id);
    if (!user) return null;
    Object.assign(user, updates);
    user.updatedAt = new Date();
    this.users.set(id, user);
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
        const availableCoins = userDoc.coins ?? 0;
        if (availableCoins < cost) {
          return { success: false, reason: 'INSUFFICIENT_COINS' };
        }

        const previous = {
          coins: availableCoins,
          totalChats: userDoc.totalChats ?? 0,
          dailyChats: userDoc.dailyChats ?? 0,
          lastCoinClaim: userDoc.lastCoinClaim
        };

        const updatedDoc = await UserModel.findOneAndUpdate(
          { id: userId, coins: { $gte: cost } },
          {
            $inc: { coins: -cost, totalChats: 1, dailyChats: 1 },
            $set: { updatedAt: new Date(), lastActiveAt: new Date() }
          },
          { new: true }
        ).lean();

        if (!updatedDoc) {
          return { success: false, reason: 'INSUFFICIENT_COINS' };
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
    const availableCoins = normalized.coins ?? 0;
    if (availableCoins < cost) {
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
      coins: availableCoins - cost,
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
    return this.updateUser(userId, { phoneHash, isVerified: true, tier: 'verified' } as any);
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
      } catch (err) {
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
        await AdminModel.updateOne(
          { id: adminId },
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
      admin: ['view_users', 'ban_users', 'view_reports', 'resolve_reports', 'view_stats'],
      moderator: ['view_users', 'view_reports', 'resolve_reports']
    };
    return permissionMap[role] || permissionMap.moderator;
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

  /**
   * Get all users with their report counts
   */
  static async getAllUsers(): Promise<any[]> {
    if (this.isConnected) {
      try {
        const users = await UserModel.find({}).lean();
        return users.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          tier: user.tier || 'guest',
          status: user.status,
          reportCount: user.reportCount || 0,
          isVerified: user.isVerified || false,
          coins: user.coins || 0,
          totalChats: user.totalChats || 0,
          dailyChats: user.dailyChats || 0,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt
        }));
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
        const result = await UserModel.updateOne(
          { id: userId },
          { tier: newRole, updatedAt: new Date() }
        );
        return result.modifiedCount > 0;
      } catch (err) {
        console.error('MongoDB updateUserRole failed:', err);
      }
    }
    const user = this.users.get(userId);
    if (user) {
      user.tier = newRole;
      user.updatedAt = new Date();
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
    
    // In-memory fallback
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter((user: any) => 
      user.username?.toLowerCase().includes(lowerQuery) ||
      user.email?.toLowerCase().includes(lowerQuery)
    );
  }
}