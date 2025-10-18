import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { DatabaseService, RedisService } from './serviceFactory';
import { RedisService as DevRedisService } from './redis-dev';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export class SocketService {
  private static io: SocketIOServer;
  private static connectedUsers = new Map<string, string>(); // userId -> socketId
  private static waitingQueue: string[] = []; // For in-memory queue management
  private static activeSessions = new Map<string, { user1: string, user2: string }>(); // sessionId -> users
  private static disconnectionTimers = new Map<string, NodeJS.Timeout>(); // userId -> timer for delayed cleanup

  static initialize(io: SocketIOServer) {
    this.io = io;

    // Authentication middleware - simplified for development
    io.use(async (socket: AuthenticatedSocket, next) => {
      console.log(`🔐 Socket auth attempt from: ${socket.handshake.address} with origin: ${socket.handshake.headers.origin}`);
      const token = socket.handshake.auth.token;
      console.log(`🔑 Token received: ${token ? 'YES' : 'NO'}`);
      
      // For development - always create guest user to avoid auth issues
      const guestId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      socket.userId = guestId;
      socket.user = {
        id: guestId,
        deviceId: guestId,
        tier: 'guest',
        status: 'active',
        isVerified: false,
        coins: 0,
        preferences: {
          language: 'en',
          interests: [],
          genderPreference: 'any'
        },
        subscription: {
          type: 'none'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActiveAt: new Date()
      };
      console.log(`🔓 Dev user created: ${guestId}`);
      next();
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 NEW CONNECTION: User ${socket.userId} connected from ${socket.handshake.address}`);
      console.log(`📊 Total connected users: ${this.connectedUsers.size + 1}`);
      
      // Check if user already has an active connection
      const existingSocketId = this.connectedUsers.get(socket.userId!);
      if (existingSocketId) {
        console.log(`⚠️ User ${socket.userId} already connected, disconnecting old connection`);
        const existingSocket = this.io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.emit('connection_replaced', { reason: 'New device connected' });
          existingSocket.disconnect(true);
        }
      }
      
      // Clear any pending disconnection timer for this user
      const existingTimer = this.disconnectionTimers.get(socket.userId!);
      if (existingTimer) {
        console.log(`⏰ Clearing disconnection timer for ${socket.userId} (reconnected)`);
        clearTimeout(existingTimer);
        this.disconnectionTimers.delete(socket.userId!);
      }

      // Store new connection
      this.connectedUsers.set(socket.userId!, socket.id);
      
      // Set user online status
      DevRedisService.setUserOnline(socket.userId!);

      this.setupSocketHandlers(socket);
      
      // Start queue cleanup if this is the first connection
      if (this.connectedUsers.size === 1) {
        this.startQueueCleanup();
      }

      socket.on('disconnect', async () => {
        console.log(`🔌 User ${socket.userId} disconnected`);
        console.log(`📊 Active sessions before cleanup:`, Array.from(this.activeSessions.entries()));
        
        // IMMEDIATE: Notify partner if user is in an active session
        for (const [sessionId, session] of this.activeSessions.entries()) {
          if (session.user1 === socket.userId || session.user2 === socket.userId) {
            const partnerId = session.user1 === socket.userId ? session.user2 : session.user1;
            const partnerSocketId = this.connectedUsers.get(partnerId);
            
            console.log(`🔍 Found active session ${sessionId} with partner ${partnerId}`);
            console.log(`🔍 Partner socket ID: ${partnerSocketId}`);
            
            if (partnerSocketId) {
              const partnerSocket = this.io.sockets.sockets.get(partnerSocketId);
              if (partnerSocket) {
                console.log(`📢 Immediately notifying partner ${partnerId} about disconnect`);
                partnerSocket.emit('user_disconnected', { userId: socket.userId });
                partnerSocket.emit('session_ended', { reason: 'Partner disconnected' });
                console.log(`✅ Partner ${partnerId} notified successfully`);
              } else {
                console.log(`⚠️ Partner socket not found in io.sockets.sockets`);
              }
            } else {
              console.log(`⚠️ Partner ${partnerId} not found in connectedUsers map`);
            }
          }
        }
        
        // Set a delayed cleanup timer (60 seconds) to handle reconnections
        const cleanupTimer = setTimeout(async () => {
          console.log(`🧹 Cleaning up sessions for user ${socket.userId} (after delay)`);
          
          // Clean up active sessions ONLY if user hasn't reconnected
          if (!this.connectedUsers.has(socket.userId!)) {
            await this.cleanupUserSessions(socket.userId!);
            
            // Remove from active sessions tracking
            for (const [sessionId, session] of this.activeSessions.entries()) {
              if (session.user1 === socket.userId || session.user2 === socket.userId) {
                console.log(`🗑️ Removing session ${sessionId} due to user disconnect`);
                this.activeSessions.delete(sessionId);
              }
            }
            
            // Remove from all queues
            await DevRedisService.removeFromMatchQueue(socket.userId!, 'text');
            await DevRedisService.removeFromMatchQueue(socket.userId!, 'audio');
            await DevRedisService.removeFromMatchQueue(socket.userId!, 'video');
            
            // Remove from in-memory queue too
            const queuePosition = this.waitingQueue.indexOf(socket.userId!);
            if (queuePosition !== -1) {
              this.waitingQueue.splice(queuePosition, 1);
              console.log(`🗑️ Removed ${socket.userId} from waiting queue`);
            }
            
            // Set user offline
            DevRedisService.setUserOffline(socket.userId!);
          } else {
            console.log(`👤 User ${socket.userId} reconnected, skipping cleanup`);
          }
          
          // Remove the timer reference
          this.disconnectionTimers.delete(socket.userId!);
          
          console.log(`✅ Session cleanup completed for user ${socket.userId}`);
        }, 60000); // 60 second delay - more time for reconnections
        
        // Store the timer for this user
        this.disconnectionTimers.set(socket.userId!, cleanupTimer);
        console.log(`⏰ Set cleanup timer for ${socket.userId} (60s delay)`);
      });
    });
  }

  private static setupSocketHandlers(socket: AuthenticatedSocket) {
    // Omegle-style matching handlers
    socket.on('find_match', async (data) => {
      try {
        console.log(`🔍 Received find_match from ${socket.userId} with data:`, data);
        await this.handleFindMatch(socket, data);
      } catch (error) {
        console.error('❌ Find match error:', error);
        socket.emit('error', { message: 'Failed to find match' });
      }
    });

    // Also listen for hyphenated version for compatibility
    socket.on('find-match', async (data) => {
      try {
        console.log(`🔍 Received find-match from ${socket.userId} with data:`, data);
        await this.handleFindMatch(socket, data);
      } catch (error) {
        console.error('❌ Find match error:', error);
        socket.emit('error', { message: 'Failed to find match' });
      }
    });

    // Legacy matching handlers
    socket.on('start_matching', async (preferences) => {
      try {
        await this.handleStartMatching(socket, preferences);
      } catch (error) {
        socket.emit('error', { message: 'Failed to start matching' });
      }
    });

    socket.on('stop_matching', async () => {
      try {
        await this.handleStopMatching(socket);
      } catch (error) {
        socket.emit('error', { message: 'Failed to stop matching' });
      }
    });

    // Chat handlers
    socket.on('chat_message', async (data) => {
      try {
        await this.handleChatMessage(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    // WebRTC signaling - Omegle style
    socket.on('webrtc-offer', (data) => {
      this.handleWebRTCSignaling(socket, 'webrtc-offer', data);
    });

    socket.on('webrtc-answer', (data) => {
      this.handleWebRTCSignaling(socket, 'webrtc-answer', data);
    });

    socket.on('ice-candidate', (data) => {
      this.handleWebRTCSignaling(socket, 'ice-candidate', data);
    });

    // Legacy WebRTC signaling
    socket.on('webrtc_offer', (data) => {
      this.handleWebRTCSignaling(socket, 'webrtc_offer', data);
    });

    socket.on('webrtc_answer', (data) => {
      this.handleWebRTCSignaling(socket, 'webrtc_answer', data);
    });

    socket.on('webrtc_ice_candidate', (data) => {
      this.handleWebRTCSignaling(socket, 'webrtc_ice_candidate', data);
    });

    // Moderation handlers
    socket.on('report_user', async (data) => {
      try {
        await this.handleReportUser(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to report user' });
      }
    });

    socket.on('end_session', async (data) => {
      try {
        await this.handleEndSession(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to end session' });
      }
    });
  }

  private static async handleFindMatch(socket: AuthenticatedSocket, data?: { mode?: string }) {
    const mode = data?.mode || 'video'; // Default to video for Omegle-style
    
    const matchRequest = {
      userId: socket.userId!,
      mode: mode,
      preferences: {}, 
      timestamp: Date.now()
    };

    console.log(`🔍 User ${socket.userId} looking for ${mode} chat`);

    // Try to find immediate match
    const match = await DevRedisService.findMatch(matchRequest);

    if (match) {
      console.log(`✅ CREATING SESSION: ${socket.userId} <-> ${match.userId} (${mode})`);
      
      // Create chat session
      const session = await DatabaseService.createChatSession({
        user1Id: socket.userId!,
        user2Id: match.userId,
        mode: mode
      });

      console.log(`📋 Session created: ${session.id}`);

      // Track active session for chat message routing
      this.activeSessions.set(session.id, {
        user1: socket.userId!,
        user2: match.userId
      });
      console.log(`🔗 Tracked session ${session.id} between ${socket.userId} and ${match.userId}`);

      // Notify both users - current user is the initiator
      console.log(`📤 Sending match-found to ${socket.userId} (initiator)`);
      socket.emit('match-found', { 
        sessionId: session.id,
        matchUserId: match.userId,
        isInitiator: true,
        mode: mode
      });
      
      const matchSocketId = this.connectedUsers.get(match.userId);
      if (matchSocketId) {
        console.log(`📤 Sending match-found to ${match.userId} (receiver)`);
        this.io.to(matchSocketId).emit('match-found', { 
          sessionId: session.id,
          matchUserId: socket.userId,
          isInitiator: false,
          mode: mode
        });
      } else {
        console.error(`❌ Match user ${match.userId} not connected!`);
      }
    } else {
      console.log(`⏳ No immediate match, adding ${socket.userId} to ${mode} queue`);
      
      // Add to queue manually since findMatch didn't do it
      await DevRedisService.addToMatchQueue(matchRequest);
      const queueStats = DevRedisService.getQueueStats();
      
      console.log(`📊 Queue stats:`, queueStats);
      
      socket.emit('searching', { 
        position: queueStats.queues[mode] || 0,
        totalWaiting: queueStats.totalWaiting,
        mode: mode
      });
    }
  }

  private static async handleStartMatching(socket: AuthenticatedSocket, preferences: any) {
    const matchRequest = {
      userId: socket.userId!,
      mode: preferences.mode || 'text',
      preferences: preferences,
      timestamp: Date.now()
    };

    // Try to find immediate match
    const match = await DevRedisService.findMatch(matchRequest);

    if (match) {
      // Create chat session
      const session = await DatabaseService.createChatSession({
        user1Id: socket.userId!,
        user2Id: match.userId,
        mode: matchRequest.mode
      });

      // Notify both users
      socket.emit('match_found', session);
      
      const matchSocketId = this.connectedUsers.get(match.userId);
      if (matchSocketId) {
        this.io.to(matchSocketId).emit('match_found', session);
      }
    } else {
      // Add to queue
      await DevRedisService.addToMatchQueue(matchRequest);
      socket.emit('matching_started');
    }
  }

  private static async handleStopMatching(socket: AuthenticatedSocket) {
    // Remove from all queues
    await DevRedisService.removeFromMatchQueue(socket.userId!, 'text');
    await DevRedisService.removeFromMatchQueue(socket.userId!, 'audio');
    await DevRedisService.removeFromMatchQueue(socket.userId!, 'video');
    
    socket.emit('matching_stopped');
  }

  private static async handleChatMessage(socket: AuthenticatedSocket, data: any) {
    const { sessionId, content, type } = data;

    console.log(`💬 Chat message from ${socket.userId}:`, { sessionId, content, type });
    console.log(`🔍 Active sessions:`, Array.from(this.activeSessions.keys()));
    console.log(`🔍 Looking for session: ${sessionId}`);

    // Find the active session and get the partner
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.log(`❌ No active session found for ${sessionId}`);
      console.log(`🔍 Available sessions:`, this.activeSessions);
      return;
    }

    // Determine the partner (other user in the session)
    const otherUserId = session.user1 === socket.userId ? session.user2 : session.user1;
    const otherSocketId = this.connectedUsers.get(otherUserId);

    console.log(`📤 Forwarding message to partner ${otherUserId} (socket: ${otherSocketId})`);

    if (otherSocketId) {
      this.io.to(otherSocketId).emit('chat_message', {
        sessionId,
        content,
        type,
        timestamp: Date.now(),
        fromUserId: socket.userId
      });
      console.log(`✅ Message forwarded successfully`);
    } else {
      console.log(`❌ Other user ${otherUserId} not connected`);
    }

    // Store message (if needed for evidence)
    // await this.storeMessage(sessionId, socket.userId!, content);
  }

  private static handleTyping(socket: AuthenticatedSocket, data: any) {
    const { sessionId, isTyping } = data;
    
    // Forward to other user in session
    socket.to(sessionId).emit('typing', {
      userId: socket.userId,
      isTyping
    });
  }

  private static handleWebRTCSignaling(socket: AuthenticatedSocket, event: string, data: any) {
    const { targetUserId, sessionId } = data;
    
    // Find the target user's socket and forward the signaling data
    const targetSocketId = this.connectedUsers.get(targetUserId || '');
    if (targetSocketId) {
      this.io.to(targetSocketId).emit(event, {
        ...data,
        fromUserId: socket.userId
      });
      console.log(`🔄 Forwarded ${event} from ${socket.userId} to ${targetUserId}`);
    } else {
      console.warn(`⚠️ Target user ${targetUserId} not found for ${event}`);
    }
  }

  private static async handleReportUser(socket: AuthenticatedSocket, data: any) {
    const { sessionId, reason, description } = data;

    // Get session details
    const session = await this.getSessionById(sessionId);
    if (!session) return;

    const reportedUserId = session.user1_id === socket.userId ? session.user2_id : session.user1_id;

    // Create moderation report
    await DatabaseService.createModerationReport({
      sessionId,
      reportedUserId,
      reporterUserId: socket.userId!,
      violationType: reason,
      description,
      evidenceUrls: [],
      autoDetected: false,
      confidenceScore: 0
    });

    // End session immediately
    await DatabaseService.endChatSession(sessionId);
    
    // Notify both users
    socket.emit('session_ended', { reason: 'reported' });
    
    const reportedSocketId = this.connectedUsers.get(reportedUserId);
    if (reportedSocketId) {
      this.io.to(reportedSocketId).emit('session_ended', { reason: 'reported' });
    }
  }

  private static async handleEndSession(socket: AuthenticatedSocket, data: any) {
    const { sessionId, duration } = data;

    console.log(`🔌 Ending session: ${sessionId} by user ${socket.userId}`);
    
    // End session in database
    await DatabaseService.endChatSession(sessionId, duration);
    
    // Find the partner in this session
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const partnerId = session.user1 === socket.userId ? session.user2 : session.user1;
      const partnerSocketId = this.connectedUsers.get(partnerId);
      
      if (partnerSocketId) {
        console.log(`📤 Notifying partner ${partnerId} of session end`);
        this.io.to(partnerSocketId).emit('session_ended', { 
          sessionId,
          reason: 'partner_left' 
        });
      }
      
      // Remove from active sessions immediately
      this.activeSessions.delete(sessionId);
      console.log(`🗑️ Removed session ${sessionId} from active sessions`);
    }
  }

  // Utility methods
  private static async getSessionById(sessionId: string) {
    const result = await DatabaseService.query('SELECT * FROM chat_sessions WHERE id = $1', [sessionId]);
    return result.rows[0];
  }

  static async sendModerationWarning(userId: string, message: string) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('moderation_warning', { message });
    }
  }

  static async banUser(userId: string) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('user_banned');
      this.io.sockets.sockets.get(socketId)?.disconnect(true);
    }
  }

  static getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  static isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  private static queueCleanupInterval: NodeJS.Timeout | null = null;

  private static startQueueCleanup() {
    if (!this.queueCleanupInterval) {
      this.queueCleanupInterval = setInterval(async () => {
        await DevRedisService.clearExpiredRequests();
        const stats = DevRedisService.getQueueStats();
        if (stats.totalWaiting > 0) {
          console.log(`📊 Queue status: ${stats.totalWaiting} users waiting (video: ${stats.queues.video || 0})`);
        }
      }, 30000); // Clean up every 30 seconds
      console.log('🧹 Started queue cleanup service');
    }
  }

  private static stopQueueCleanup() {
    if (this.queueCleanupInterval) {
      clearInterval(this.queueCleanupInterval);
      this.queueCleanupInterval = null;
      console.log('🛑 Stopped queue cleanup service');
    }
  }

  private static async cleanupUserSessions(userId: string) {
    try {
      console.log(`🧹 Cleaning up sessions for user ${userId}`);
      
      // Delete user session from Redis
      await DevRedisService.deleteUserSession(userId);
      
      console.log(`✅ Session cleanup completed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error during session cleanup for ${userId}:`, error);
    }
  }
}