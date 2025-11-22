/**
 * Adaptive Bitrate Controller
 * Adjusts video resolution and bitrate based on network conditions
 */

import { NetworkMonitor, NetworkQuality, NetworkStats } from './networkMonitor';
import { ResolutionManager, ResolutionTier } from './resolutionManager';

export interface BitrateAdjustment {
  previousTier: ResolutionTier;
  newTier: ResolutionTier;
  reason: string;
  timestamp: number;
}

export type BitrateChangeCallback = (adjustment: BitrateAdjustment) => void;

export class AdaptiveBitrateController {
  private networkMonitor: NetworkMonitor;
  private resolutionManager: ResolutionManager;
  private peerConnection: RTCPeerConnection | null = null;
  private videoSender: RTCRtpSender | null = null;
  private adjustmentTimer: ReturnType<typeof setTimeout> | null = null;
  private adjustmentHistory: BitrateAdjustment[] = [];
  private callbacks: BitrateChangeCallback[] = [];
  private isEnabled: boolean = false;
  
  // Debounce parameters
  private readonly ADJUSTMENT_DELAY_MS = 3000; // 3 seconds delay before adjustment
  private readonly STABILITY_CHECK_SAMPLES = 2; // Require 2 consecutive poor samples before downgrade
  private poorQualityCount: number = 0;
  private goodQualityCount: number = 0;

  constructor(networkMonitor: NetworkMonitor, resolutionManager: ResolutionManager) {
    this.networkMonitor = networkMonitor;
    this.resolutionManager = resolutionManager;
  }

  /**
   * Start adaptive bitrate control
   */
  start(peerConnection: RTCPeerConnection): void {
    this.stop();
    
    this.peerConnection = peerConnection;
    this.isEnabled = true;
    this.poorQualityCount = 0;
    this.goodQualityCount = 0;

    // Find video sender
    this.videoSender = this.findVideoSender();

    // Listen to network quality changes
    this.networkMonitor.onQualityChange((quality, stats) => {
      this.handleQualityChange(quality, stats);
    });

    // Apply initial bitrate
    this.applyBitrateForCurrentTier();

    console.log('[AdaptiveBitrate] Started adaptive bitrate control');
  }

  /**
   * Stop adaptive bitrate control
   */
  stop(): void {
    this.isEnabled = false;
    this.peerConnection = null;
    this.videoSender = null;
    
    if (this.adjustmentTimer) {
      clearTimeout(this.adjustmentTimer);
      this.adjustmentTimer = null;
    }

    this.poorQualityCount = 0;
    this.goodQualityCount = 0;

    console.log('[AdaptiveBitrate] Stopped adaptive bitrate control');
  }

  /**
   * Find video sender from peer connection
   */
  private findVideoSender(): RTCRtpSender | null {
    if (!this.peerConnection) return null;

    const senders = this.peerConnection.getSenders();
    const videoSender = senders.find(sender => sender.track?.kind === 'video');

    if (!videoSender) {
      console.warn('[AdaptiveBitrate] No video sender found');
    }

    return videoSender || null;
  }

  /**
   * Handle network quality change
   */
  private handleQualityChange(quality: NetworkQuality, stats: NetworkStats): void {
    if (!this.isEnabled) return;

    console.log(`[AdaptiveBitrate] Quality: ${quality}, RTT: ${stats.rtt.toFixed(0)}ms, Loss: ${stats.packetLoss.toFixed(1)}%, Bitrate: ${stats.bitrate.toFixed(0)}kbps`);

    // Track quality over time for stability
    if (quality === 'poor' || quality === 'critical') {
      this.poorQualityCount++;
      this.goodQualityCount = 0;

      // Downgrade after consecutive poor samples
      if (this.poorQualityCount >= this.STABILITY_CHECK_SAMPLES) {
        this.scheduleDowngrade('poor network conditions');
      }
    } else if (quality === 'excellent' || quality === 'good') {
      this.goodQualityCount++;
      this.poorQualityCount = 0;

      // Upgrade after consecutive good samples
      if (this.goodQualityCount >= this.STABILITY_CHECK_SAMPLES) {
        this.scheduleUpgrade('network improved');
      }
    } else {
      // Fair quality - maintain current tier
      this.poorQualityCount = 0;
      this.goodQualityCount = 0;
    }
  }

  /**
   * Schedule resolution downgrade with debouncing
   */
  private scheduleDowngrade(reason: string): void {
    if (!this.resolutionManager.canStepDown()) {
      console.log('[AdaptiveBitrate] Already at lowest resolution');
      return;
    }

    if (this.adjustmentTimer) {
      clearTimeout(this.adjustmentTimer);
    }

    this.adjustmentTimer = setTimeout(() => {
      this.performDowngrade(reason);
    }, this.ADJUSTMENT_DELAY_MS);
  }

  /**
   * Schedule resolution upgrade with debouncing
   */
  private scheduleUpgrade(reason: string): void {
    if (!this.resolutionManager.canStepUp()) {
      console.log('[AdaptiveBitrate] Already at highest resolution');
      return;
    }

    if (this.adjustmentTimer) {
      clearTimeout(this.adjustmentTimer);
    }

    this.adjustmentTimer = setTimeout(() => {
      this.performUpgrade(reason);
    }, this.ADJUSTMENT_DELAY_MS);
  }

  /**
   * Perform resolution downgrade
   */
  private async performDowngrade(reason: string): Promise<void> {
    const previousTier = this.resolutionManager.getCurrentTier();
    const newTier = this.resolutionManager.stepDown();

    if (!newTier) {
      console.log('[AdaptiveBitrate] Cannot downgrade further');
      return;
    }

    console.log(`[AdaptiveBitrate] Downgrading: ${previousTier} → ${newTier} (${reason})`);

    try {
      await this.applyResolution(newTier);
      
      const adjustment: BitrateAdjustment = {
        previousTier,
        newTier,
        reason,
        timestamp: Date.now()
      };

      this.adjustmentHistory.push(adjustment);
      this.notifyCallbacks(adjustment);

      // Reset counters
      this.poorQualityCount = 0;
      this.goodQualityCount = 0;
    } catch (error) {
      console.error('[AdaptiveBitrate] Downgrade failed:', error);
    }
  }

  /**
   * Perform resolution upgrade
   */
  private async performUpgrade(reason: string): Promise<void> {
    const previousTier = this.resolutionManager.getCurrentTier();
    const newTier = this.resolutionManager.stepUp();

    if (!newTier) {
      console.log('[AdaptiveBitrate] Cannot upgrade further');
      return;
    }

    console.log(`[AdaptiveBitrate] Upgrading: ${previousTier} → ${newTier} (${reason})`);

    try {
      await this.applyResolution(newTier);
      
      const adjustment: BitrateAdjustment = {
        previousTier,
        newTier,
        reason,
        timestamp: Date.now()
      };

      this.adjustmentHistory.push(adjustment);
      this.notifyCallbacks(adjustment);

      // Reset counters
      this.poorQualityCount = 0;
      this.goodQualityCount = 0;
    } catch (error) {
      console.error('[AdaptiveBitrate] Upgrade failed:', error);
    }
  }

  /**
   * Apply resolution change to video track
   */
  private async applyResolution(tier: ResolutionTier): Promise<void> {
    if (!this.videoSender || !this.videoSender.track) {
      throw new Error('No video sender or track available');
    }

    const videoTrack = this.videoSender.track as MediaStreamTrack;
    
    // Apply constraints to video track
    await this.resolutionManager.applyConstraintsToTrack(videoTrack, tier);
    
    // Apply bitrate encoding parameters
    await this.applyBitrateForTier(tier);
  }

  /**
   * Apply bitrate for specific tier
   */
  private async applyBitrateForTier(tier: ResolutionTier): Promise<void> {
    if (!this.videoSender) return;

    try {
      const params = this.videoSender.getParameters();
      
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }

      const targetBitrate = this.resolutionManager.getTargetBitrate(tier);
      
      // Set conservative bitrate caps
      params.encodings[0].maxBitrate = targetBitrate;
      
      // Apply encoding parameters
      await this.videoSender.setParameters(params);
      
      console.log(`[AdaptiveBitrate] Applied bitrate: ${(targetBitrate / 1000).toFixed(0)}kbps for ${tier}`);
    } catch (error) {
      console.error('[AdaptiveBitrate] Failed to set bitrate:', error);
    }
  }

  /**
   * Apply bitrate for current tier
   */
  private async applyBitrateForCurrentTier(): Promise<void> {
    const currentTier = this.resolutionManager.getCurrentTier();
    await this.applyBitrateForTier(currentTier);
  }

  /**
   * Register callback for bitrate changes
   */
  onBitrateChange(callback: BitrateChangeCallback): () => void {
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
  private notifyCallbacks(adjustment: BitrateAdjustment): void {
    this.callbacks.forEach(callback => {
      try {
        callback(adjustment);
      } catch (error) {
        console.error('[AdaptiveBitrate] Callback error:', error);
      }
    });
  }

  /**
   * Get adjustment history
   */
  getAdjustmentHistory(): BitrateAdjustment[] {
    return [...this.adjustmentHistory];
  }

  /**
   * Manually adjust to specific tier
   */
  async manualAdjust(tier: ResolutionTier, reason: string = 'manual adjustment'): Promise<void> {
    const previousTier = this.resolutionManager.getCurrentTier();
    
    if (previousTier === tier) {
      console.log('[AdaptiveBitrate] Already at target tier');
      return;
    }

    console.log(`[AdaptiveBitrate] Manual adjustment: ${previousTier} → ${tier}`);

    try {
      await this.applyResolution(tier);
      
      const adjustment: BitrateAdjustment = {
        previousTier,
        newTier: tier,
        reason,
        timestamp: Date.now()
      };

      this.adjustmentHistory.push(adjustment);
      this.notifyCallbacks(adjustment);

      // Reset counters
      this.poorQualityCount = 0;
      this.goodQualityCount = 0;
    } catch (error) {
      console.error('[AdaptiveBitrate] Manual adjustment failed:', error);
      throw error;
    }
  }

  /**
   * Get current enabled state
   */
  isActive(): boolean {
    return this.isEnabled;
  }

  /**
   * Reset controller state
   */
  reset(): void {
    this.adjustmentHistory = [];
    this.poorQualityCount = 0;
    this.goodQualityCount = 0;
    
    if (this.adjustmentTimer) {
      clearTimeout(this.adjustmentTimer);
      this.adjustmentTimer = null;
    }
  }
}

// Export singleton instance (requires initialization with monitor and manager)
let adaptiveBitrateController: AdaptiveBitrateController | null = null;

export function getAdaptiveBitrateController(
  networkMonitor: NetworkMonitor,
  resolutionManager: ResolutionManager
): AdaptiveBitrateController {
  if (!adaptiveBitrateController) {
    adaptiveBitrateController = new AdaptiveBitrateController(networkMonitor, resolutionManager);
  }
  return adaptiveBitrateController;
}
