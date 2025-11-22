/**
 * Camera Preview Service
 * Handles getUserMedia access, device enumeration, and preview stream management
 */

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput';
  facing?: 'user' | 'environment';
}

export interface PreviewOptions {
  videoDeviceId?: string;
  audioDeviceId?: string;
  resolution: '360p' | '480p' | '720p';
  facingMode?: 'user' | 'environment';
  enableAudio?: boolean;
}

export interface VideoConstraints {
  width: number;
  height: number;
  frameRate: number;
}

export class CameraPreviewService {
  private previewStream: MediaStream | null = null;
  private devices: CameraDevice[] = [];

  /**
   * Get video constraints for resolution preset
   */
  private getVideoConstraints(resolution: '360p' | '480p' | '720p'): VideoConstraints {
    const constraints: Record<string, VideoConstraints> = {
      '360p': { width: 640, height: 360, frameRate: 24 },
      '480p': { width: 854, height: 480, frameRate: 30 },
      '720p': { width: 1280, height: 720, frameRate: 30 }
    };
    return constraints[resolution];
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobile || isSmallScreen;
  }

  /**
   * Get default resolution based on device type
   */
  getDefaultResolution(): '480p' | '720p' {
    return this.isMobileDevice() ? '480p' : '720p';
  }

  /**
   * Enumerate available camera and microphone devices
   */
  async enumerateDevices(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      this.devices = devices
        .filter(device => device.kind === 'videoinput' || device.kind === 'audioinput')
        .map(device => {
          // Detect front/back camera for mobile
          let facing: 'user' | 'environment' | undefined;
          if (device.kind === 'videoinput') {
            const label = device.label.toLowerCase();
            if (label.includes('front') || label.includes('user')) {
              facing = 'user';
            } else if (label.includes('back') || label.includes('environment') || label.includes('rear')) {
              facing = 'environment';
            }
          }

          return {
            deviceId: device.deviceId,
            label: device.label || `${device.kind === 'videoinput' ? 'Camera' : 'Microphone'} ${device.deviceId.substring(0, 5)}`,
            kind: device.kind as 'videoinput' | 'audioinput',
            facing
          };
        });

      return this.devices;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      throw new Error('Could not access device list. Please grant camera permissions.');
    }
  }

  /**
   * Get available video devices (cameras)
   */
  getVideoDevices(): CameraDevice[] {
    return this.devices.filter(d => d.kind === 'videoinput');
  }

  /**
   * Get available audio devices (microphones)
   */
  getAudioDevices(): CameraDevice[] {
    return this.devices.filter(d => d.kind === 'audioinput');
  }

  /**
   * Start preview stream with specified options
   */
  async startPreview(options: PreviewOptions): Promise<MediaStream> {
    try {
      // Stop existing preview if any
      this.stopPreview();

      const videoConstraints = this.getVideoConstraints(options.resolution);
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: options.videoDeviceId ? { exact: options.videoDeviceId } : undefined,
          facingMode: options.facingMode || (this.isMobileDevice() ? 'user' : undefined),
          width: { ideal: videoConstraints.width },
          height: { ideal: videoConstraints.height },
          frameRate: { ideal: videoConstraints.frameRate, max: videoConstraints.frameRate },
          aspectRatio: { ideal: 16/9 }
        },
        audio: options.enableAudio !== false ? {
          deviceId: options.audioDeviceId ? { exact: options.audioDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      this.previewStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      return this.previewStream;
    } catch (error: any) {
      console.error('Failed to start preview:', error);
      
      // Handle specific error cases
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera/microphone permission denied. Please allow access in browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera or microphone found. Please connect a device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application.');
      } else if (error.name === 'OverconstrainedError') {
        throw new Error('Selected camera does not support the requested resolution. Try a different resolution.');
      } else {
        throw new Error(`Failed to access camera: ${error.message}`);
      }
    }
  }

  /**
   * Switch to different camera (front/back on mobile)
   */
  async switchCamera(facingMode: 'user' | 'environment', resolution: '360p' | '480p' | '720p'): Promise<MediaStream> {
    const audioTrack = this.previewStream?.getAudioTracks()[0];
    
    const options: PreviewOptions = {
      resolution,
      facingMode,
      enableAudio: !!audioTrack
    };

    return this.startPreview(options);
  }

  /**
   * Change resolution of preview stream
   */
  async changeResolution(resolution: '360p' | '480p' | '720p'): Promise<void> {
    if (!this.previewStream) {
      throw new Error('No active preview stream');
    }

    const videoTrack = this.previewStream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track found');
    }

    const videoConstraints = this.getVideoConstraints(resolution);

    try {
      await videoTrack.applyConstraints({
        width: { ideal: videoConstraints.width },
        height: { ideal: videoConstraints.height },
        frameRate: { ideal: videoConstraints.frameRate, max: videoConstraints.frameRate }
      });
    } catch (error: any) {
      console.error('Failed to change resolution:', error);
      throw new Error('Could not change resolution. Try restarting the preview.');
    }
  }

  /**
   * Apply brightness/exposure adjustments (if supported)
   */
  async adjustBrightness(brightness: number): Promise<void> {
    if (!this.previewStream) return;

    const videoTrack = this.previewStream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const capabilities = videoTrack.getCapabilities() as any;
      
      if (capabilities.brightness) {
        await videoTrack.applyConstraints({
          // @ts-ignore - brightness is not in standard types yet
          advanced: [{ brightness }]
        });
      }
    } catch (error) {
      console.warn('Brightness adjustment not supported on this device:', error);
    }
  }

  /**
   * Get current preview stream
   */
  getPreviewStream(): MediaStream | null {
    return this.previewStream;
  }

  /**
   * Stop preview and release camera/microphone
   */
  stopPreview(): void {
    if (this.previewStream) {
      this.previewStream.getTracks().forEach(track => {
        track.stop();
      });
      this.previewStream = null;
    }
  }

  /**
   * Check if browser supports getUserMedia
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check camera permission status
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if (!navigator.permissions) return 'prompt';
      
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return cameraPermission.state;
    } catch (error) {
      // Permissions API not supported, return prompt
      return 'prompt';
    }
  }

  /**
   * Get current stream settings (actual resolution, framerate)
   */
  getStreamSettings(): { width: number; height: number; frameRate: number } | null {
    if (!this.previewStream) return null;

    const videoTrack = this.previewStream.getVideoTracks()[0];
    if (!videoTrack) return null;

    const settings = videoTrack.getSettings();
    return {
      width: settings.width || 0,
      height: settings.height || 0,
      frameRate: settings.frameRate || 0
    };
  }
}

// Export singleton instance
export const cameraPreviewService = new CameraPreviewService();
