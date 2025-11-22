/**
 * Resolution Manager
 * Handles adaptive video resolution with stepwise changes
 */

export type ResolutionTier = '360p' | '480p' | '720p';

export interface ResolutionConfig {
  width: number;
  height: number;
  frameRate: number;
  maxBitrate: number; // kbps
}

export interface DeviceInfo {
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  connection: 'slow-2g' | '2g' | '3g' | '4g' | undefined;
}

export class ResolutionManager {
  private currentTier: ResolutionTier;
  private deviceInfo: DeviceInfo;
  private availableTiers: ResolutionTier[] = ['720p', '480p', '360p'];

  // Resolution configurations with conservative bitrate caps
  private readonly resolutionConfigs: Record<ResolutionTier, ResolutionConfig> = {
    '720p': { width: 1280, height: 720, frameRate: 30, maxBitrate: 1200 },
    '480p': { width: 854, height: 480, frameRate: 30, maxBitrate: 500 },
    '360p': { width: 640, height: 360, frameRate: 24, maxBitrate: 300 }
  };

  constructor() {
    this.deviceInfo = this.detectDevice();
    this.currentTier = this.getDefaultResolution();
  }

  /**
   * Detect device type and capabilities
   */
  private detectDevice(): DeviceInfo {
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isSmallScreen = window.innerWidth <= 768;

    // @ts-ignore - NetworkInformation API
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      isMobile: isMobile || isSmallScreen,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      connection: connection?.effectiveType
    };
  }

  /**
   * Get default resolution based on device type
   */
  getDefaultResolution(): ResolutionTier {
    // Mobile devices default to 480p
    if (this.deviceInfo.isMobile) {
      return '480p';
    }

    // Desktop with slow connection
    if (this.deviceInfo.connection === 'slow-2g' || this.deviceInfo.connection === '2g') {
      return '360p';
    }

    // Desktop default to 720p
    return '720p';
  }

  /**
   * Get current resolution tier
   */
  getCurrentTier(): ResolutionTier {
    return this.currentTier;
  }

  /**
   * Get configuration for current tier
   */
  getCurrentConfig(): ResolutionConfig {
    return this.resolutionConfigs[this.currentTier];
  }

  /**
   * Get configuration for specific tier
   */
  getConfig(tier: ResolutionTier): ResolutionConfig {
    return this.resolutionConfigs[tier];
  }

  /**
   * Step down to lower resolution
   */
  stepDown(): ResolutionTier | null {
    const currentIndex = this.availableTiers.indexOf(this.currentTier);
    
    // Already at lowest
    if (currentIndex === this.availableTiers.length - 1) {
      return null;
    }

    this.currentTier = this.availableTiers[currentIndex + 1];
    return this.currentTier;
  }

  /**
   * Step up to higher resolution
   */
  stepUp(): ResolutionTier | null {
    const currentIndex = this.availableTiers.indexOf(this.currentTier);
    
    // Already at highest
    if (currentIndex === 0) {
      return null;
    }

    this.currentTier = this.availableTiers[currentIndex - 1];
    return this.currentTier;
  }

  /**
   * Set specific resolution tier
   */
  setTier(tier: ResolutionTier): void {
    if (this.availableTiers.includes(tier)) {
      this.currentTier = tier;
    }
  }

  /**
   * Check if can step down
   */
  canStepDown(): boolean {
    const currentIndex = this.availableTiers.indexOf(this.currentTier);
    return currentIndex < this.availableTiers.length - 1;
  }

  /**
   * Check if can step up
   */
  canStepUp(): boolean {
    const currentIndex = this.availableTiers.indexOf(this.currentTier);
    return currentIndex > 0;
  }

  /**
   * Get media constraints for current resolution
   */
  getMediaConstraints(): MediaTrackConstraints {
    const config = this.getCurrentConfig();
    
    return {
      width: { ideal: config.width },
      height: { ideal: config.height },
      frameRate: { ideal: config.frameRate, max: config.frameRate },
      aspectRatio: { ideal: 16/9 },
      facingMode: this.deviceInfo.isMobile ? 'user' : undefined
    };
  }

  /**
   * Get media constraints for specific tier
   */
  getMediaConstraintsForTier(tier: ResolutionTier): MediaTrackConstraints {
    const config = this.getConfig(tier);
    
    return {
      width: { ideal: config.width },
      height: { ideal: config.height },
      frameRate: { ideal: config.frameRate, max: config.frameRate },
      aspectRatio: { ideal: 16/9 },
      facingMode: this.deviceInfo.isMobile ? 'user' : undefined
    };
  }

  /**
   * Apply constraints to video track
   */
  async applyConstraintsToTrack(videoTrack: MediaStreamTrack, tier?: ResolutionTier): Promise<void> {
    const targetTier = tier || this.currentTier;
    const constraints = this.getMediaConstraintsForTier(targetTier);

    try {
      await videoTrack.applyConstraints(constraints);
      if (tier) {
        this.currentTier = tier;
      }
    } catch (error) {
      console.error('Failed to apply video constraints:', error);
      throw error;
    }
  }

  /**
   * Get optimal resolution for mobile devices
   */
  getMobileOptimizedTier(): ResolutionTier {
    // Check connection speed
    if (this.deviceInfo.connection === 'slow-2g' || this.deviceInfo.connection === '2g') {
      return '360p';
    }

    if (this.deviceInfo.connection === '3g') {
      return '480p';
    }

    // Check screen size
    if (this.deviceInfo.screenWidth <= 480) {
      return '360p';
    }

    return '480p';
  }

  /**
   * Get device info
   */
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  /**
   * Update device info (call on orientation change or resize)
   */
  updateDeviceInfo(): void {
    this.deviceInfo = this.detectDevice();
  }

  /**
   * Get human-readable resolution label
   */
  getResolutionLabel(tier?: ResolutionTier): string {
    const targetTier = tier || this.currentTier;
    const config = this.getConfig(targetTier);
    return `${targetTier} (${config.width}x${config.height})`;
  }

  /**
   * Calculate target bitrate for encoding parameters
   */
  getTargetBitrate(tier?: ResolutionTier): number {
    const targetTier = tier || this.currentTier;
    return this.getConfig(targetTier).maxBitrate * 1000; // Convert to bps
  }

  /**
   * Get all available tiers
   */
  getAvailableTiers(): ResolutionTier[] {
    return [...this.availableTiers];
  }

  /**
   * Reset to default resolution
   */
  reset(): void {
    this.currentTier = this.getDefaultResolution();
  }
}

// Export singleton instance
export const resolutionManager = new ResolutionManager();
