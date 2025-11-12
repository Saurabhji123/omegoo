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