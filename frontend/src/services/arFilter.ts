/**
 * Simplified AR Filter Service
 * Uses CSS filters for better performance - no TensorFlow, no canvas processing
 */

import {
  FaceMaskType,
  BlurState,
  ARCapabilities,
  ARPerformanceMetrics,
  AR_CONSTANTS,
  getDevicePerformance,
  getRecommendedMasks,
  getFilterCSS,
} from '../types/arFilters';

class ARFilterService {
  private static instance: ARFilterService;
  
  // Canvas processing
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  
  // State
  private currentFilter: FaceMaskType = 'none';
  private blurState: BlurState = 'disabled';
  private blurIntensity: number = AR_CONSTANTS.BLUR_RADIUS.MEDIUM;
  
  // Streams
  private originalStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  
  // Callbacks
  private performanceCallback: ((metrics: ARPerformanceMetrics) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  
  // Capabilities
  private capabilities: ARCapabilities | null = null;

  private constructor() {}

  static getInstance(): ARFilterService {
    if (!ARFilterService.instance) {
      ARFilterService.instance = new ARFilterService();
    }
    return ARFilterService.instance;
  }

  /**
   * Initialize AR Filter Service (simplified - no TensorFlow needed)
   */
  async initialize(options?: { qualityPreset?: 'low' | 'medium' | 'high' }): Promise<ARCapabilities> {
    try {
      console.log('🎨 Initializing CSS Filter Service...');
      
      // Detect browser capabilities (CSS filters are universally supported)
      const capabilities: ARCapabilities = {
        supportsFaceMesh: false, // No longer needed
        supportsCanvas: true,
        supportsOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
        supportsWebGL: false, // No longer needed
        supportsCaptureStream: typeof HTMLCanvasElement !== 'undefined' && 
                               typeof HTMLCanvasElement.prototype.captureStream === 'function',
        recommendedMasks: getRecommendedMasks(getDevicePerformance()),
        warnings: [],
        devicePerformance: getDevicePerformance(),
      };
      
      this.capabilities = capabilities;
      console.log('✅ CSS Filter Service initialized', capabilities);
      return capabilities;
    } catch (error) {
      console.error('❌ Failed to initialize CSS Filter Service:', error);
      throw error;
    }
  }

  /**
   * Apply filters using canvas and return processed stream for WebRTC
   */
  async startProcessing(
    stream: MediaStream,
    filterType: FaceMaskType = 'none',
    blurState: BlurState = 'disabled',
    blurIntensity: number = AR_CONSTANTS.BLUR_RADIUS.MEDIUM,
    videoElement?: HTMLVideoElement
  ): Promise<MediaStream> {
    try {
      console.log('🎨 Starting canvas-based filter processing...', { filterType, blurState });
      
      this.currentFilter = filterType;
      this.blurState = blurState;
      this.blurIntensity = blurIntensity;
      this.originalStream = stream;
      
      // Create video element to read from stream
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = stream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        this.videoElement!.onloadedmetadata = () => {
          this.videoElement!.play();
          resolve();
        };
      });
      
      // Create canvas for processing
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.videoElement.videoWidth || 640;
      this.canvas.height = this.videoElement.videoHeight || 480;
      this.ctx = this.canvas.getContext('2d', { alpha: false });
      
      if (!this.ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // Start processing loop
      this.startProcessingLoop();
      
      // Capture canvas stream at 30fps
      this.processedStream = this.canvas.captureStream(30);
      
      // Add audio tracks from original stream
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        this.processedStream!.addTrack(track);
      });
      
      console.log('✅ Canvas-based filter processing started - remote users will see filtered video');
      return this.processedStream;
    } catch (error) {
      console.error('❌ Failed to start filter processing:', error);
      if (this.errorCallback) {
        this.errorCallback(error as Error);
      }
      // Return original stream as fallback
      return stream;
    }
  }

  /**
   * Processing loop to continuously apply filters to canvas
   */
  private startProcessingLoop(): void {
    const processFrame = () => {
      if (!this.videoElement || !this.canvas || !this.ctx) return;
      
      try {
        // Apply filters to canvas context
        const filters: string[] = [];
        
        // Add blur if active
        const blurEnabled = (this.blurState === 'active' || this.blurState === 'manual') && this.blurIntensity > 0;
        if (blurEnabled) {
          filters.push(`blur(${this.blurIntensity}px)`);
        }
        
        // Add color filter
        if (this.currentFilter !== 'none') {
          const colorFilter = getFilterCSS(this.currentFilter);
          if (colorFilter !== 'none') {
            filters.push(colorFilter);
          }
        }
        
        // Apply filters and draw
        this.ctx.filter = filters.length > 0 ? filters.join(' ') : 'none';
        this.ctx.drawImage(
          this.videoElement,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
      } catch (error) {
        console.error('❌ Error in processing loop:', error);
      }
      
      this.animationFrameId = requestAnimationFrame(processFrame);
    };
    
    processFrame();
  }

  /**
   * Update filter type - changes apply instantly to stream
   */
  setFilter(filterType: FaceMaskType): void {
    console.log('🎨 Changing filter to:', filterType, '- remote users will see this instantly');
    this.currentFilter = filterType;
    // Filter changes automatically apply in next animation frame
  }

  /**
   * Update blur state - changes apply instantly to stream
   */
  setBlurState(blurState: BlurState, intensity?: number): void {
    console.log('🌫️ Changing blur state to:', blurState, intensity, '- remote users will see this instantly');
    this.blurState = blurState;
    if (intensity !== undefined) {
      this.blurIntensity = intensity;
    }
    // Blur changes automatically apply in next animation frame
  }

  /**
   * Update blur intensity - changes apply instantly to stream
   */
  setBlurIntensity(intensity: number): void {
    console.log('🌫️ Changing blur intensity to:', intensity, '- remote users will see this instantly');
    this.blurIntensity = Math.max(0, Math.min(AR_CONSTANTS.BLUR_RADIUS.MAX, intensity));
    // Intensity changes automatically apply in next animation frame
  }

  /**
   * Stop processing and clean up
   */
  stopProcessing(): void {
    console.log('🛑 Stopping filter processing...');
    
    // Stop animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Stop processed stream
    if (this.processedStream) {
      this.processedStream.getTracks().forEach(track => {
        // Don't stop audio tracks from original stream
        if (track.kind === 'video') {
          track.stop();
        }
      });
      this.processedStream = null;
    }
    
    // Cleanup video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    // Cleanup canvas
    this.canvas = null;
    this.ctx = null;
    
    // Reset state
    this.originalStream = null;
    this.currentFilter = 'none';
    this.blurState = 'disabled';
    
    console.log('✅ Filter processing stopped');
  }

  /**
   * Get current processing state
   */
  getState() {
    return {
      isProcessing: this.videoElement !== null,
      currentFilter: this.currentFilter,
      blurState: this.blurState,
      blurIntensity: this.blurIntensity,
    };
  }

  /**
   * Get capabilities
   */
  getCapabilities(): ARCapabilities | null {
    return this.capabilities;
  }

  /**
   * Set callbacks
   */
  setPerformanceCallback(callback: (metrics: ARPerformanceMetrics) => void): void {
    this.performanceCallback = callback;
  }

  setErrorCallback(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Get mock performance metrics (no heavy processing anymore)
   */
  getPerformanceMetrics(): ARPerformanceMetrics {
    return {
      fps: 60, // CSS filters don't impact FPS
      faceDetectionTime: 0,
      renderTime: 0,
      cpuUsage: 0,
      droppedFrames: 0,
      timestamp: Date.now(),
    };
  }
}

export default ARFilterService;
