/**
 * Text Chat Types and Interfaces
 * Ultra-fast random pairing with low-latency typing indicators
 */

export interface TextChatQueueEntry {
  userId: string;
  socketId: string;
  guestId?: string;
  joinedAt: number; // timestamp
  gender?: 'male' | 'female' | 'others';
  preferences?: {
    genderPreference?: 'any' | 'male' | 'female';
  };
}

export interface TextChatRoom {
  roomId: string;
  user1: {
    userId: string;
    socketId: string;
    guestId?: string;
  };
  user2: {
    userId: string;
    socketId: string;
    guestId?: string;
  };
  createdAt: number;
  lastActivityAt: number;
  messageCount: number;
  messages: TextChatMessage[]; // Last 30 messages for moderation
  status: 'active' | 'ended';
}

export interface TextChatMessage {
  messageId: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: number;
  delivered?: boolean;
  encrypted?: boolean;
}

export interface TypingEvent {
  roomId: string;
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

export interface TextChatReport {
  reportId: string;
  roomId: string;
  reporterId: string;
  reportedUserId: string;
  violationType: 'harassment' | 'spam' | 'inappropriate' | 'other';
  description: string;
  messages: TextChatMessage[]; // Last 30 messages
  timestamp: number;
}

export interface TextChatMetrics {
  timeToPair: number; // milliseconds
  sessionDuration: number; // milliseconds
  messageCount: number;
  wasReported: boolean;
  disconnectReason?: 'user_left' | 'partner_left' | 'timeout' | 'error';
}

export interface WaitingRoomState {
  status: 'idle' | 'waiting' | 'paired' | 'disconnected';
  queuePosition?: number;
  estimatedWaitTime?: number; // seconds
  partnerConnected?: boolean;
}

export interface MessageRateLimit {
  userId: string;
  timestamps: number[]; // Array of message timestamps for rate limiting
  violationCount: number; // Track how many times user exceeded limit
}
