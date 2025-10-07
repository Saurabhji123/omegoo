// database.service.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
/* -------------------------
   Interfaces (Mongoose docs)
   ------------------------- */
interface IUserDoc extends Document {
  id: string;
  deviceId: string;
  phoneNumber?: string;
  phoneHash?: string;
  isVerified: boolean;
  tier: 'guest' | 'verified' | 'premium';
  status: 'active' | 'banned' | 'suspended';
  coins?: number;
  preferences?: any;
  subscription?: any;
  isOnline?: boolean;
  socketId?: string | null;
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

/* -------------------------
   Schemas
   ------------------------- */
const UserSchema = new Schema<IUserDoc>({
  id: { type: String, required: true, unique: true },
  deviceId: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  phoneHash: { type: String },
  isVerified: { type: Boolean, default: false },
  tier: { type: String, enum: ['guest', 'verified', 'premium'], default: 'guest' },
  status: { type: String, enum: ['active', 'banned', 'suspended'], default: 'active' },
  coins: { type: Number, default: 0 },
  preferences: { type: Schema.Types.Mixed, default: {} },
  subscription: { type: Schema.Types.Mixed, default: {} },
  isOnline: { type: Boolean, default: false },
  socketId: { type: String, default: null },
  lastActiveAt: { type: Date },
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

/* -------------------------
   Models
   ------------------------- */
const UserModel: Model<IUserDoc> = mongoose.model<IUserDoc>('User', UserSchema);
const ChatSessionModel: Model<IChatSessionDoc> = mongoose.model<IChatSessionDoc>('ChatSession', ChatSessionSchema);
const ModerationReportModel: Model<IModerationReportDoc> = mongoose.model<IModerationReportDoc>('ModerationReport', ModerationReportSchema);
const MessageModel: Model<IMessageDoc> = mongoose.model<IMessageDoc>('Message', MessageSchema);
const ChatRoomModel: Model<IChatRoomDoc> = mongoose.model<IChatRoomDoc>('ChatRoom', ChatRoomSchema);

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

  /* ---------- Connection ---------- */
  static async initialize(): Promise<void> {
    if (this.isConnected) return;

    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb+srv://omegoo_db_user:omegoo_pass@cluster0.fabck1e.mongodb.net/omegoo_db?retryWrites=true&w=majority';

    try {
      console.log('🔌 Connecting to MongoDB Atlas...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        bufferCommands: false,
      });
      this.isConnected = true;
      console.log('✅ MongoDB Atlas connected successfully');
      console.log(`🔗 Database: ${mongoose.connection.name}`);
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
      phoneHash: mongoUser.phoneHash,
      phoneNumber: mongoUser.phoneNumber,
      tier: mongoUser.tier,
      status: mongoUser.status,
      coins: mongoUser.coins,
      isVerified: mongoUser.isVerified,
      preferences: mongoUser.preferences,
      subscription: mongoUser.subscription,
      isOnline: mongoUser.isOnline,
      socketId: mongoUser.socketId,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt,
      lastActiveAt: mongoUser.lastActiveAt || mongoUser.updatedAt
    };
  }

  /* ---------- User operations ---------- */
  static async createUser(userData: Partial<IUserDoc>): Promise<any> {
    if (this.isConnected) {
      try {
        const userDoc = new UserModel({
          id: this.generateId('user-'),
          deviceId: userData.deviceId,
          phoneNumber: userData.phoneNumber,
          phoneHash: userData.phoneHash,
          isVerified: userData.isVerified ?? false,
          tier: userData.tier ?? 'guest',
          status: userData.status ?? 'active',
          coins: userData.coins ?? 0,
          preferences: userData.preferences ?? {},
          subscription: userData.subscription ?? {},
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await userDoc.save();
        return this.mongoUserToUser(userDoc);
      } catch (err) {
        console.error('MongoDB createUser failed, fallback to in-memory:', err);
      }
    }

    // in-memory fallback
    const id = this.generateId('user-');
    const newUser = {
      id,
      deviceId: userData.deviceId!,
      phoneNumber: userData.phoneNumber,
      phoneHash: userData.phoneHash,
      isVerified: userData.isVerified ?? false,
      tier: userData.tier ?? 'guest',
      status: userData.status ?? 'active',
      coins: userData.coins ?? 0,
      preferences: userData.preferences ?? {},
      subscription: userData.subscription ?? {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, newUser);
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
}
