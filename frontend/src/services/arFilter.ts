/**
 * AR Filter Service - Pure Canvas-Based Filters
 * No face detection - applies blur and color filters directly to video stream
 */

import {
  FaceMaskType,
  BlurState,
  ARCapabilities,
  ARPerformanceMetrics,
  AR_CONSTANTS,
  getDevicePerformance,
  getRecommendedMasks,
} from '../types/arFilters';

class ARFilterService {
  private static instance: ARFilterService;
  
  // Canvas processing
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  
  // State
  private currentMask: FaceMaskType = 'none';
  private blurState: BlurState = 'disabled';
  private blurIntensity: number = AR_CONSTANTS.BLUR_RADIUS.MEDIUM;
  
  // Streams
  private originalStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  
  // Performance tracking
  private frameCount: number = 0;
  private lastFpsUpdate: number = Date.now();
  private processingTimes: number[] = [];
  private performanceMetrics: ARPerformanceMetrics = {
    fps: 0,
    faceDetectionTime: 0,
    renderTime: 0,
    cpuUsage: 0,
    droppedFrames: 0,
    timestamp: Date.now(),
  };
  
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
   * Initialize AR Filter Service (no face detection needed)
   */
  async initialize(): Promise<ARCapabilities> {
    try {
      console.log('🎨 Initializing Filter Service (no face detection)...');
      
      const capabilities: ARCapabilities = {
        supportsFaceMesh: false,
        supportsCanvas: true,
        supportsOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
        supportsWebGL: false,
        supportsCaptureStream: typeof HTMLCanvasElement !== 'undefined' && 
                               typeof HTMLCanvasElement.prototype.captureStream === 'function',
        recommendedMasks: getRecommendedMasks(getDevicePerformance()),
        warnings: [],
        devicePerformance: getDevicePerformance(),
      };
      
      this.capabilities = capabilities;
      console.log('✅ Filter Service ready', capabilities);
      return capabilities;
    } catch (error) {
      console.error('❌ Filter Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start processing video with filters
   */
  async startProcessing(
    stream: MediaStream,
    filterType: FaceMaskType = 'none',
    blurState: BlurState = 'disabled',
    blurIntensity: number = AR_CONSTANTS.BLUR_RADIUS.MEDIUM,
    videoElement?: HTMLVideoElement
  ): Promise<MediaStream> {
    try {
      console.log('🎬 Starting filter processing...', { filterType, blurState, blurIntensity });
      
      // Stop any existing processing
      if (this.animationFrameId !== null) {
        console.log('⚠️ Stopping existing processing loop');
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      
      this.currentMask = filterType;
      this.blurState = blurState;
      this.blurIntensity = blurIntensity;
      this.originalStream = stream;
      
      // Use provided video element or create new
      if (videoElement && videoElement.srcObject === stream) {
        console.log('✅ Using existing video element');
        this.videoElement = videoElement;
      } else {
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = stream;
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          this.videoElement!.onloadedmetadata = () => {
            this.videoElement!.play().catch(err => {
              console.error('❌ Video play error:', err);
            });
            resolve();
          };
        });
      }
      
      // Create canvas
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
      }
      
      const width = this.videoElement.videoWidth || 640;
      const height = this.videoElement.videoHeight || 480;
      
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        console.log(`📐 Canvas: ${width}x${height}`);
      }
      
      this.ctx = this.canvas.getContext('2d', { alpha: false, willReadFrequently: false });
      
      if (!this.ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // Start processing
      this.startProcessingLoop();
      
      // Capture canvas stream
      this.processedStream = this.canvas.captureStream(30);
      
      // Add audio tracks
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        this.processedStream!.addTrack(track);
      });
      
      console.log('✅ Filter processing started - streaming to remote peer');
      return this.processedStream;
    } catch (error) {
      console.error('❌ Failed to start processing:', error);
      if (this.errorCallback) {
        this.errorCallback(error as Error);
      }
      return stream;
    }
  }

  /**
   * Main processing loop - applies filters to every frame
   */
  private startProcessingLoop(): void {
    const processFrame = () => {
      if (!this.videoElement || !this.canvas || !this.ctx) {
        return;
      }
      
      const startTime = performance.now();
      
      try {
        // Build filter string
        const filters: string[] = [];
        
        // Add blur
        const blurEnabled = (this.blurState === 'active' || this.blurState === 'manual') && this.blurIntensity > 0;
        if (blurEnabled) {
          filters.push(`blur(${this.blurIntensity}px)`);
        }
        
        // Add color filter
        if (this.currentMask !== 'none') {
          const colorFilter = this.getFilterCSS(this.currentMask);
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
        this.ctx.filter = 'none';
        
        // Update metrics
        const renderTime = performance.now() - startTime;
        this.performanceMetrics.renderTime = renderTime;
        this.updatePerformanceMetrics(renderTime);
        
      } catch (error) {
        console.error('❌ Processing error:', error);
        this.performanceMetrics.droppedFrames++;
      }
      
      this.animationFrameId = requestAnimationFrame(processFrame);
    };
    
    processFrame();
  }

  /**
   * Get CSS filter string for color effects
   */
  private getFilterCSS(filterType: FaceMaskType): string {
    switch (filterType) {
      case 'grayscale':
        return 'grayscale(100%) contrast(1.1)';
      case 'sepia':
        return 'sepia(90%) contrast(1.15) brightness(1.05)';
      case 'invert':
        return 'invert(100%) hue-rotate(180deg)';
      case 'cool':
        return 'saturate(1.4) contrast(1.1) brightness(0.95) hue-rotate(200deg)';
      case 'warm':
        return 'saturate(1.5) contrast(1.2) brightness(1.08) hue-rotate(-20deg)';
      case 'vibrant':
        return 'saturate(2.2) contrast(1.25) brightness(1.1)';
      case 'none':
      default:
        return 'none';
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(frameTime: number): void {
    this.frameCount++;
    this.processingTimes.push(frameTime);
    
    if (this.processingTimes.length > 60) {
      this.processingTimes.shift();
    }
    
    const now = Date.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.performanceMetrics.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      const avgFrameTime = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
      const targetFrameTime = 1000 / AR_CONSTANTS.TARGET_FPS;
      this.performanceMetrics.cpuUsage = Math.min(100, (avgFrameTime / targetFrameTime) * 100);
      this.performanceMetrics.timestamp = now;
      
      if (this.performanceCallback) {
        this.performanceCallback(this.performanceMetrics);
      }
    }
  }

  /**
   * Change filter type
   */
  setMask(maskType: FaceMaskType): void {
    if (this.currentMask === maskType) return;
    console.log(`🎨 Filter: ${this.currentMask} → ${maskType}`);
    this.currentMask = maskType;
  }

  /**
   * Update blur state
   */
  setBlurState(state: BlurState, intensity?: number): void {
    console.log(`👁️ Blur: ${state}`);
    this.blurState = state;
    if (intensity !== undefined) {
      this.blurIntensity = intensity;
    }
  }

  /**
   * Change blur intensity
   */
  setBlurIntensity(intensity: number): void {
    console.log('🌫️ Blur intensity:', intensity);
    this.blurIntensity = Math.max(0, Math.min(AR_CONSTANTS.BLUR_RADIUS.MAX, intensity));
  }

  /**
   * Stop processing
   */
  stopProcessing(): void {
    console.log('🛑 Stopping filter processing...');
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.processedStream) {
      this.processedStream.getTracks().forEach(track => {
        if (track.kind === 'video') {
          track.stop();
        }
      });
      this.processedStream = null;
    }
    
    this.videoElement = null;
    this.canvas = null;
    this.ctx = null;
    this.originalStream = null;
    this.currentMask = 'none';
    this.blurState = 'disabled';
    
    console.log('✅ Processing stopped');
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isProcessing: this.videoElement !== null,
      currentFilter: this.currentMask,
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
   * Set performance callback
   */
  setPerformanceCallback(callback: (metrics: ARPerformanceMetrics) => void): void {
    this.performanceCallback = callback;
  }

  /**
   * Set error callback
   */
  setErrorCallback(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): ARPerformanceMetrics {
    return { ...this.performanceMetrics };
  }
}

export default ARFilterService;
