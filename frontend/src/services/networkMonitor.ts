/**
 * Network Quality Monitor
 * Monitors WebRTC connection stats and reports network quality metrics
 */

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export interface NetworkStats {
  rtt: number; // Round-trip time in ms
  packetLoss: number; // Percentage (0-100)
  jitter: number; // ms
  bitrate: number; // kbps
  framesPerSecond: number;
  framesReceived: number;
  framesSent: number;
  timestamp: number;
}

export interface QualityThresholds {
  excellent: { rtt: number; packetLoss: number; bitrate: number };
  good: { rtt: number; packetLoss: number; bitrate: number };
  fair: { rtt: number; packetLoss: number; bitrate: number };
  poor: { rtt: number; packetLoss: number; bitrate: number };
}

export type NetworkChangeCallback = (quality: NetworkQuality, stats: NetworkStats) => void;

export class NetworkMonitor {
  private peerConnection: RTCPeerConnection | null = null;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private statsHistory: NetworkStats[] = [];
  private maxHistoryLength = 10; // Keep last 10 stats
  private currentQuality: NetworkQuality = 'good';
  private callbacks: NetworkChangeCallback[] = [];
  
  // Quality thresholds
  private readonly thresholds: QualityThresholds = {
    excellent: { rtt: 50, packetLoss: 0.5, bitrate: 800 },
    good: { rtt: 150, packetLoss: 2, bitrate: 400 },
    fair: { rtt: 300, packetLoss: 5, bitrate: 200 },
    poor: { rtt: 500, packetLoss: 10, bitrate: 100 }
  };

  /**
   * Start monitoring network quality
   */
  startMonitoring(peerConnection: RTCPeerConnection, intervalMs: number = 2000): void {
    this.stopMonitoring();
    
    this.peerConnection = peerConnection;
    this.statsHistory = [];
    this.currentQuality = 'good';

    // Start polling stats
    this.monitorInterval = setInterval(() => {
      this.collectStats();
    }, intervalMs);

    console.log('[NetworkMonitor] Started monitoring');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.peerConnection = null;
    this.statsHistory = [];
    
    console.log('[NetworkMonitor] Stopped monitoring');
  }

  /**
   * Collect stats from peer connection
   */
  private async collectStats(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const stats = await this.peerConnection.getStats();
      const networkStats = this.parseStats(stats);
      
      if (networkStats) {
        this.addStats(networkStats);
        this.analyzeQuality(networkStats);
      }
    } catch (error) {
      console.error('[NetworkMonitor] Failed to collect stats:', error);
    }
  }

  /**
   * Parse RTCStatsReport into NetworkStats
   */
  private parseStats(statsReport: RTCStatsReport): NetworkStats | null {
    let rtt = 0;
    let packetLoss = 0;
    let jitter = 0;
    let bitrate = 0;
    let framesPerSecond = 0;
    let framesReceived = 0;
    let framesSent = 0;

    statsReport.forEach((report: any) => {
      // Inbound RTP (receiving video/audio)
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        framesReceived = report.framesReceived || 0;
        framesPerSecond = report.framesPerSecond || 0;
        jitter = report.jitter ? report.jitter * 1000 : 0; // Convert to ms
        
        // Calculate packet loss
        if (report.packetsLost && report.packetsReceived) {
          const totalPackets = report.packetsLost + report.packetsReceived;
          packetLoss = (report.packetsLost / totalPackets) * 100;
        }

        // Calculate bitrate from bytes received
        if (report.bytesReceived && report.timestamp) {
          const prevStats = this.statsHistory[this.statsHistory.length - 1];
          if (prevStats && report.timestamp > prevStats.timestamp) {
            const timeDiff = (report.timestamp - prevStats.timestamp) / 1000; // seconds
            const bytesDiff = report.bytesReceived - (prevStats as any).bytesReceived || 0;
            bitrate = (bytesDiff * 8) / timeDiff / 1000; // kbps
          }
        }
      }

      // Outbound RTP (sending video/audio)
      if (report.type === 'outbound-rtp' && report.kind === 'video') {
        framesSent = report.framesSent || 0;
      }

      // Candidate pair (RTT)
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0; // Convert to ms
      }

      // Remote inbound RTP (for packet loss from sender perspective)
      if (report.type === 'remote-inbound-rtp' && report.kind === 'video') {
        rtt = report.roundTripTime ? report.roundTripTime * 1000 : rtt;
        
        if (report.packetsLost && report.packetsReceived) {
          const totalPackets = report.packetsLost + report.packetsReceived;
          packetLoss = Math.max(packetLoss, (report.packetsLost / totalPackets) * 100);
        }
      }
    });

    // Only return if we have meaningful data
    if (rtt > 0 || framesReceived > 0 || framesSent > 0) {
      return {
        rtt,
        packetLoss,
        jitter,
        bitrate,
        framesPerSecond,
        framesReceived,
        framesSent,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Add stats to history
   */
  private addStats(stats: NetworkStats): void {
    this.statsHistory.push(stats);
    
    // Keep only recent history
    if (this.statsHistory.length > this.maxHistoryLength) {
      this.statsHistory.shift();
    }
  }

  /**
   * Analyze network quality based on stats
   */
  private analyzeQuality(stats: NetworkStats): void {
    let quality: NetworkQuality;

    // Determine quality based on thresholds
    if (
      stats.rtt <= this.thresholds.excellent.rtt &&
      stats.packetLoss <= this.thresholds.excellent.packetLoss &&
      stats.bitrate >= this.thresholds.excellent.bitrate
    ) {
      quality = 'excellent';
    } else if (
      stats.rtt <= this.thresholds.good.rtt &&
      stats.packetLoss <= this.thresholds.good.packetLoss &&
      stats.bitrate >= this.thresholds.good.bitrate
    ) {
      quality = 'good';
    } else if (
      stats.rtt <= this.thresholds.fair.rtt &&
      stats.packetLoss <= this.thresholds.fair.packetLoss &&
      stats.bitrate >= this.thresholds.fair.bitrate
    ) {
      quality = 'fair';
    } else if (
      stats.rtt <= this.thresholds.poor.rtt &&
      stats.packetLoss <= this.thresholds.poor.packetLoss &&
      stats.bitrate >= this.thresholds.poor.bitrate
    ) {
      quality = 'poor';
    } else {
      quality = 'critical';
    }

    // Only trigger callbacks if quality changed
    if (quality !== this.currentQuality) {
      console.log(`[NetworkMonitor] Quality changed: ${this.currentQuality} → ${quality}`, stats);
      this.currentQuality = quality;
      this.notifyCallbacks(quality, stats);
    }
  }

  /**
   * Register callback for network quality changes
   */
  onQualityChange(callback: NetworkChangeCallback): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(quality: NetworkQuality, stats: NetworkStats): void {
    this.callbacks.forEach(callback => {
      try {
        callback(quality, stats);
      } catch (error) {
        console.error('[NetworkMonitor] Callback error:', error);
      }
    });
  }

  /**
   * Get current network quality
   */
  getCurrentQuality(): NetworkQuality {
    return this.currentQuality;
  }

  /**
   * Get latest stats
   */
  getLatestStats(): NetworkStats | null {
    return this.statsHistory[this.statsHistory.length - 1] || null;
  }

  /**
   * Get stats history
   */
  getStatsHistory(): NetworkStats[] {
    return [...this.statsHistory];
  }

  /**
   * Get average stats over recent history
   */
  getAverageStats(): NetworkStats | null {
    if (this.statsHistory.length === 0) return null;

    const sum = this.statsHistory.reduce(
      (acc, stats) => ({
        rtt: acc.rtt + stats.rtt,
        packetLoss: acc.packetLoss + stats.packetLoss,
        jitter: acc.jitter + stats.jitter,
        bitrate: acc.bitrate + stats.bitrate,
        framesPerSecond: acc.framesPerSecond + stats.framesPerSecond,
        framesReceived: acc.framesReceived + stats.framesReceived,
        framesSent: acc.framesSent + stats.framesSent,
        timestamp: acc.timestamp
      }),
      { rtt: 0, packetLoss: 0, jitter: 0, bitrate: 0, framesPerSecond: 0, framesReceived: 0, framesSent: 0, timestamp: Date.now() }
    );

    const count = this.statsHistory.length;
    return {
      rtt: sum.rtt / count,
      packetLoss: sum.packetLoss / count,
      jitter: sum.jitter / count,
      bitrate: sum.bitrate / count,
      framesPerSecond: sum.framesPerSecond / count,
      framesReceived: sum.framesReceived / count,
      framesSent: sum.framesSent / count,
      timestamp: Date.now()
    };
  }

  /**
   * Check if video is frozen (no frames received recently)
   */
  isVideoFrozen(): boolean {
    if (this.statsHistory.length < 3) return false;

    const recent = this.statsHistory.slice(-3);
    const framesReceivedDiff = recent[recent.length - 1].framesReceived - recent[0].framesReceived;
    
    // No frames received in last 6 seconds (3 samples * 2s interval)
    return framesReceivedDiff === 0;
  }

  /**
   * Check if connection is degrading
   */
  isDegrading(): boolean {
    if (this.statsHistory.length < 3) return false;

    // Check if quality is consistently getting worse
    const recent = this.statsHistory.slice(-3);
    const rttIncreasing = recent[2].rtt > recent[1].rtt && recent[1].rtt > recent[0].rtt;
    const packetLossIncreasing = recent[2].packetLoss > recent[1].packetLoss;
    
    return rttIncreasing || packetLossIncreasing;
  }

  /**
   * Reset monitor state
   */
  reset(): void {
    this.statsHistory = [];
    this.currentQuality = 'good';
  }
}

// Export singleton instance
export const networkMonitor = new NetworkMonitor();
