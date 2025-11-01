import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { DatabaseService, RedisService } from './serviceFactory';
import { RedisService as DevRedisService } from './redis-dev';

type ChatMode = 'text' | 'audio' | 'video';

const VALID_CHAT_MODES: ChatMode[] = ['text', 'audio', 'video'];
const CHAT_MODE_COSTS: Record<ChatMode, number> = {
  text: 1,
  audio: 2,
  video: 3
};

const normalizeMode = (mode?: string): ChatMode => {
  if (mode && VALID_CHAT_MODES.includes(mode as ChatMode)) {
    return mode as ChatMode;
  }
  return 'video';
};

const getCoinCostForMode = (mode?: string): number => CHAT_MODE_COSTS[normalizeMode(mode)];

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export class SocketService {
  private static io: SocketIOServer;
  private static connectedUsers = new Map<string, string>(); // userId -> socketId
  private static waitingQueue: string[] = []; // For in-memory queue management
  private static activeSessions = new Map<string, { user1: string; user2: string; mode: string }>(); // sessionId -> users + mode
  private static disconnectionTimers = new Map<string, NodeJS.Timeout>(); // userId -> timer for delayed cleanup

  static initialize(io: SocketIOServer) {
    this.io = io;

    // Authentication middleware - check JWT token first
    io.use(async (socket: AuthenticatedSocket, next) => {
      console.log(`🔐 Socket auth attempt from: ${socket.handshake.address} with origin: ${socket.handshake.headers.origin}`);
      const token = socket.handshake.auth.token;
      console.log(`🔑 Token received: ${token ? 'YES' : 'NO'}`);
      
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
      
      // Fallback: Create guest user for development/testing
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
      console.log(`🔓 Guest user created: ${guestId}`);
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
      
      // Set user online status in Redis and Database
      DevRedisService.setUserOnline(socket.userId!);
      
      // Update user's isOnline status in database
      await DatabaseService.setUserOnlineStatus(socket.userId!, true);
      console.log(`✅ User ${socket.userId} marked as online in database`);

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
                partnerSocket.emit('session_ended', { reason: 'partner_left' });
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
    const mode = normalizeMode(data?.mode);
    const coinCost = getCoinCostForMode(mode);

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

    const matchRequest = {
      userId: socket.userId!,
      mode,
      preferences: {},
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

      socket.emit('stats-update', {
        coins: user1Stats.coins,
        totalChats: user1Stats.totalChats,
        dailyChats: user1Stats.dailyChats
      });

      const matchSocketId = this.connectedUsers.get(match.userId);
      if (matchSocketId) {
        console.log(`📤 Sending match-found to ${match.userId} (receiver) with coins: ${user2Stats.coins}`);
        this.io.to(matchSocketId).emit('match-found', {
          sessionId: session.id,
          matchUserId: socket.userId,
          isInitiator: false,
          mode: sessionMode,
          coins: user2Stats.coins,
          totalChats: user2Stats.totalChats,
          dailyChats: user2Stats.dailyChats
        });

        if (partnerSpend?.success || user2Stats.coins !== 50 || user2Stats.totalChats !== 0 || user2Stats.dailyChats !== 0) {
          this.io.to(matchSocketId).emit('stats-update', {
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

    const matchRequest = {
      userId: socket.userId!,
      mode,
      preferences,
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
      socket.emit('stats-update', {
        coins: user1Stats.coins,
        totalChats: user1Stats.totalChats,
        dailyChats: user1Stats.dailyChats
      });

      const matchSocketId = this.connectedUsers.get(match.userId);
      if (matchSocketId) {
        this.io.to(matchSocketId).emit('match-found', partnerPayload);
        this.io.to(matchSocketId).emit('match_found', { ...session, ...partnerPayload } as any);
        this.io.to(matchSocketId).emit('stats-update', {
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

    // Store message (if needed for evidence)
    // await this.storeMessage(sessionId, socket.userId!, content);
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
    // Use getChatSession instead of raw SQL query (works with both MongoDB and PostgreSQL)
    return await DatabaseService.getChatSession(sessionId);
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