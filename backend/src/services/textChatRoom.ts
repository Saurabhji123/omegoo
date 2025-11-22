/**
 * Text Chat Room Service
 * Manages active rooms, message buffering, typing events, rate limiting
 */

import { TextChatRoom, TextChatMessage, TypingEvent, MessageRateLimit } from '../types/textChat';

export class TextChatRoomService {
  private static messageRateLimits = new Map<string, MessageRateLimit>();
  private static typingStates = new Map<string, Map<string, boolean>>(); // roomId -> userId -> isTyping
  
  // Rate limit: 10 messages per 10 seconds
  private static readonly MAX_MESSAGES = 10;
  private static readonly RATE_WINDOW_MS = 10000;

  /**
   * Add message to room with rate limiting
   */
  static addMessage(
    room: TextChatRoom,
    message: TextChatMessage
  ): { success: boolean; error?: string; remaining?: number } {
    // Check rate limit
    const rateLimitCheck = this.checkRateLimit(message.senderId);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        remaining: rateLimitCheck.remaining
      };
    }

    // Add to room messages
    room.messages.push(message);
    room.messageCount++;
    room.lastActivityAt = Date.now();

    // Keep only last 30 messages for moderation
    if (room.messages.length > 30) {
      room.messages = room.messages.slice(-30);
    }

    console.log(`[TextChatRoom] Message added to ${room.roomId}. Total: ${room.messageCount}`);

    return {
      success: true,
      remaining: rateLimitCheck.remaining
    };
  }

  /**
   * Check message rate limit
   */
  private static checkRateLimit(userId: string): { 
    allowed: boolean; 
    remaining: number;
  } {
    const now = Date.now();
    const userLimit = this.messageRateLimits.get(userId);

    // Initialize if first message
    if (!userLimit) {
      const newLimit: MessageRateLimit = {
        userId,
        timestamps: [now],
        violationCount: 0
      };
      this.messageRateLimits.set(userId, newLimit);
      return { allowed: true, remaining: this.MAX_MESSAGES - 1 };
    }

    // Remove timestamps outside window
    userLimit.timestamps = userLimit.timestamps.filter(
      ts => now - ts < this.RATE_WINDOW_MS
    );

    // Check if over limit
    if (userLimit.timestamps.length >= this.MAX_MESSAGES) {
      userLimit.violationCount++;
      console.warn(`[TextChatRoom] Rate limit violation for ${userId}. Count: ${userLimit.violationCount}`);
      return { allowed: false, remaining: 0 };
    }

    // Add timestamp
    userLimit.timestamps.push(now);
    return { 
      allowed: true, 
      remaining: this.MAX_MESSAGES - userLimit.timestamps.length 
    };
  }

  /**
   * Get rate limit remaining
   */
  static getRateLimitRemaining(userId: string): number {
    const userLimit = this.messageRateLimits.get(userId);
    if (!userLimit) return this.MAX_MESSAGES;

    const now = Date.now();
    const validTimestamps = userLimit.timestamps.filter(
      ts => now - ts < this.RATE_WINDOW_MS
    );

    return Math.max(0, this.MAX_MESSAGES - validTimestamps.length);
  }

  /**
   * Set typing state for user in room
   */
  static setTyping(roomId: string, userId: string, isTyping: boolean): void {
    let roomTyping = this.typingStates.get(roomId);
    if (!roomTyping) {
      roomTyping = new Map();
      this.typingStates.set(roomId, roomTyping);
    }

    roomTyping.set(userId, isTyping);

    // Auto-clear typing after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        const current = roomTyping?.get(userId);
        if (current === true) {
          roomTyping?.set(userId, false);
        }
      }, 3000);
    }
  }

  /**
   * Get typing state for user
   */
  static isTyping(roomId: string, userId: string): boolean {
    return this.typingStates.get(roomId)?.get(userId) || false;
  }

  /**
   * Cleanup room resources
   */
  static cleanupRoom(room: TextChatRoom): void {
    // Remove typing states
    this.typingStates.delete(room.roomId);

    // Remove rate limits for users
    this.messageRateLimits.delete(room.user1.userId);
    this.messageRateLimits.delete(room.user2.userId);

    console.log(`[TextChatRoom] Cleaned up room ${room.roomId}`);
  }

  /**
   * Cleanup stale rate limits (> 5 minutes old)
   */
  static cleanupRateLimits(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, limit] of this.messageRateLimits.entries()) {
      // Remove if no recent messages
      const latestTimestamp = Math.max(...limit.timestamps);
      if (now - latestTimestamp > staleThreshold) {
        this.messageRateLimits.delete(userId);
      }
    }
  }

  /**
   * Start cleanup interval
   */
  static startCleanup(): void {
    setInterval(() => this.cleanupRateLimits(), 60 * 1000); // Every minute
    console.log('[TextChatRoom] Rate limit cleanup interval started');
  }

  /**
   * Get rate limit stats
   */
  static getRateLimitStats(): {
    totalUsers: number;
    violations: number;
  } {
    let violations = 0;
    for (const limit of this.messageRateLimits.values()) {
      violations += limit.violationCount;
    }

    return {
      totalUsers: this.messageRateLimits.size,
      violations
    };
  }
}
