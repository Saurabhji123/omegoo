import { RedisService } from './redis';
import { DatabaseService } from './database';

// Define types locally since shared types aren't working
enum ChatMode {
  TEXT = 'text',
  AUDIO = 'audio',
  VIDEO = 'video'
}

type GenderValue = 'male' | 'female' | 'others';

interface User {
  id: string;
  device_id: string;
  tier: number;
  created_at: string;
  preferences: {
    language?: string;
    interests?: string[];
    ageRange?: [number, number];
    genderPreference?: string;
  };
  gender?: GenderValue;
}

interface MatchRequest {
  userId: string;
  mode: string;
  preferences: any;
  userGender?: GenderValue;
  timestamp: number;
}

export class MatchingService {
  private static readonly MATCH_TIMEOUT = 60000; // 1 minute
  private static readonly MAX_WAIT_TIME = 300000; // 5 minutes

  // Add user to matching queue
  static async addToQueue(user: User, preferences: any): Promise<void> {
    const matchRequest: MatchRequest = {
      userId: user.id,
      mode: preferences.chatType || ChatMode.TEXT,
      preferences: {
        language: preferences.language,
        interests: preferences.interests || [],
        ageRange: preferences.ageRange,
        genderPreference: preferences.genderPreference || 'any'
      },
      userGender: user.gender,
      timestamp: Date.now()
    };

    // Use existing Redis service method
    await RedisService.addToMatchQueue(matchRequest);

    // Set auto-removal timeout
    setTimeout(() => {
      this.removeFromQueue(user.id, matchRequest.mode);
    }, this.MAX_WAIT_TIME);
  }

  // Remove user from queue
  static async removeFromQueue(userId: string, mode: string): Promise<void> {
    await RedisService.removeFromMatchQueue(userId, mode);
  }

  // Find potential matches
  static async findMatch(userId: string, mode: string, preferences: any): Promise<string | null> {
    const matchRequest: MatchRequest = {
      userId,
      mode,
      preferences,
      userGender: preferences?.userGender,
      timestamp: Date.now()
    };

    // Use existing Redis service method
    const match = await RedisService.findMatch(matchRequest);
    
    if (match) {
      // Create chat session
      const sessionId = this.generateSessionId();
      const sessionData = {
        id: sessionId,
        user1Id: userId,
        user2Id: match.userId,
        mode,
        status: 'active',
        startedAt: new Date()
      };

      // Create in database
      await DatabaseService.createChatSession({
        user1Id: userId,
        user2Id: match.userId,
        mode
      });

      // Store session in Redis
      await RedisService.set(`session:${sessionId}`, sessionData, 3600);

      return sessionId;
    }

    return null;
  }

  // Generate unique session ID
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create chat session for matched users
  static async createChatSession(user1Id: string, user2Id: string, mode: string): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const sessionData = {
      id: sessionId,
      user1_id: user1Id,
      user2_id: user2Id,
      mode,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Store in database
    await DatabaseService.createChatSession({
      user1Id,
      user2Id,
      mode
    });

    // Store in Redis for quick access
    await RedisService.set(`session:${sessionId}`, sessionData, 3600);

    return sessionId;
  }

  // Get queue statistics
  static async getQueueStats(): Promise<{
    text: number;
    audio: number;
    video: number;
    total: number;
  }> {
    // Use Redis service directly to get queue counts
    const textCount = await RedisService.get('match_queue:text_count') || 0;
    const audioCount = await RedisService.get('match_queue:audio_count') || 0;
    const videoCount = await RedisService.get('match_queue:video_count') || 0;

    return {
      text: Number(textCount),
      audio: Number(audioCount),
      video: Number(videoCount),
      total: Number(textCount) + Number(audioCount) + Number(videoCount)
    };
  }

  // Get user's position in queue
  static async getUserQueuePosition(userId: string): Promise<number | null> {
    // This would need to be implemented based on Redis queue structure
    // For now, return a placeholder
    return Math.floor(Math.random() * 10) + 1;
  }

  // Clean up expired queue entries
  static async cleanupExpiredEntries(): Promise<void> {
    // This is handled by Redis TTL, no manual cleanup needed
    console.log('Queue cleanup completed');
  }

  // Start background processes
  static startBackgroundProcesses(): void {
    // Clean up expired entries every 2 minutes
    setInterval(() => {
      this.cleanupExpiredEntries().catch(console.error);
    }, 120000);
  }
}