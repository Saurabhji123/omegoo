import axios from 'axios';

interface ModerationResult {
  safe: boolean;
  score: number;
  categories: {
    nudity?: number;
    explicit?: number;
    violence?: number;
    inappropriate?: number;
    spam?: number;
  };
  action: 'allow' | 'warn' | 'block' | 'ban';
}

interface FrameData {
  imageData: string; // base64 encoded
  sessionId: string;
  userId: string;
  timestamp: number;
}

interface AudioData {
  audioData: string; // base64 encoded
  sessionId: string;
  userId: string;
  duration: number;
  timestamp: number;
}

export class ModerationService {
  private static readonly NUDITY_THRESHOLD = 0.7;
  private static readonly EXPLICIT_THRESHOLD = 0.8;
  private static readonly VIOLENCE_THRESHOLD = 0.75;
  private static readonly SPAM_THRESHOLD = 0.6;

  // Sightengine API for image moderation
  static async moderateImage(frameData: FrameData): Promise<ModerationResult> {
    try {
      if (!process.env.SIGHTENGINE_API_USER || !process.env.SIGHTENGINE_API_SECRET) {
        return this.createFallbackResult();
      }

      const response = await axios.post('https://api.sightengine.com/1.0/check.json', {
        media: frameData.imageData,
        models: 'nudity,wad,offensive,scam,celebrity',
        api_user: process.env.SIGHTENGINE_API_USER,
        api_secret: process.env.SIGHTENGINE_API_SECRET
      });

      const data = response.data;
      
      const result: ModerationResult = {
        safe: true,
        score: 0,
        categories: {
          nudity: data.nudity?.safe || 0,
          explicit: data.wad?.safe || 0,
          violence: data.offensive?.safe || 0,
          inappropriate: data.scam?.safe || 0
        },
        action: 'allow'
      };

      // Calculate overall risk score
      result.score = Math.max(
        1 - (data.nudity?.safe || 1),
        1 - (data.wad?.safe || 1),
        1 - (data.offensive?.safe || 1),
        1 - (data.scam?.safe || 1)
      );

      // Determine action based on thresholds
      if (result.score >= this.EXPLICIT_THRESHOLD) {
        result.safe = false;
        result.action = 'ban';
      } else if (result.score >= this.NUDITY_THRESHOLD) {
        result.safe = false;
        result.action = 'block';
      } else if (result.score >= 0.5) {
        result.action = 'warn';
      }

      return result;
    } catch (error) {
      console.error('Image moderation error:', error);
      return this.createFallbackResult();
    }
  }

  // AssemblyAI for audio moderation
  static async moderateAudio(audioData: AudioData): Promise<ModerationResult> {
    try {
      if (!process.env.ASSEMBLYAI_API_KEY) {
        return this.createFallbackResult();
      }

      // Upload audio for transcription
      const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', 
        Buffer.from(audioData.audioData, 'base64'),
        {
          headers: {
            'authorization': process.env.ASSEMBLYAI_API_KEY,
            'content-type': 'application/octet-stream'
          }
        }
      );

      // Request transcription with content safety
      const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
        audio_url: uploadResponse.data.upload_url,
        content_safety: true,
        auto_chapters: false
      }, {
        headers: {
          'authorization': process.env.ASSEMBLYAI_API_KEY
        }
      });

      // Poll for completion
      const transcriptId = transcriptResponse.data.id;
      let transcript = await this.pollTranscription(transcriptId);

      const result: ModerationResult = {
        safe: true,
        score: 0,
        categories: {},
        action: 'allow'
      };

      if (transcript.content_safety) {
        const safety = transcript.content_safety;
        result.score = Math.max(
          safety.severity_score_summary?.high || 0,
          safety.severity_score_summary?.medium || 0
        );

        if (result.score >= 0.8) {
          result.safe = false;
          result.action = 'ban';
        } else if (result.score >= 0.6) {
          result.safe = false;
          result.action = 'block';
        } else if (result.score >= 0.4) {
          result.action = 'warn';
        }
      }

      return result;
    } catch (error) {
      console.error('Audio moderation error:', error);
      return this.createFallbackResult();
    }
  }

  // Text moderation using keyword detection and patterns
  static moderateText(text: string): ModerationResult {
    const result: ModerationResult = {
      safe: true,
      score: 0,
      categories: {
        spam: 0,
        inappropriate: 0
      },
      action: 'allow'
    };

    // Explicit content keywords
    const explicitKeywords = [
      'fuck', 'shit', 'bitch', 'dick', 'pussy', 'cock', 'cum',
      'masturbate', 'orgasm', 'sex', 'porn', 'nude', 'naked'
    ];

    // Harassment keywords
    const harassmentKeywords = [
      'kill yourself', 'die', 'hate you', 'stupid', 'ugly', 'fat',
      'retard', 'loser', 'idiot', 'worthless'
    ];

    // Spam patterns
    const spamPatterns = [
      /(.)\1{4,}/, // Repeated characters
      /https?:\/\/[^\s]+/gi, // URLs
      /\b\d{10,}\b/, // Phone numbers
      /telegram|whatsapp|instagram|snapchat/gi, // Social media
      /buy|sell|money|cash|payment/gi // Commercial
    ];

    const lowerText = text.toLowerCase();
    let score = 0;

    // Check explicit content
    const explicitMatches = explicitKeywords.filter(word => lowerText.includes(word));
    if (explicitMatches.length > 0) {
      score += explicitMatches.length * 0.3;
      result.categories.inappropriate = explicitMatches.length * 0.3;
    }

    // Check harassment
    const harassmentMatches = harassmentKeywords.filter(word => lowerText.includes(word));
    if (harassmentMatches.length > 0) {
      score += harassmentMatches.length * 0.4;
      result.categories.inappropriate = Math.max(
        result.categories.inappropriate || 0,
        harassmentMatches.length * 0.4
      );
    }

    // Check spam patterns
    const spamMatches = spamPatterns.filter(pattern => pattern.test(text));
    if (spamMatches.length > 0) {
      score += spamMatches.length * 0.25;
      result.categories.spam = spamMatches.length * 0.25;
    }

    result.score = Math.min(score, 1);

    // Determine action
    if (result.score >= 0.8) {
      result.safe = false;
      result.action = 'ban';
    } else if (result.score >= 0.6) {
      result.safe = false;
      result.action = 'block';
    } else if (result.score >= 0.3) {
      result.action = 'warn';
    }

    return result;
  }

  // Real-time frame sampling for video chat
  static async startFrameSampling(sessionId: string, userId: string): Promise<void> {
    // This would be called from the frontend video stream
    // Sample frames every 2 seconds and send for moderation
    const samplingInterval = setInterval(async () => {
      try {
        // This would capture frame from video element
        // const frameData = captureVideoFrame(videoElement);
        // const result = await this.moderateImage({
        //   imageData: frameData,
        //   sessionId,
        //   userId,
        //   timestamp: Date.now()
        // });
        
        // Handle moderation result
        // if (!result.safe) {
        //   await this.handleModerationViolation(sessionId, userId, result);
        // }
      } catch (error) {
        console.error('Frame sampling error:', error);
      }
    }, 2000);

    // Store interval ID for cleanup
    await this.storeFrameSamplingInterval(sessionId, samplingInterval);
  }

  // Stop frame sampling
  static async stopFrameSampling(sessionId: string): Promise<void> {
    const intervalId = await this.getFrameSamplingInterval(sessionId);
    if (intervalId) {
      clearInterval(intervalId);
      await this.clearFrameSamplingInterval(sessionId);
    }
  }

  // Handle moderation violations
  static async handleModerationViolation(
    sessionId: string, 
    userId: string, 
    result: ModerationResult
  ): Promise<void> {
    // Log the violation
    console.log(`Moderation violation detected: User ${userId}, Session ${sessionId}`, result);

    // Store evidence in database
    // await DatabaseService.storeEvidence({
    //   sessionId,
    //   userId,
    //   violationType: this.getViolationType(result),
    //   score: result.score,
    //   categories: result.categories,
    //   timestamp: new Date(),
    //   action: result.action
    // });

    // Take action based on severity
    switch (result.action) {
      case 'warn':
        // Send warning to user
        // await NotificationService.sendWarning(userId, sessionId);
        break;
      
      case 'block':
        // End session immediately
        // await ChatService.endSession(sessionId, 'moderation_violation');
        break;
      
      case 'ban':
        // Ban user and end session
        // await UserService.banUser(userId, 'content_violation', result);
        // await ChatService.endSession(sessionId, 'user_banned');
        break;
    }
  }

  // Auto-kill session for severe violations
  static async autoKillSession(sessionId: string, reason: string): Promise<void> {
    try {
      // End the session immediately
      // await ChatService.endSession(sessionId, reason);
      
      // Notify both users
      // await NotificationService.notifySessionEnded(sessionId, reason);
      
      // Log the auto-kill event
      console.log(`Session ${sessionId} auto-killed: ${reason}`);
    } catch (error) {
      console.error('Auto-kill session error:', error);
    }
  }

  // Utility methods
  private static async pollTranscription(transcriptId: string, maxAttempts = 10): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'authorization': process.env.ASSEMBLYAI_API_KEY
        }
      });

      if (response.data.status === 'completed') {
        return response.data;
      } else if (response.data.status === 'error') {
        throw new Error('Transcription failed');
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Transcription timeout');
  }

  private static createFallbackResult(): ModerationResult {
    return {
      safe: true,
      score: 0,
      categories: {},
      action: 'allow'
    };
  }

  private static getViolationType(result: ModerationResult): string {
    if (result.categories.nudity && result.categories.nudity > 0.5) return 'nudity';
    if (result.categories.explicit && result.categories.explicit > 0.5) return 'explicit_content';
    if (result.categories.violence && result.categories.violence > 0.5) return 'violence';
    if (result.categories.spam && result.categories.spam > 0.5) return 'spam';
    return 'inappropriate_content';
  }

  private static async storeFrameSamplingInterval(sessionId: string, intervalId: NodeJS.Timeout): Promise<void> {
    // Store in Redis or memory for cleanup
    // await RedisService.set(`frame_sampling:${sessionId}`, intervalId);
  }

  private static async getFrameSamplingInterval(sessionId: string): Promise<NodeJS.Timeout | null> {
    // Retrieve from Redis or memory
    // return await RedisService.get(`frame_sampling:${sessionId}`);
    return null;
  }

  private static async clearFrameSamplingInterval(sessionId: string): Promise<void> {
    // Clear from Redis or memory
    // await RedisService.del(`frame_sampling:${sessionId}`);
  }
}