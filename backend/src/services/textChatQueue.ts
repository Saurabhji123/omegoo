/**
 * Text Chat Queue Service
 * Ultra-fast FIFO pairing with 100-300ms matching delay for optimal pairing
 * Handles 10k+ concurrent users with efficient in-memory queue
 */

import { TextChatQueueEntry, TextChatRoom, TextChatMetrics } from '../types/textChat';
import { v4 as uuidv4 } from 'uuid';

export class TextChatQueueService {
  private static waitingQueue: TextChatQueueEntry[] = [];
  private static activeRooms = new Map<string, TextChatRoom>();
  private static userToRoom = new Map<string, string>(); // userId -> roomId
  private static matchingInProgress = false;
  private static metrics: TextChatMetrics[] = [];
  
  // Performance tracking
  private static pairingTimes: number[] = [];
  private static requeueCount = 0;

  // Reconnection support - store disconnected user info for 30s
  private static disconnectedUsers = new Map<string, {
    roomId: string;
    partnerId: string;
    disconnectedAt: number;
  }>();

  // Recent partner tracking - prevent immediate re-matching
  // Store last 5 partners for each user, expire after 5 minutes
  private static recentPartners = new Map<string, Array<{ partnerId: string; timestamp: number }>>();
  private static readonly MAX_RECENT_PARTNERS = 5;
  private static readonly RECENT_PARTNER_EXPIRE_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Add user to waiting queue
   * Returns queue position and estimated wait time
   */
  static async joinQueue(entry: TextChatQueueEntry): Promise<{ 
    position: number; 
    estimatedWaitTime: number;
    success: boolean;
  }> {
    // Check if user already in queue
    const existingIndex = this.waitingQueue.findIndex(e => e.userId === entry.userId);
    if (existingIndex >= 0) {
      console.log(`[TextChatQueue] User ${entry.userId} already in queue, updating socket`);
      this.waitingQueue[existingIndex] = entry;
      return {
        position: existingIndex + 1,
        estimatedWaitTime: this.estimateWaitTime(existingIndex),
        success: true
      };
    }

    // Add to queue
    this.waitingQueue.push(entry);
    const position = this.waitingQueue.length;
    
    console.log(`[TextChatQueue] User ${entry.userId} joined queue at position ${position}`);
    console.log(`[TextChatQueue] Current queue size: ${this.waitingQueue.length}`);

    // Trigger matching with small delay for better pairing
    setTimeout(() => this.tryMatch(), 150); // 150ms delay for optimal pairing

    return {
      position,
      estimatedWaitTime: this.estimateWaitTime(position - 1),
      success: true
    };
  }

  /**
   * Remove user from queue
   */
  static leaveQueue(userId: string): boolean {
    const index = this.waitingQueue.findIndex(e => e.userId === userId);
    if (index >= 0) {
      this.waitingQueue.splice(index, 1);
      console.log(`[TextChatQueue] User ${userId} left queue. Queue size: ${this.waitingQueue.length}`);
      return true;
    }
    return false;
  }

  /**
   * FIFO matching algorithm with recent partner exclusion
   */
  static async tryMatch(): Promise<void> {
    // Prevent concurrent matching
    if (this.matchingInProgress) return;
    if (this.waitingQueue.length < 2) return;

    this.matchingInProgress = true;

    try {
      // Get first user
      const user1 = this.waitingQueue.shift();
      if (!user1) return;

      // Find a suitable partner (not recently matched)
      let user2Index = -1;
      for (let i = 0; i < this.waitingQueue.length; i++) {
        const candidate = this.waitingQueue[i];
        
        // Check if they were recently matched
        if (!this.wereRecentlyMatched(user1.userId, candidate.userId)) {
          user2Index = i;
          break;
        }
      }

      // If no suitable partner found
      if (user2Index === -1) {
        // If queue has only 1-2 people, allow re-match after small delay
        if (this.waitingQueue.length <= 1) {
          console.log(`[TextChatQueue] Only ${this.waitingQueue.length + 1} users, allowing re-match`);
          const user2 = this.waitingQueue.shift();
          if (user2) {
            // Put both back in queue and match them (no other option)
            this.waitingQueue.push(user1, user2);
            const matchUser1 = this.waitingQueue.shift()!;
            const matchUser2 = this.waitingQueue.shift()!;
            await this.createMatch(matchUser1, matchUser2);
          } else {
            this.waitingQueue.unshift(user1);
          }
        } else {
          // Put user1 at end and try again
          this.waitingQueue.push(user1);
          console.log(`[TextChatQueue] No suitable partner for ${user1.userId}, requeued`);
        }
        return;
      }

      // Remove user2 from queue
      const user2 = this.waitingQueue.splice(user2Index, 1)[0];
      
      // Create match
      await this.createMatch(user1, user2);

      // Continue matching if more users in queue
      if (this.waitingQueue.length >= 2) {
        setTimeout(() => this.tryMatch(), 100);
      }

    } finally {
      this.matchingInProgress = false;
    }
  }

  /**
   * Create a match between two users
   */
  private static async createMatch(user1: TextChatQueueEntry, user2: TextChatQueueEntry): Promise<void> {
    const roomId = `text_room_${uuidv4()}`;
    const createdAt = Date.now();
    
    const room: TextChatRoom = {
      roomId,
      user1: {
        userId: user1.userId,
        socketId: user1.socketId,
        guestId: user1.guestId
      },
      user2: {
        userId: user2.userId,
        socketId: user2.socketId,
        guestId: user2.guestId
      },
      createdAt,
      lastActivityAt: createdAt,
      messageCount: 0,
      messages: [],
      status: 'active'
    };

    this.activeRooms.set(roomId, room);
    this.userToRoom.set(user1.userId, roomId);
    this.userToRoom.set(user2.userId, roomId);

    // Track recent partners
    this.addRecentPartner(user1.userId, user2.userId);
    this.addRecentPartner(user2.userId, user1.userId);

    // Track pairing time
    const user1WaitTime = createdAt - user1.joinedAt;
    const user2WaitTime = createdAt - user2.joinedAt;
    this.pairingTimes.push(user1WaitTime, user2WaitTime);
    
    // Keep only last 1000 pairing times for performance
    if (this.pairingTimes.length > 1000) {
      this.pairingTimes = this.pairingTimes.slice(-1000);
    }

    console.log(`[TextChatQueue] ✅ Matched users ${user1.userId} & ${user2.userId} in room ${roomId}`);
    console.log(`[TextChatQueue] Wait times: ${user1WaitTime}ms, ${user2WaitTime}ms`);
    console.log(`[TextChatQueue] Queue size after match: ${this.waitingQueue.length}`);
  }
      }

    } finally {
      this.matchingInProgress = false;
    }
  }

  /**
   * Get room by ID
   */
  static getRoom(roomId: string): TextChatRoom | undefined {
    return this.activeRooms.get(roomId);
  }

  /**
   * Get room for user
   */
  static getRoomForUser(userId: string): TextChatRoom | undefined {
    const roomId = this.userToRoom.get(userId);
    return roomId ? this.activeRooms.get(roomId) : undefined;
  }

  /**
   * Get partner in room
   */
  static getPartner(roomId: string, userId: string): { userId: string; socketId: string; guestId?: string } | null {
    const room = this.activeRooms.get(roomId);
    if (!room) return null;

    if (room.user1.userId === userId) return room.user2;
    if (room.user2.userId === userId) return room.user1;
    return null;
  }

  /**
   * Update room activity timestamp
   */
  static updateActivity(roomId: string): void {
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.lastActivityAt = Date.now();
    }
  }

  /**
   * End room and cleanup
   */
  static endRoom(roomId: string, reason?: string): void {
    const room = this.activeRooms.get(roomId);
    if (!room) return;

    room.status = 'ended';
    
    // Track metrics
    const duration = Date.now() - room.createdAt;
    const metric: TextChatMetrics = {
      timeToPair: 0, // Would need to track from queue join
      sessionDuration: duration,
      messageCount: room.messageCount,
      wasReported: false,
      disconnectReason: reason as any
    };
    this.metrics.push(metric);

    // Cleanup
    this.userToRoom.delete(room.user1.userId);
    this.userToRoom.delete(room.user2.userId);
    this.activeRooms.delete(roomId);

    console.log(`[TextChatQueue] Room ${roomId} ended. Reason: ${reason}. Duration: ${duration}ms. Messages: ${room.messageCount}`);
  }

  /**
   * Handle user disconnect - requeue or cleanup
   */
  static handleDisconnect(userId: string): { 
    wasInRoom: boolean; 
    partnerId?: string; 
    roomId?: string;
  } {
    // Check if user was in a room
    const roomId = this.userToRoom.get(userId);
    if (roomId) {
      const room = this.activeRooms.get(roomId);
      if (room) {
        const partner = this.getPartner(roomId, userId);
        
        // Store for potential reconnection (30 seconds window)
        if (partner) {
          this.disconnectedUsers.set(userId, {
            roomId,
            partnerId: partner.userId,
            disconnectedAt: Date.now()
          });
          
          console.log(`[TextChatQueue] User ${userId} disconnected, stored for reconnection (30s window)`);
        }
        
        // Don't end room immediately - give 30s grace period
        // Partner will be notified via socket disconnect handler
        
        return {
          wasInRoom: true,
          partnerId: partner?.userId,
          roomId
        };
      }
    }

    // Remove from queue if waiting
    const wasInQueue = this.leaveQueue(userId);
    
    return {
      wasInRoom: false
    };
  }

  /**
   * Attempt to reconnect user to their previous room
   */
  static attemptReconnect(userId: string, socketId: string): {
    success: boolean;
    roomId?: string;
    partnerId?: string;
    messages?: any[];
  } {
    const disconnectInfo = this.disconnectedUsers.get(userId);
    
    if (!disconnectInfo) {
      return { success: false };
    }

    // Check if within 30-second reconnection window
    const timeSinceDisconnect = Date.now() - disconnectInfo.disconnectedAt;
    if (timeSinceDisconnect > 30000) {
      this.disconnectedUsers.delete(userId);
      console.log(`[TextChatQueue] Reconnection window expired for ${userId}`);
      return { success: false };
    }

    // Check if room still exists
    const room = this.activeRooms.get(disconnectInfo.roomId);
    if (!room) {
      this.disconnectedUsers.delete(userId);
      console.log(`[TextChatQueue] Room no longer exists for ${userId}`);
      return { success: false };
    }

    // Update socket ID
    if (room.user1.userId === userId) {
      room.user1.socketId = socketId;
    } else if (room.user2.userId === userId) {
      room.user2.socketId = socketId;
    }

    // Clear disconnect info
    this.disconnectedUsers.delete(userId);

    console.log(`[TextChatQueue] ✅ User ${userId} reconnected to room ${disconnectInfo.roomId}`);

    return {
      success: true,
      roomId: disconnectInfo.roomId,
      partnerId: disconnectInfo.partnerId,
      messages: room.messages
    };
  }

  /**
   * Cleanup expired reconnection attempts
   */
  static cleanupExpiredReconnections(): void {
    const now = Date.now();
    const expireThreshold = 30000; // 30 seconds

    for (const [userId, info] of this.disconnectedUsers.entries()) {
      if (now - info.disconnectedAt > expireThreshold) {
        // End the room if it still exists
        const room = this.activeRooms.get(info.roomId);
        if (room) {
          this.endRoom(info.roomId, 'partner_disconnected');
        }
        
        this.disconnectedUsers.delete(userId);
        console.log(`[TextChatQueue] Expired reconnection for ${userId}, room ended`);
      }
    }
  }

  /**
   * Requeue user (e.g., after partner disconnect)
   */
  static async requeue(entry: TextChatQueueEntry): Promise<void> {
    this.requeueCount++;
    await this.joinQueue(entry);
    console.log(`[TextChatQueue] User ${entry.userId} requeued. Total requeues: ${this.requeueCount}`);
  }

  /**
   * Estimate wait time based on queue position
   * Assumes average pairing time of 2 seconds
   */
  private static estimateWaitTime(position: number): number {
    if (position === 0) return 1; // Next match
    return Math.ceil(position / 2) * 2; // Pairs every 2 seconds
  }

  /**
   * Get queue statistics
   */
  static getStats(): {
    queueSize: number;
    activeRooms: number;
    medianPairingTime: number;
    p95PairingTime: number;
    requeueRate: number;
  } {
    const sorted = [...this.pairingTimes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

    return {
      queueSize: this.waitingQueue.length,
      activeRooms: this.activeRooms.size,
      medianPairingTime: median,
      p95PairingTime: p95,
      requeueRate: this.requeueCount
    };
  }

  /**
   * Get detailed analytics for monitoring
   */
  static getDetailedAnalytics(): {
    queue: {
      currentSize: number;
      peakSize: number;
    };
    rooms: {
      active: number;
      totalCreated: number;
      averageDuration: number;
    };
    pairing: {
      medianTime: number;
      p50Time: number;
      p95Time: number;
      p99Time: number;
      underOneSecond: number; // Percentage
    };
    requeues: {
      total: number;
      rate: number; // Per hour estimate
    };
    metrics: any[];
  } {
    const sorted = [...this.pairingTimes].sort((a, b) => a - b);
    const len = sorted.length;
    
    const median = sorted[Math.floor(len / 2)] || 0;
    const p50 = sorted[Math.floor(len * 0.5)] || 0;
    const p95 = sorted[Math.floor(len * 0.95)] || 0;
    const p99 = sorted[Math.floor(len * 0.99)] || 0;
    
    const underOneSecond = len > 0 
      ? (sorted.filter(t => t < 1000).length / len) * 100 
      : 0;

    let totalDuration = 0;
    let roomCount = 0;
    for (const metric of this.metrics) {
      if (metric.sessionDuration) {
        totalDuration += metric.sessionDuration;
        roomCount++;
      }
    }
    const avgDuration = roomCount > 0 ? totalDuration / roomCount : 0;

    return {
      queue: {
        currentSize: this.waitingQueue.length,
        peakSize: Math.max(this.waitingQueue.length, 0) // Could track peak over time
      },
      rooms: {
        active: this.activeRooms.size,
        totalCreated: this.metrics.length,
        averageDuration: avgDuration
      },
      pairing: {
        medianTime: median,
        p50Time: p50,
        p95Time: p95,
        p99Time: p99,
        underOneSecond: Math.round(underOneSecond * 100) / 100
      },
      requeues: {
        total: this.requeueCount,
        rate: this.requeueCount // Could calculate per hour
      },
      metrics: this.metrics.slice(-100) // Last 100 sessions
    };
  }

  /**
   * Cleanup stale rooms (> 30 minutes inactive)
   */
  static cleanupStaleRooms(): void {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [roomId, room] of this.activeRooms.entries()) {
      if (now - room.lastActivityAt > staleThreshold) {
        console.log(`[TextChatQueue] Cleaning up stale room ${roomId}`);
        this.endRoom(roomId, 'timeout');
      }
    }
    
    // Also cleanup expired reconnections and recent partners
    this.cleanupExpiredReconnections();
    this.cleanupRecentPartners();
  }

  /**
   * Start cleanup interval
   */
  static startCleanup(): void {
    setInterval(() => this.cleanupStaleRooms(), 5 * 60 * 1000); // Every 5 minutes
    console.log('[TextChatQueue] Cleanup interval started');
  }

  /**
   * Add recent partner for a user
   */
  private static addRecentPartner(userId: string, partnerId: string): void {
    if (!this.recentPartners.has(userId)) {
      this.recentPartners.set(userId, []);
    }

    const partners = this.recentPartners.get(userId)!;
    
    // Remove expired entries
    const now = Date.now();
    const validPartners = partners.filter(p => now - p.timestamp < this.RECENT_PARTNER_EXPIRE_MS);
    
    // Add new partner
    validPartners.push({ partnerId, timestamp: now });
    
    // Keep only last MAX_RECENT_PARTNERS
    if (validPartners.length > this.MAX_RECENT_PARTNERS) {
      validPartners.shift();
    }
    
    this.recentPartners.set(userId, validPartners);
  }

  /**
   * Check if two users were recently matched
   */
  private static wereRecentlyMatched(user1Id: string, user2Id: string): boolean {
    const now = Date.now();
    
    // Check user1's recent partners
    const user1Partners = this.recentPartners.get(user1Id);
    if (user1Partners) {
      const validPartners = user1Partners.filter(p => now - p.timestamp < this.RECENT_PARTNER_EXPIRE_MS);
      if (validPartners.some(p => p.partnerId === user2Id)) {
        return true;
      }
    }
    
    // Check user2's recent partners
    const user2Partners = this.recentPartners.get(user2Id);
    if (user2Partners) {
      const validPartners = user2Partners.filter(p => now - p.timestamp < this.RECENT_PARTNER_EXPIRE_MS);
      if (validPartners.some(p => p.partnerId === user1Id)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Cleanup expired recent partners
   */
  private static cleanupRecentPartners(): void {
    const now = Date.now();
    
    for (const [userId, partners] of this.recentPartners.entries()) {
      const validPartners = partners.filter(p => now - p.timestamp < this.RECENT_PARTNER_EXPIRE_MS);
      
      if (validPartners.length === 0) {
        this.recentPartners.delete(userId);
      } else {
        this.recentPartners.set(userId, validPartners);
      }
    }
  }
}
