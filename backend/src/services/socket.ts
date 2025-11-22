import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { DatabaseService, RedisService } from './serviceFactory';
import { RedisService as DevRedisService } from './redis-dev';
import { RealtimeUserTracker } from './realtimeMetrics';
import { TextChatQueueService } from './textChatQueue';
import { TextChatRoomService } from './textChatRoom';
import { TextChatMessage, TypingEvent } from '../types/textChat';

type ChatMode = 'text' | 'audio' | 'video';

const VALID_CHAT_MODES: ChatMode[] = ['text', 'audio', 'video'];
const CHAT_MODE_COSTS: Record<ChatMode, number> = {
  text: 1,
  audio: 1,
  video: 1
};

const normalizeMode = (mode?: string): ChatMode => {
  if (mode && VALID_CHAT_MODES.includes(mode as ChatMode)) {
    return mode as ChatMode;
  }
  return 'video';
};

const getCoinCostForMode = (mode?: string): number => CHAT_MODE_COSTS[normalizeMode(mode)];

const parseModeStrict = (mode?: string | null): ChatMode | null => {
  if (!mode) {
    return null;
  }

  const normalized = mode.toLowerCase();
  return VALID_CHAT_MODES.includes(normalized as ChatMode) ? (normalized as ChatMode) : null;
};

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface BufferedChatMessage {
  senderId: string;
  content: string;
  type?: string;
  timestamp: number;
  replyTo?: any;
}

export class SocketService {
  private static io: SocketIOServer;
  private static connectedUsers = new Map<string, string[]>(); // userId -> socketId[] (multi-device support)
  private static waitingQueue: string[] = []; // For in-memory queue management
  private static activeSessions = new Map<string, { user1: string; user2: string; mode: string }>(); // sessionId -> users + mode
  private static disconnectionTimers = new Map<string, NodeJS.Timeout>(); // userId -> timer for delayed cleanup
  private static chatTranscripts = new Map<string, BufferedChatMessage[]>();
  private static modePresence: Record<ChatMode, Set<string>> = {
    text: new Set(),
    audio: new Set(),
    video: new Set()
  };
  private static userActiveMode = new Map<string, ChatMode>();

  // Helper: Emit event to all devices of a user
  private static emitToAllUserDevices(userId: string, event: string, data: any) {
    const socketIds = this.connectedUsers.get(userId) || [];
    if (socketIds.length > 0) {
      console.log(`📤 [Multi-Device] Emitting '${event}' to ${socketIds.length} device(s) for user ${userId}`);
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  static initialize(io: SocketIOServer) {
    this.io = io;

    // Initialize text chat cleanup intervals
    TextChatQueueService.startCleanup();
    TextChatRoomService.startCleanup();
    console.log('✅ Text chat services initialized with cleanup intervals');

    // Authentication middleware - check JWT token first
    io.use(async (socket: AuthenticatedSocket, next) => {
      console.log(`🔐 Socket auth attempt from: ${socket.handshake.address} with origin: ${socket.handshake.headers.origin}`);
      const token = socket.handshake.auth.token;
      const guestId = socket.handshake.auth.guestId; // Shadow Login guest ID
      console.log(`🔑 Token received: ${token ? 'YES' : 'NO'}, Guest ID: ${guestId ? guestId.substring(0, 12) + '...' : 'NO'}`);
      
      // Try to verify JWT token first
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          const userId = decoded.userId || decoded.id;
          console.log(`✅ JWT verified for user: ${userId}`);
          
          // Use real user ID from token
          if (userId && typeof userId === 'string') {
            socket.userId = userId;
            
            // Fetch user data from database
            try {
              const userData = await DatabaseService.getUserById(userId);
              if (userData) {
                socket.user = userData;
                console.log(`✅ Authenticated user: ${userData.username} (${userId})`);
                return next();
              } else {
                console.log(`⚠️ Token valid but user not found in DB: ${userId}`);
              }
            } catch (dbError) {
              console.error(`❌ Database error fetching user:`, dbError);
            }
          }
        } catch (error) {
          console.log(`⚠️ JWT verification failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      // Shadow Login: Check for guest ID
      if (guestId && typeof guestId === 'string' && /^[a-f0-9]{64}$/i.test(guestId)) {
        try {
          // Update guest last seen
          await DatabaseService.updateGuestLastSeen(guestId);
          
          // Create a guest user object for socket context
          const guestUser = await DatabaseService.getGuestById(guestId);
          if (guestUser) {
            socket.userId = `guest-${guestId.substring(0, 16)}`;
            socket.user = {
              id: socket.userId,
              deviceId: guestId,
              tier: 'guest',
              status: 'active',
              isVerified: false,
              coins: 0,
              gender: 'others',
              preferences: {
                language: 'en',
                interests: [],
                genderPreference: 'any'
              },
              subscription: {
                type: 'none'
              },
              createdAt: guestUser.createdAt,
              updatedAt: new Date(),
              lastActiveAt: new Date()
            };
            console.log(`👤 Shadow Login guest connected: ${guestId.substring(0, 12)}...`);
            return next();
          }
        } catch (error) {
          console.error(`❌ Shadow Login guest lookup failed:`, error);
        }
      }
      
      // Fallback: Create temporary guest user for development/testing
      const tempGuestId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      socket.userId = tempGuestId;
      socket.user = {
        id: tempGuestId,
        deviceId: tempGuestId,
        tier: 'guest',
        status: 'active',
        isVerified: false,
        coins: 0,
        gender: 'others',
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
      console.log(`🔓 Temporary guest user created: ${tempGuestId}`);
      next();
    });

    io.on('connection', async (socket: AuthenticatedSocket) => {
      console.log(`🔌 NEW CONNECTION: User ${socket.userId} connected from ${socket.handshake.address}`);
      console.log(`📊 Total connected users: ${this.connectedUsers.size + 1}`);
      
      // Check if user is banned
      const banStatus = await DatabaseService.checkUserBanStatus(socket.userId!);
      if (banStatus) {
        console.log(`🚫 BANNED USER tried to connect: ${socket.userId}`);
        
        const banMessage = banStatus.banType === 'permanent'
          ? 'Your account has been permanently banned due to multiple violations.'
          : `Your account is temporarily banned until ${new Date(banStatus.expiresAt).toLocaleString()}. Reason: ${banStatus.reason}`;
        
        socket.emit('user_banned', {
          banned: true,
          banType: banStatus.banType,
          reason: banStatus.reason,
          bannedAt: banStatus.bannedAt,
          expiresAt: banStatus.expiresAt,
          message: banMessage
        });
        
        socket.disconnect(true);
        return;
      }
      
      // Multi-device support: Add this socket to user's connected devices
      const existingSocketIds = this.connectedUsers.get(socket.userId!) || [];
      const isFirstActiveDevice = existingSocketIds.length === 0;
      if (!existingSocketIds.includes(socket.id)) {
        existingSocketIds.push(socket.id);
        this.connectedUsers.set(socket.userId!, existingSocketIds);
        console.log(`✅ [Multi-Device] User ${socket.userId} connected. Total devices: ${existingSocketIds.length}`);
      }

      if (isFirstActiveDevice) {
        RealtimeUserTracker.recordUserEntry(socket.userId!);
      }
      
      // Clear any pending disconnection timer for this user
      const existingTimer = this.disconnectionTimers.get(socket.userId!);
      if (existingTimer) {
        console.log(`⏰ Clearing disconnection timer for ${socket.userId} (reconnected)`);
        clearTimeout(existingTimer);
        this.disconnectionTimers.delete(socket.userId!);
      }
      
      // Set user online status in Redis and Database
      DevRedisService.setUserOnline(socket.userId!);
      
      // Update user's isOnline status in database
      await DatabaseService.setUserOnlineStatus(socket.userId!, true);
      console.log(`✅ User ${socket.userId} marked as online in database`);

      this.setupSocketHandlers(socket);
      this.emitModeCounts(socket.id);
      
      // Start queue cleanup if this is the first connection
      if (this.connectedUsers.size === 1) {
        this.startQueueCleanup();
      }

      socket.on('disconnect', async () => {
        this.updateUserModePresence(socket.userId, null);
        console.log(`🔌 [Multi-Device] Socket ${socket.id} disconnected for user ${socket.userId}`);
        
        // Remove THIS specific socket from user's devices
        const existingSocketIds = this.connectedUsers.get(socket.userId!) || [];
        const filteredSocketIds = existingSocketIds.filter(id => id !== socket.id);
        
        if (filteredSocketIds.length > 0) {
          this.connectedUsers.set(socket.userId!, filteredSocketIds);
          console.log(`✅ [Multi-Device] User ${socket.userId} still connected on ${filteredSocketIds.length} device(s). Skipping cleanup.`);
          return; // User still has other active devices - don't disconnect session!
        } else {
          this.connectedUsers.delete(socket.userId!);
          console.log(`🔌 [Multi-Device] User ${socket.userId} fully disconnected (no remaining devices)`);
        }
        
        console.log(`📊 Active sessions before cleanup:`, Array.from(this.activeSessions.entries()));
        
        // IMMEDIATE: Notify partner if user is in an active session
        for (const [sessionId, session] of this.activeSessions.entries()) {
          if (session.user1 === socket.userId || session.user2 === socket.userId) {
            const partnerId = session.user1 === socket.userId ? session.user2 : session.user1;
            
            console.log(`🔍 Found active session ${sessionId} with partner ${partnerId}`);
            
            // Notify ALL partner devices
            this.emitToAllUserDevices(partnerId, 'user_disconnected', { userId: socket.userId });
            this.emitToAllUserDevices(partnerId, 'session_ended', { reason: 'partner_left' });
            console.log(`✅ [Multi-Device] All partner devices notified`);
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
                this.chatTranscripts.delete(sessionId);
              }
            }
            
            // Remove from all queues
            await DevRedisService.removeFromMatchQueue(socket.userId!, 'text');
            await DevRedisService.removeFromMatchQueue(socket.userId!, 'audio');
            await DevRedisService.removeFromMatchQueue(socket.userId!, 'video');
            
            // Handle text chat disconnect cleanup
            const textChatResult = TextChatQueueService.handleDisconnect(socket.userId!);
            if (textChatResult.wasInRoom && textChatResult.partnerId) {
              console.log(`💬 User ${socket.userId} disconnected from text chat room, notifying partner ${textChatResult.partnerId}`);
              const partnerSocketIds = this.connectedUsers.get(textChatResult.partnerId) || [];
              partnerSocketIds.forEach(sid => {
                this.io.to(sid).emit('text_room_ended', { reason: 'partner_disconnected' });
              });
            }
            
            // Remove from in-memory queue too
            const queuePosition = this.waitingQueue.indexOf(socket.userId!);
            if (queuePosition !== -1) {
              this.waitingQueue.splice(queuePosition, 1);
              console.log(`🗑️ Removed ${socket.userId} from waiting queue`);
            }
            
            // Set user offline
            DevRedisService.setUserOffline(socket.userId!);
            
            // Update user's isOnline status in database
            await DatabaseService.setUserOnlineStatus(socket.userId!, false);
            console.log(`✅ User ${socket.userId} marked as offline in database`);
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

  private static getModeCountsSnapshot() {
    return {
      text: this.modePresence.text.size,
      audio: this.modePresence.audio.size,
      video: this.modePresence.video.size
    };
  }

  private static emitModeCounts(targetSocketId?: string) {
    if (!this.io) {
      return;
    }

    const payload = this.getModeCountsSnapshot();
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('mode-user-counts', payload);
    } else {
      this.io.emit('mode-user-counts', payload);
    }
  }

  private static updateUserModePresence(userId: string | undefined, mode: ChatMode | null) {
    if (!userId) {
      return;
    }

    const previousMode = this.userActiveMode.get(userId) ?? null;
    const nextMode = mode ?? null;

    if (previousMode === nextMode) {
      return;
    }

    if (previousMode) {
      this.modePresence[previousMode].delete(userId);
    }

    if (nextMode) {
      this.modePresence[nextMode].add(userId);
      this.userActiveMode.set(userId, nextMode);
    } else {
      this.userActiveMode.delete(userId);
    }

    console.log('📈 Mode presence updated', {
      userId,
      previousMode,
      nextMode,
      counts: this.getModeCountsSnapshot()
    });

    this.emitModeCounts();
  }

  private static setupSocketHandlers(socket: AuthenticatedSocket) {
    socket.on('mode-presence-update', (payload: { mode?: string | null } | null) => {
      try {
        if (!socket.userId) {
          return;
        }

        const rawMode = payload?.mode;
        let targetMode: ChatMode | null = null;

        if (typeof rawMode === 'string') {
          if (rawMode === 'idle' || rawMode === 'none') {
            targetMode = null;
          } else {
            targetMode = parseModeStrict(rawMode);
          }
        } else if (rawMode === null || rawMode === undefined) {
          targetMode = null;
        }

        this.updateUserModePresence(socket.userId, targetMode);
      } catch (error) {
        console.error('⚠️ Failed to update mode presence:', error instanceof Error ? error.message : error);
      }
    });

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

    // Audio quality metrics and events
    socket.on('audio-metrics', (data) => {
      try {
        this.handleAudioMetrics(socket, data);
      } catch (error) {
        console.error('❌ Audio metrics error:', error);
      }
    });

    socket.on('audio-muted', (data) => {
      try {
        this.handleAudioMuted(socket, data);
      } catch (error) {
        console.error('❌ Audio muted event error:', error);
      }
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

    // Text Chat handlers
    socket.on('join_text_queue', async () => {
      try {
        await this.handleJoinTextQueue(socket);
      } catch (error) {
        console.error('❌ Join text queue error:', error);
        socket.emit('text_chat_error', { message: 'Failed to join text chat queue' });
      }
    });

    socket.on('leave_text_queue', () => {
      try {
        this.handleLeaveTextQueue(socket);
      } catch (error) {
        console.error('❌ Leave text queue error:', error);
      }
    });

    socket.on('send_text_message', async (data) => {
      try {
        await this.handleSendTextMessage(socket, data);
      } catch (error) {
        console.error('❌ Send text message error:', error);
        socket.emit('text_chat_error', { message: 'Failed to send message' });
      }
    });

    socket.on('text_typing_start', (data) => {
      try {
        this.handleTextTyping(socket, data, true);
      } catch (error) {
        console.error('❌ Text typing start error:', error);
      }
    });

    socket.on('text_typing_stop', (data) => {
      try {
        this.handleTextTyping(socket, data, false);
      } catch (error) {
        console.error('❌ Text typing stop error:', error);
      }
    });

    socket.on('leave_text_room', () => {
      try {
        this.handleLeaveTextRoom(socket);
      } catch (error) {
        console.error('❌ Leave text room error:', error);
      }
    });

    socket.on('report_text_chat', async (data) => {
      try {
        await this.handleReportUser(socket, data);
      } catch (error) {
        console.error('❌ Report text chat error:', error);
        socket.emit('text_chat_error', { message: 'Failed to submit report' });
      }
    });

    socket.on('attempt_text_reconnect', () => {
      try {
        this.handleTextReconnect(socket);
      } catch (error) {
        console.error('❌ Text reconnect error:', error);
      }
    });
  }

  private static async handleFindMatch(socket: AuthenticatedSocket, data?: { mode?: string }) {
    const mode = normalizeMode(data?.mode);
    const coinCost = getCoinCostForMode(mode);

    this.updateUserModePresence(socket.userId, mode);

    let requestingUser: any = null;
    try {
      requestingUser = await DatabaseService.resetDailyCoinsIfNeeded(socket.userId!);
      if (!requestingUser) {
        requestingUser = await DatabaseService.getUserById(socket.userId!);
      }
    } catch (error) {
      console.error('⚠️ Failed to load requester for coin check:', error);
    }

    if (requestingUser && (requestingUser.coins ?? 0) < coinCost) {
      const currentCoins = requestingUser.coins ?? 0;
      console.log(`❌ User ${socket.userId} has insufficient coins (${currentCoins}) for ${mode} chat costing ${coinCost}`);
      socket.emit('insufficient-coins', {
        required: coinCost,
        current: currentCoins,
        message: 'Not enough coins to start chat. Daily refill happens automatically at 12 AM.'
      });
      return;
    }

    const storedPreferences = requestingUser?.preferences || socket.user?.preferences || {};
    const effectivePreferences = {
      ...storedPreferences,
      genderPreference: storedPreferences.genderPreference || 'any',
      interests: Array.isArray(storedPreferences.interests) ? storedPreferences.interests : []
    };
    const userGender = (requestingUser?.gender || (socket.user as any)?.gender || 'others') as 'male' | 'female' | 'others';

    const matchRequest = {
      userId: socket.userId!,
      mode,
      preferences: effectivePreferences,
      userGender,
      timestamp: Date.now()
    };

    console.log(`🔍 User ${socket.userId} looking for ${mode} chat (cost: ${coinCost})`);

    const match = await DevRedisService.findMatch(matchRequest);

    if (match) {
      const sessionMode = normalizeMode(match.mode || mode);
      const sessionCoinCost = getCoinCostForMode(sessionMode);
      console.log(`✅ CREATING SESSION: ${socket.userId} <-> ${match.userId} (${sessionMode})`);

      let user1Stats = {
        coins: requestingUser?.coins ?? 50,
        totalChats: requestingUser?.totalChats ?? 0,
        dailyChats: requestingUser?.dailyChats ?? 0
      };
      let user2Stats = {
        coins: 50,
        totalChats: 0,
        dailyChats: 0
      };

      let initiatorSpend: any = null;
      let partnerSpend: any = null;

      try {
        const partnerUser = await DatabaseService.resetDailyCoinsIfNeeded(match.userId) || await DatabaseService.getUserById(match.userId);
        const initiatorRegistered = !!requestingUser;
        const partnerRegistered = !!partnerUser;

        if (partnerUser) {
          user2Stats = {
            coins: partnerUser.coins ?? 50,
            totalChats: partnerUser.totalChats ?? 0,
            dailyChats: partnerUser.dailyChats ?? 0
          };
        }

        if (initiatorRegistered) {
          initiatorSpend = await DatabaseService.spendCoinsForMatch(socket.userId!, sessionCoinCost);
          if (!initiatorSpend?.success) {
            if (initiatorSpend?.reason === 'INSUFFICIENT_COINS') {
              const currentCoins = requestingUser?.coins ?? 0;
              socket.emit('insufficient-coins', {
                required: sessionCoinCost,
                current: currentCoins,
                message: 'Not enough coins to start chat. Daily refill happens automatically at 12 AM.'
              });
            }

            await DevRedisService.addToMatchQueue({ ...match, mode: sessionMode });
            return;
          }

          if (initiatorSpend.user) {
            requestingUser = initiatorSpend.user;
            user1Stats = {
              coins: initiatorSpend.user.coins ?? user1Stats.coins,
              totalChats: initiatorSpend.user.totalChats ?? user1Stats.totalChats + 1,
              dailyChats: initiatorSpend.user.dailyChats ?? user1Stats.dailyChats + 1
            };
          }
        }

        if (partnerRegistered) {
          partnerSpend = await DatabaseService.spendCoinsForMatch(match.userId, sessionCoinCost);

          if (!partnerSpend?.success) {
            if (initiatorSpend?.success && initiatorSpend.previous) {
              await DatabaseService.refundMatchSpend(socket.userId!, initiatorSpend.previous);
            }

            if (partnerSpend?.reason === 'INSUFFICIENT_COINS') {
              const partnerSocketId = this.connectedUsers.get(match.userId);
              const currentCoins = partnerUser?.coins ?? 0;
              if (partnerSocketId) {
                this.io.to(partnerSocketId).emit('insufficient-coins', {
                  required: sessionCoinCost,
                  current: currentCoins,
                  message: 'Not enough coins to start chat. Daily refill happens automatically at 12 AM.'
                });
              }
            }

            await DevRedisService.addToMatchQueue(matchRequest);
            socket.emit('match-retry', { message: 'Match found but partner has insufficient coins. Searching again...' });
            return;
          }

          if (partnerSpend.user) {
            user2Stats = {
              coins: partnerSpend.user.coins ?? user2Stats.coins,
              totalChats: partnerSpend.user.totalChats ?? user2Stats.totalChats + 1,
              dailyChats: partnerSpend.user.dailyChats ?? user2Stats.dailyChats + 1
            };
          }
        } else {
          console.log('⚠️ Partner user record not found - treating as guest (dev mode)');
        }
      } catch (error) {
        console.error('❌ Error during coin deduction:', error);
        if (initiatorSpend?.success && initiatorSpend.previous) {
          await DatabaseService.refundMatchSpend(socket.userId!, initiatorSpend.previous);
        }
        if (partnerSpend?.success && partnerSpend.previous) {
          await DatabaseService.refundMatchSpend(match.userId, partnerSpend.previous);
        }
        await DevRedisService.addToMatchQueue(matchRequest);
        await DevRedisService.addToMatchQueue({ ...match, mode: sessionMode });
        socket.emit('error', { message: 'Failed to process coin payment' });
        return;
      }

      if (initiatorSpend?.success && initiatorSpend.previous) {
        console.log(`💰 User ${socket.userId}: ${initiatorSpend.previous.coins} -> ${user1Stats.coins} coins | Chats: ${user1Stats.totalChats} total, ${user1Stats.dailyChats} today`);
      }
      if (partnerSpend?.success && partnerSpend.previous) {
        console.log(`💰 User ${match.userId}: ${partnerSpend.previous.coins} -> ${user2Stats.coins} coins | Chats: ${user2Stats.totalChats} total, ${user2Stats.dailyChats} today`);
      }

      const session = await DatabaseService.createChatSession({
        user1Id: socket.userId!,
        user2Id: match.userId,
        mode: sessionMode
      });

      console.log(`📋 Session created: ${session.id}`);

      this.activeSessions.set(session.id, {
        user1: socket.userId!,
        user2: match.userId,
        mode: sessionMode
      });
      this.chatTranscripts.set(session.id, []);
      console.log(`🔗 Tracked session ${session.id} between ${socket.userId} and ${match.userId} (${sessionMode})`);

      console.log(`📤 Sending match-found to ${socket.userId} (initiator) with coins: ${user1Stats.coins}`);
      socket.emit('match-found', {
        sessionId: session.id,
        matchUserId: match.userId,
        isInitiator: true,
        mode: sessionMode,
        coins: user1Stats.coins,
        totalChats: user1Stats.totalChats,
        dailyChats: user1Stats.dailyChats
      });

      // Emit stats to current socket
      socket.emit('stats-update', {
        coins: user1Stats.coins,
        totalChats: user1Stats.totalChats,
        dailyChats: user1Stats.dailyChats
      });

      // [MULTI-DEVICE FIX] Emit to ALL other devices of this user
      this.emitToAllUserDevices(socket.userId!, 'stats-update', {
        coins: user1Stats.coins,
        totalChats: user1Stats.totalChats,
        dailyChats: user1Stats.dailyChats
      });

      // Get ALL partner socket IDs for multi-device support
      const partnerSocketIds = this.connectedUsers.get(match.userId) || [];
      if (partnerSocketIds.length > 0) {
        const primarySocketId = partnerSocketIds[0]; // Use first for match-found
        console.log(`📤 Sending match-found to ${match.userId} (receiver) on ${partnerSocketIds.length} device(s) with coins: ${user2Stats.coins}`);
        this.io.to(primarySocketId).emit('match-found', {
          sessionId: session.id,
          matchUserId: socket.userId,
          isInitiator: false,
          mode: sessionMode,
          coins: user2Stats.coins,
          totalChats: user2Stats.totalChats,
          dailyChats: user2Stats.dailyChats
        });

        // [MULTI-DEVICE FIX] Emit stats to ALL partner devices
        if (partnerSpend?.success || user2Stats.coins !== 50 || user2Stats.totalChats !== 0 || user2Stats.dailyChats !== 0) {
          this.emitToAllUserDevices(match.userId, 'stats-update', {
            coins: user2Stats.coins,
            totalChats: user2Stats.totalChats,
            dailyChats: user2Stats.dailyChats
          });
        }
      } else {
        console.error(`❌ Match user ${match.userId} not connected!`);
      }
    } else {
      console.log(`⏳ No immediate match, adding ${socket.userId} to ${mode} queue`);

      await DevRedisService.addToMatchQueue(matchRequest);
      const queueStats = DevRedisService.getQueueStats();

      console.log('📊 Queue stats:', queueStats);

      socket.emit('searching', {
        position: queueStats.queues[mode] || 0,
        totalWaiting: queueStats.totalWaiting,
        mode
      });
    }
  }

  private static async handleStartMatching(socket: AuthenticatedSocket, preferences: any) {
    const mode = normalizeMode(preferences.mode);
    const coinCost = getCoinCostForMode(mode);

    this.updateUserModePresence(socket.userId, mode);

    let requestingUser: any = null;
    try {
      requestingUser = await DatabaseService.resetDailyCoinsIfNeeded(socket.userId!);
      if (!requestingUser) {
        requestingUser = await DatabaseService.getUserById(socket.userId!);
      }
    } catch (error) {
      console.error('⚠️ Failed to load requester for legacy matching:', error);
    }

    if (requestingUser && (requestingUser.coins ?? 0) < coinCost) {
      const currentCoins = requestingUser.coins ?? 0;
      socket.emit('insufficient-coins', {
        required: coinCost,
        current: currentCoins,
        message: 'Not enough coins to start chat. Daily refill happens automatically at 12 AM.'
      });
      return;
    }

    const storedPreferences = requestingUser?.preferences || socket.user?.preferences || {};
    const requestedPreferences = preferences || {};
    const effectivePreferences = {
      ...storedPreferences,
      ...requestedPreferences,
      genderPreference: requestedPreferences.genderPreference || storedPreferences.genderPreference || 'any',
      interests: Array.isArray(requestedPreferences.interests)
        ? requestedPreferences.interests
        : Array.isArray(storedPreferences.interests)
        ? storedPreferences.interests
        : [],
    };
    const userGender = (requestingUser?.gender || (socket.user as any)?.gender || 'others') as 'male' | 'female' | 'others';

    const matchRequest = {
      userId: socket.userId!,
      mode,
      preferences: effectivePreferences,
      userGender,
      timestamp: Date.now()
    };

    const match = await DevRedisService.findMatch(matchRequest);

    if (match) {
      const sessionMode = normalizeMode(match.mode || mode);
      const sessionCoinCost = getCoinCostForMode(sessionMode);
      let user1Stats = {
        coins: requestingUser?.coins ?? 50,
        totalChats: requestingUser?.totalChats ?? 0,
        dailyChats: requestingUser?.dailyChats ?? 0
      };
      let user2Stats = {
        coins: 50,
        totalChats: 0,
        dailyChats: 0
      };

      let initiatorSpend: any = null;
      let partnerSpend: any = null;

      try {
        const partnerUser = await DatabaseService.resetDailyCoinsIfNeeded(match.userId) || await DatabaseService.getUserById(match.userId);
        const initiatorRegistered = !!requestingUser;
        const partnerRegistered = !!partnerUser;

        if (partnerUser) {
          user2Stats = {
            coins: partnerUser.coins ?? 50,
            totalChats: partnerUser.totalChats ?? 0,
            dailyChats: partnerUser.dailyChats ?? 0
          };
        }

        if (initiatorRegistered) {
          initiatorSpend = await DatabaseService.spendCoinsForMatch(socket.userId!, sessionCoinCost);
          if (!initiatorSpend?.success) {
            if (initiatorSpend?.reason === 'INSUFFICIENT_COINS') {
              const currentCoins = requestingUser?.coins ?? 0;
              socket.emit('insufficient-coins', {
                required: sessionCoinCost,
                current: currentCoins,
                message: 'Not enough coins to start chat. Daily refill happens automatically at 12 AM.'
              });
            }

            await DevRedisService.addToMatchQueue({ ...match, mode: sessionMode });
            return;
          }

          if (initiatorSpend.user) {
            requestingUser = initiatorSpend.user;
            user1Stats = {
              coins: initiatorSpend.user.coins ?? user1Stats.coins,
              totalChats: initiatorSpend.user.totalChats ?? user1Stats.totalChats + 1,
              dailyChats: initiatorSpend.user.dailyChats ?? user1Stats.dailyChats + 1
            };
          }
        }

        if (partnerRegistered) {
          partnerSpend = await DatabaseService.spendCoinsForMatch(match.userId, sessionCoinCost);

          if (!partnerSpend?.success) {
            if (initiatorSpend?.success && initiatorSpend.previous) {
              await DatabaseService.refundMatchSpend(socket.userId!, initiatorSpend.previous);
            }

            if (partnerSpend?.reason === 'INSUFFICIENT_COINS') {
              const partnerSocketId = this.connectedUsers.get(match.userId);
              const currentCoins = partnerUser?.coins ?? 0;
              if (partnerSocketId) {
                this.io.to(partnerSocketId).emit('insufficient-coins', {
                  required: sessionCoinCost,
                  current: currentCoins,
                  message: 'Not enough coins to start chat. Daily refill happens automatically at 12 AM.'
                });
              }
            }

            await DevRedisService.addToMatchQueue(matchRequest);
            socket.emit('match-retry', { message: 'Match found but partner has insufficient coins. Searching again...' });
            return;
          }

          if (partnerSpend.user) {
            user2Stats = {
              coins: partnerSpend.user.coins ?? user2Stats.coins,
              totalChats: partnerSpend.user.totalChats ?? user2Stats.totalChats + 1,
              dailyChats: partnerSpend.user.dailyChats ?? user2Stats.dailyChats + 1
            };
          }
        } else {
          console.log('⚠️ Partner user record not found - treating as guest (dev mode)');
        }
      } catch (err) {
        console.error('❌ Error during coin deduction (startMatching):', err);
        if (initiatorSpend?.success && initiatorSpend.previous) {
          await DatabaseService.refundMatchSpend(socket.userId!, initiatorSpend.previous);
        }
        if (partnerSpend?.success && partnerSpend.previous) {
          await DatabaseService.refundMatchSpend(match.userId, partnerSpend.previous);
        }
        await DevRedisService.addToMatchQueue(matchRequest);
        await DevRedisService.addToMatchQueue({ ...match, mode: sessionMode });
        socket.emit('error', { message: 'Failed to process coin payment' });
        return;
      }

      if (initiatorSpend?.success && initiatorSpend.previous) {
        console.log(`💰 User ${socket.userId}: ${initiatorSpend.previous.coins} -> ${user1Stats.coins} coins | Chats: ${user1Stats.totalChats} total, ${user1Stats.dailyChats} today`);
      }
      if (partnerSpend?.success && partnerSpend.previous) {
        console.log(`💰 User ${match.userId}: ${partnerSpend.previous.coins} -> ${user2Stats.coins} coins | Chats: ${user2Stats.totalChats} total, ${user2Stats.dailyChats} today`);
      }

      const session = await DatabaseService.createChatSession({
        user1Id: socket.userId!,
        user2Id: match.userId,
        mode: sessionMode
      });

      this.activeSessions.set(session.id, {
        user1: socket.userId!,
        user2: match.userId,
        mode: sessionMode
      });
      this.chatTranscripts.set(session.id, []);

      const initiatorPayload = {
        sessionId: session.id,
        matchUserId: match.userId,
        isInitiator: true,
        mode: sessionMode,
        coins: user1Stats.coins,
        totalChats: user1Stats.totalChats,
        dailyChats: user1Stats.dailyChats
      };

      const partnerPayload = {
        sessionId: session.id,
        matchUserId: socket.userId!,
        isInitiator: false,
        mode: sessionMode,
        coins: user2Stats.coins,
        totalChats: user2Stats.totalChats,
        dailyChats: user2Stats.dailyChats
      };

      socket.emit('match-found', initiatorPayload);
      socket.emit('match_found', { ...session, ...initiatorPayload } as any);
      
      // Emit stats to current socket
      socket.emit('stats-update', {
        coins: user1Stats.coins,
        totalChats: user1Stats.totalChats,
        dailyChats: user1Stats.dailyChats
      });

      // [MULTI-DEVICE FIX] Emit to ALL other devices of this user
      this.emitToAllUserDevices(socket.userId!, 'stats-update', {
        coins: user1Stats.coins,
        totalChats: user1Stats.totalChats,
        dailyChats: user1Stats.dailyChats
      });

      // Get ALL partner socket IDs for multi-device support
      const partnerSocketIds = this.connectedUsers.get(match.userId) || [];
      if (partnerSocketIds.length > 0) {
        const primarySocketId = partnerSocketIds[0]; // Use first for match-found
        this.io.to(primarySocketId).emit('match-found', partnerPayload);
        this.io.to(primarySocketId).emit('match_found', { ...session, ...partnerPayload } as any);
        
        // [MULTI-DEVICE FIX] Emit stats to ALL partner devices
        this.emitToAllUserDevices(match.userId, 'stats-update', {
          coins: user2Stats.coins,
          totalChats: user2Stats.totalChats,
          dailyChats: user2Stats.dailyChats
        });
      }
    } else {
      await DevRedisService.addToMatchQueue(matchRequest);
      socket.emit('matching_started');
    }
  }

  private static async handleStopMatching(socket: AuthenticatedSocket) {
    // Remove from all queues
    await DevRedisService.removeFromMatchQueue(socket.userId!, 'text');
    await DevRedisService.removeFromMatchQueue(socket.userId!, 'audio');
    await DevRedisService.removeFromMatchQueue(socket.userId!, 'video');
    this.updateUserModePresence(socket.userId, null);
    
    socket.emit('matching_stopped');
  }

  private static async handleChatMessage(socket: AuthenticatedSocket, data: any) {
    const { sessionId, content, type, replyTo } = data;

    console.log(`💬 Chat message from ${socket.userId}:`, { sessionId, content, type, replyTo });
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
    console.log(`📎 Reply context:`, replyTo);

    if (otherSocketId) {
      this.io.to(otherSocketId).emit('chat_message', {
        sessionId,
        content,
        type,
        timestamp: Date.now(),
        fromUserId: socket.userId,
        ...(replyTo && { replyTo }) // Forward reply context if present
      });
      console.log(`✅ Message forwarded successfully with reply context:`, !!replyTo);
    } else {
      console.log(`❌ Other user ${otherUserId} not connected`);
    }

    const transcript = this.chatTranscripts.get(sessionId) || [];
    transcript.push({
      senderId: socket.userId!,
      content,
      type,
      timestamp: Date.now(),
      ...(replyTo ? { replyTo } : {})
    });
    if (!this.chatTranscripts.has(sessionId)) {
      this.chatTranscripts.set(sessionId, transcript);
    }
  }

  private static handleTyping(socket: AuthenticatedSocket, data: any) {
    const { sessionId, isTyping } = data;
    
    console.log(`⌨️ Typing event from ${socket.userId}:`, { sessionId, isTyping });
    
    // Find the active session
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.log(`❌ No active session found for typing indicator: ${sessionId}`);
      return;
    }

    // Determine the partner (other user in the session)
    const otherUserId = session.user1 === socket.userId ? session.user2 : session.user1;
    const otherSocketId = this.connectedUsers.get(otherUserId);

    console.log(`⌨️ Forwarding typing indicator to partner ${otherUserId} (socket: ${otherSocketId})`);

    if (otherSocketId) {
      this.io.to(otherSocketId).emit('typing', {
        sessionId,
        userId: socket.userId,
        isTyping
      });
      console.log(`✅ Typing indicator forwarded: ${isTyping}`);
    } else {
      console.log(`❌ Partner ${otherUserId} not connected for typing indicator`);
    }
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

    // FIX: MongoDB uses camelCase (user1Id, user2Id), not snake_case (user1_id, user2_id)
    const reportedUserId = (session.user1Id === socket.userId || session.user1_id === socket.userId) 
      ? (session.user2Id || session.user2_id) 
      : (session.user1Id || session.user1_id);

    console.log('🚨 Report User:', {
      sessionId,
      reporterUserId: socket.userId,
      reportedUserId,
      session: {
        user1Id: session.user1Id,
        user2Id: session.user2Id,
        user1_id: session.user1_id,
        user2_id: session.user2_id
      }
    });

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

    await SocketService.captureReportedSession(
      sessionId,
      socket.userId!,
      reportedUserId,
      session.mode || (this.activeSessions.get(sessionId)?.mode)
    );

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

    this.chatTranscripts.delete(sessionId);
  }

  // Utility methods
  private static async getSessionById(sessionId: string) {
    // Use getChatSession instead of raw SQL query (works with both MongoDB and PostgreSQL)
    return await DatabaseService.getChatSession(sessionId);
  }

  static async captureReportedSession(
    sessionId: string,
    reporterUserId: string,
    reportedUserId: string,
    mode?: string | null
  ) {
    try {
      const bufferedMessages = this.chatTranscripts.get(sessionId) || [];
      const reporter = reporterUserId ? await DatabaseService.getUserById(reporterUserId) : null;
      const reported = reportedUserId ? await DatabaseService.getUserById(reportedUserId) : null;

      await DatabaseService.saveReportedChatTranscript({
        sessionId,
        reporterUserId,
        reporterEmail: reporter?.email || null,
        reportedUserId,
        reportedEmail: reported?.email || null,
        mode: mode || this.activeSessions.get(sessionId)?.mode,
        messages: bufferedMessages.map((msg) => ({
          senderId: msg.senderId,
          content: msg.content,
          type: msg.type,
          timestamp: msg.timestamp,
          ...(msg.replyTo ? { replyTo: msg.replyTo } : {})
        }))
      });
    } catch (error) {
      console.error('❌ Failed to persist reported chat transcript:', {
        sessionId,
        error
      });
    } finally {
      this.chatTranscripts.delete(sessionId);
    }
  }

  static async sendModerationWarning(userId: string, message: string) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('moderation_warning', { message });
    }
  }

  static async banUser(userId: string) {
    const socketIds = this.connectedUsers.get(userId) || [];
    socketIds.forEach(socketId => {
      this.io.to(socketId).emit('user_banned');
      this.io.sockets.sockets.get(socketId)?.disconnect(true);
    });
  }

  static getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  static getModePresenceSnapshot() {
    return {
      text: this.modePresence.text.size,
      audio: this.modePresence.audio.size,
      video: this.modePresence.video.size
    };
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

  // ==================== TEXT CHAT HANDLERS ====================

  private static async handleJoinTextQueue(socket: AuthenticatedSocket) {
    if (!socket.userId) {
      socket.emit('text_chat_error', { message: 'Authentication required' });
      return;
    }

    console.log(`💬 User ${socket.userId} joining text chat queue`);

    // Add to queue
    const result = await TextChatQueueService.joinQueue({
      userId: socket.userId,
      socketId: socket.id,
      guestId: socket.user?.guestId,
      joinedAt: Date.now()
    });

    // Emit queue position
    socket.emit('text_queue_joined', {
      position: result.position,
      estimatedWaitTime: result.estimatedWaitTime
    });

    // Check for match
    const room = TextChatQueueService.getRoomForUser(socket.userId);
    if (room) {
      // Match found!
      const partner = TextChatQueueService.getPartner(room.roomId, socket.userId);
      if (!partner) return;

      console.log(`✅ Text match found: ${socket.userId} <-> ${partner.userId} in room ${room.roomId}`);

      // Emit to both users
      socket.emit('text_match_found', {
        roomId: room.roomId,
        partnerId: partner.userId
      });

      this.io.to(partner.socketId).emit('text_match_found', {
        roomId: room.roomId,
        partnerId: socket.userId
      });

      // Update activity
      TextChatQueueService.updateActivity(room.roomId);
    }
  }

  private static handleLeaveTextQueue(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    console.log(`💬 User ${socket.userId} leaving text chat queue`);
    const removed = TextChatQueueService.leaveQueue(socket.userId);

    if (removed) {
      socket.emit('text_queue_left');
    }
  }

  private static async handleSendTextMessage(socket: AuthenticatedSocket, data: { content: string }) {
    if (!socket.userId) {
      socket.emit('text_chat_error', { message: 'Authentication required' });
      return;
    }

    const { content } = data;

    // Validate message
    if (!content || typeof content !== 'string') {
      socket.emit('text_chat_error', { message: 'Invalid message content' });
      return;
    }

    if (content.length > 1000) {
      socket.emit('text_chat_error', { message: 'Message too long (max 1000 characters)' });
      return;
    }

    // Get room
    const room = TextChatQueueService.getRoomForUser(socket.userId);
    if (!room) {
      socket.emit('text_chat_error', { message: 'No active text chat room' });
      return;
    }

    // Create message
    const message: TextChatMessage = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId: room.roomId,
      senderId: socket.userId,
      content: content.trim(),
      timestamp: Date.now(),
      delivered: false
    };

    // Add to room with rate limiting
    const result = TextChatRoomService.addMessage(room, message);
    if (!result.success) {
      socket.emit('rate_limit_exceeded', {
        message: result.error,
        remaining: result.remaining
      });
      return;
    }

    // Mark as delivered
    message.delivered = true;

    // Get partner
    const partner = TextChatQueueService.getPartner(room.roomId, socket.userId);
    if (!partner) {
      socket.emit('text_chat_error', { message: 'Partner not found' });
      return;
    }

    console.log(`💬 Message in room ${room.roomId}: ${socket.userId} -> ${partner.userId}`);

    // Emit to both users
    socket.emit('text_message_received', message);
    this.io.to(partner.socketId).emit('text_message_received', message);

    // Update activity
    TextChatQueueService.updateActivity(room.roomId);

    // Clear partner's typing state
    TextChatRoomService.setTyping(room.roomId, socket.userId, false);
  }

  private static handleTextTyping(socket: AuthenticatedSocket, data: any, isTyping: boolean) {
    if (!socket.userId) return;

    // Get room
    const room = TextChatQueueService.getRoomForUser(socket.userId);
    if (!room) return;

    // Update typing state
    TextChatRoomService.setTyping(room.roomId, socket.userId, isTyping);

    // Get partner
    const partner = TextChatQueueService.getPartner(room.roomId, socket.userId);
    if (!partner) return;

    // Emit to partner
    const typingEvent: TypingEvent = {
      roomId: room.roomId,
      userId: socket.userId,
      isTyping,
      timestamp: Date.now()
    };

    this.io.to(partner.socketId).emit(isTyping ? 'text_partner_typing' : 'text_partner_stopped_typing', typingEvent);
  }

  private static handleLeaveTextRoom(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    console.log(`💬 User ${socket.userId} leaving text chat room`);

    // Get room
    const room = TextChatQueueService.getRoomForUser(socket.userId);
    if (!room) return;

    // Get partner
    const partner = TextChatQueueService.getPartner(room.roomId, socket.userId);

    // End room
    TextChatQueueService.endRoom(room.roomId, 'user_left');
    TextChatRoomService.cleanupRoom(room);

    // Notify users
    socket.emit('text_room_ended', { reason: 'user_left' });
    if (partner) {
      this.io.to(partner.socketId).emit('text_room_ended', { reason: 'partner_left' });
    }

    console.log(`💬 Text room ${room.roomId} ended`);
  }

  private static handleTextReconnect(socket: AuthenticatedSocket) {
    if (!socket.userId) {
      socket.emit('text_chat_error', { message: 'Authentication required' });
      return;
    }

    console.log(`🔄 Attempting text chat reconnect for user ${socket.userId}`);

    const reconnectResult = TextChatQueueService.attemptReconnect(socket.userId, socket.id);

    if (reconnectResult.success && reconnectResult.roomId && reconnectResult.partnerId) {
      console.log(`✅ Text chat reconnected: ${socket.userId} to room ${reconnectResult.roomId}`);

      // Emit reconnection success with room state
      socket.emit('text_reconnected', {
        roomId: reconnectResult.roomId,
        partnerId: reconnectResult.partnerId,
        messages: reconnectResult.messages || []
      });

      // Notify partner
      const room = TextChatQueueService.getRoom(reconnectResult.roomId);
      if (room) {
        const partner = TextChatQueueService.getPartner(reconnectResult.roomId, socket.userId);
        if (partner) {
          this.io.to(partner.socketId).emit('text_partner_reconnected', {
            partnerId: socket.userId
          });
        }
      }
    } else {
      console.log(`💬 Text chat reconnect failed for ${socket.userId}`);
      socket.emit('text_reconnect_failed', {
        reason: 'Session expired or room no longer exists'
      });
    }
  }

  // Audio quality metrics handler
  private static handleAudioMetrics(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId) return;

    const { sessionId, eventType, packetLoss, jitter, bitrate, roundTripTime, timestamp, error } = data;

    // Log quality metrics
    if (eventType) {
      console.log(`🎤 Audio Event [${sessionId}]: ${eventType}`, {
        userId: socket.userId,
        timestamp: timestamp || Date.now(),
        error: error || 'none'
      });

      // Log specific events
      switch (eventType) {
        case 'call_connected':
          console.log(`✅ Audio call connected: User ${socket.userId} in session ${sessionId}`);
          break;
        case 'mic_permission_granted':
          console.log(`🎤 Mic permission granted: User ${socket.userId}`);
          break;
        case 'mic_permission_denied':
          console.log(`🚫 Mic permission denied: User ${socket.userId}, Error: ${error}`);
          break;
        case 'call_failed':
          console.log(`❌ Audio call failed: User ${socket.userId}, Error: ${error}`);
          break;
      }
    } else {
      // Regular quality metrics
      console.log(`📊 Audio Quality [${sessionId}]:`, {
        userId: socket.userId,
        packetLoss: packetLoss?.toFixed(2) + '%',
        jitter: jitter?.toFixed(2) + 'ms',
        bitrate: bitrate + ' kbps',
        rtt: roundTripTime?.toFixed(2) + 'ms'
      });

      // Log warning for poor quality
      if (packetLoss > 10) {
        console.warn(`⚠️ High packet loss (${packetLoss.toFixed(1)}%) for user ${socket.userId} in session ${sessionId}`);
      }
    }
  }

  // Audio muted event handler
  private static handleAudioMuted(socket: AuthenticatedSocket, data: any) {
    if (!socket.userId) return;

    const { sessionId, isMuted, timestamp } = data;

    console.log(`🔇 Audio mute status: User ${socket.userId} ${isMuted ? 'muted' : 'unmuted'} in session ${sessionId}`);

    // Find partner and notify
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const partnerId = session.user1 === socket.userId ? session.user2 : session.user1;
      
      // Emit to all partner devices
      this.emitToAllUserDevices(partnerId, 'audio-muted', {
        isMuted,
        timestamp: timestamp || Date.now()
      });

      console.log(`✅ Notified partner ${partnerId} about mute status: ${isMuted}`);
    }
  }
}

