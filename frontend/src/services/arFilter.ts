/**
 * AR Filter Service
 * Handles face detection, mask overlays, and blur effects using TensorFlow.js FaceMesh
 */

// @ts-ignore - TensorFlow types may not be fully available
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
// @ts-ignore
import '@tensorflow/tfjs-core';
// @ts-ignore
import '@tensorflow/tfjs-backend-webgl';
import {
  FaceMaskType,
  BlurState,
  FaceLandmarks,
  ARCapabilities,
  ARPerformanceMetrics,
  AR_CONSTANTS,
  getDevicePerformance,
  getRecommendedMasks,
} from '../types/arFilters';

class ARFilterService {
  private static instance: ARFilterService;
  
  // TensorFlow FaceMesh
  private detector: any | null = null;
  private model: string = 'MediaPipeFaceMesh';
  
  // Canvas processing
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  
  // Streams
  private originalStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  
  // State
  private currentMask: FaceMaskType = 'none';
  private blurState: BlurState = 'disabled';
  private blurIntensity: number = AR_CONSTANTS.BLUR_RADIUS.MEDIUM;
  private maskOpacity: number = 1.0;
  private maskScale: number = 1.0;
  
  // Performance optimization
  private qualityPreset: 'low' | 'medium' | 'high' = 'medium';
  private useOffscreenCanvas: boolean = false;
  private detectionFrequency: number = 1; // Detect every N frames
  private framesSinceLastDetection: number = 0;
  private adaptiveResolution: boolean = true;
  private currentResolution: { width: number; height: number } = { width: 640, height: 480 };
  private lastPerformanceCheck: number = Date.now();
  
  // Face detection
  private lastFaceLandmarks: FaceLandmarks | null = null;
  private faceDetected: boolean = false;
  
  // Performance tracking
  private performanceMetrics: ARPerformanceMetrics = {
    fps: 0,
    faceDetectionTime: 0,
    renderTime: 0,
    cpuUsage: 0,
    droppedFrames: 0,
    timestamp: Date.now(),
  };
  private frameCount: number = 0;
  private lastFpsUpdate: number = Date.now();
  private processingTimes: number[] = [];
  
  // Mask images cache
  private maskImages: Map<FaceMaskType, HTMLImageElement> = new Map();
  private maskImagesLoaded: Set<FaceMaskType> = new Set();
  
  // Callbacks
  private performanceCallback: ((metrics: ARPerformanceMetrics) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private faceDetectionCallback: ((detected: boolean, landmarks?: FaceLandmarks) => void) | null = null;
  
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
   * Initialize AR Filter Service
   */
  async initialize(options?: { qualityPreset?: 'low' | 'medium' | 'high' }): Promise<ARCapabilities> {
    try {
      console.log('🎭 Initializing AR Filter Service...');
      
      // Set quality preset
      if (options?.qualityPreset) {
        this.setQualityPreset(options.qualityPreset);
      }
      
      // Check capabilities
      this.capabilities = await this.checkCapabilities();
      console.log('✅ AR Capabilities:', this.capabilities);
      
      // Enable OffscreenCanvas if supported
      this.useOffscreenCanvas = this.capabilities.supportsOffscreenCanvas && this.qualityPreset !== 'low';
      console.log(`📊 Performance mode: ${this.qualityPreset}, OffscreenCanvas: ${this.useOffscreenCanvas}`);
      
      // Only initialize FaceMesh if supported
      if (this.capabilities.supportsFaceMesh) {
        await this.initializeFaceMesh();
      } else {
        console.warn('⚠️ FaceMesh not supported, using fallback mode');
      }
      
      // Preload mask images
      await this.preloadMaskImages();
      
      return this.capabilities;
    } catch (error) {
      console.error('❌ AR Filter initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set quality preset
   */
  private setQualityPreset(preset: 'low' | 'medium' | 'high') {
    this.qualityPreset = preset;
    
    switch (preset) {
      case 'low':
        this.detectionFrequency = 3; // Detect every 3 frames
        this.currentResolution = { width: 480, height: 360 };
        this.adaptiveResolution = true;
        break;
      case 'medium':
        this.detectionFrequency = 2; // Detect every 2 frames
        this.currentResolution = { width: 640, height: 480 };
        this.adaptiveResolution = true;
        break;
      case 'high':
        this.detectionFrequency = 1; // Detect every frame
        this.currentResolution = { width: 640, height: 480 };
        this.adaptiveResolution = false;
        break;
    }
    
    console.log(`🎚️ Quality preset: ${preset}`, {
      detectionFrequency: this.detectionFrequency,
      resolution: this.currentResolution,
      adaptiveResolution: this.adaptiveResolution,
    });
  }

  /**
   * Check browser AR capabilities
   */
  private async checkCapabilities(): Promise<ARCapabilities> {
    const warnings: string[] = [];
    const devicePerformance = getDevicePerformance();
    
    // Check FaceMesh support
    let supportsFaceMesh = false;
    try {
      // Check if TensorFlow.js and FaceMesh are available
      supportsFaceMesh = !!(faceLandmarksDetection && typeof faceLandmarksDetection.createDetector === 'function');
    } catch {
      warnings.push('TensorFlow.js FaceMesh not available');
    }
    
    // Check Canvas support
    const supportsCanvas = !!document.createElement('canvas').getContext;
    if (!supportsCanvas) {
      warnings.push('Canvas API not supported');
    }
    
    // Check OffscreenCanvas support
    const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    
    // Check WebGL support
    let supportsWebGL = false;
    try {
      const testCanvas = document.createElement('canvas');
      supportsWebGL = !!(testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'));
    } catch {
      warnings.push('WebGL not supported');
    }
    
    // Check captureStream support
    const supportsCaptureStream = 'captureStream' in HTMLCanvasElement.prototype;
    if (!supportsCaptureStream) {
      warnings.push('Canvas captureStream not supported');
    }
    
    // Get recommended masks based on device performance
    const recommendedMasks = getRecommendedMasks(devicePerformance);
    
    // Add performance warnings
    if (devicePerformance === 'low') {
      warnings.push('Low-end device detected. AR features may be limited.');
    }
    
    return {
      supportsFaceMesh,
      supportsCanvas,
      supportsOffscreenCanvas,
      supportsWebGL,
      supportsCaptureStream,
      recommendedMasks,
      warnings,
      devicePerformance,
    };
  }

  /**
   * Initialize TensorFlow.js FaceMesh detector
   * SIMPLIFIED: Using canvas filters only, no face detection needed
   */
  private async initializeFaceMesh(): Promise<void> {
    try {
      console.log('🔧 Initializing canvas filters (no face detection)...');
      
      // Skip TensorFlow loading - we're using simple canvas filters
      this.detector = null;
      
      console.log('✅ Canvas filters ready (simplified mode)');
    } catch (error) {
      console.error('❌ Failed to initialize filters:', error);
      throw new Error('Filter initialization failed');
    }
  }

  /**
   * Preload mask images
   */
  private async preloadMaskImages(): Promise<void> {
    const maskTypes: FaceMaskType[] = ['sunglasses', 'dog_ears', 'cat_ears', 'party_hat'];
    
    const loadPromises = maskTypes.map(async (type) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // For now, use placeholder images - replace with actual assets
        // In production, these should be actual PNG files in public/assets/masks/
        img.src = `/assets/masks/${type}.png`;
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            this.maskImages.set(type, img);
            this.maskImagesLoaded.add(type);
            console.log(`✅ Loaded mask: ${type}`);
            resolve();
          };
          img.onerror = () => {
            console.warn(`⚠️ Failed to load mask: ${type}, will use fallback`);
            resolve(); // Don't reject, just skip this mask
          };
          
          // Timeout after 5 seconds
          setTimeout(() => resolve(), 5000);
        });
      } catch (error) {
        console.warn(`⚠️ Error loading mask ${type}:`, error);
      }
    });
    
    await Promise.all(loadPromises);
    console.log(`✅ Preloaded ${this.maskImagesLoaded.size} mask images`);
  }

  /**
   * Start processing video stream with AR effects
   */
  async startProcessing(
    stream: MediaStream,
    maskType: FaceMaskType = 'none',
    blurState: BlurState = 'disabled',
    blurIntensity: number = AR_CONSTANTS.BLUR_RADIUS.MEDIUM
  ): Promise<MediaStream> {
    try {
      console.log('🎬 Starting AR processing...', { maskType, blurState });
      
      this.currentMask = maskType;
      this.blurState = blurState;
      this.blurIntensity = blurIntensity;
      this.originalStream = stream;
      
      // Create video element
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
      this.canvas.width = AR_CONSTANTS.CANVAS_WIDTH;
      this.canvas.height = AR_CONSTANTS.CANVAS_HEIGHT;
      this.ctx = this.canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true, // Reduce latency
      });
      
      if (!this.ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // Start processing loop
      this.startProcessingLoop();
      
      // Capture canvas stream
      this.processedStream = this.canvas.captureStream(AR_CONSTANTS.TARGET_FPS);
      
      // Add audio tracks from original stream
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        this.processedStream!.addTrack(track);
      });
      
      console.log('✅ AR processing started');
      return this.processedStream;
    } catch (error) {
      console.error('❌ Failed to start AR processing:', error);
      if (this.errorCallback) {
        this.errorCallback(error as Error);
      }
      throw error;
    }
  }

  /**
   * Main processing loop using requestAnimationFrame
   */
  private startProcessingLoop(): void {
    const processFrame = async () => {
      if (!this.videoElement || !this.canvas || !this.ctx) return;
      
      const startTime = performance.now();
      
      try {
        // Apply canvas filter to element for instant preview
        if (this.currentMask !== 'none') {
          this.applyCanvasFilter(this.currentMask);
        } else {
          // Reset filter when no mask
          if (this.canvas instanceof HTMLCanvasElement) {
            (this.canvas as HTMLCanvasElement).style.filter = 'none';
          }
        }
        
        // Draw video frame to canvas (filter already applied to element)
        this.ctx.drawImage(
          this.videoElement,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
        
        // Apply blur if active
        if (this.blurState === 'active' && this.blurIntensity > 0) {
          this.applyBlur();
        }
        
        // Update performance metrics
        const renderTime = performance.now() - startTime;
        this.performanceMetrics.renderTime = renderTime;
        this.updatePerformanceMetrics(renderTime);
        
      } catch (error) {
        console.error('❌ Error in processing loop:', error);
        this.performanceMetrics.droppedFrames++;
      }
      
      // Continue loop
      this.animationFrameId = requestAnimationFrame(processFrame);
    };
    
    processFrame();
  }

  /**
   * Adjust performance based on metrics
   */
  private adjustPerformance(): void {
    const cpuUsage = this.performanceMetrics.cpuUsage;
    const fps = this.performanceMetrics.fps;
    
    // If CPU usage is high or FPS is low, reduce detection frequency
    if (cpuUsage > AR_CONSTANTS.CPU_WARNING_THRESHOLD || fps < AR_CONSTANTS.MIN_FPS) {
      if (this.detectionFrequency < 5) {
        this.detectionFrequency++;
        console.log(`⚡ Performance adjustment: Reduced detection frequency to every ${this.detectionFrequency} frames`);
      }
    } else if (cpuUsage < AR_CONSTANTS.CPU_WARNING_THRESHOLD * 0.5 && fps > AR_CONSTANTS.TARGET_FPS * 0.9) {
      // If performance is good, increase detection frequency
      if (this.detectionFrequency > 1) {
        this.detectionFrequency--;
        console.log(`⚡ Performance adjustment: Increased detection frequency to every ${this.detectionFrequency} frames`);
      }
    }
  }

  /**
   * Apply simple canvas filter using CSS filter property (FAST!)
   * NEW: Apply to canvas element directly for instant preview visibility
   */
  private applyCanvasFilter(filterType: FaceMaskType): void {
    if (!this.ctx || !this.canvas) return;
    
    // Apply CSS filter DIRECTLY to canvas element for instant visual effect
    let filterString = 'none';
    
    switch (filterType) {
      case 'sunglasses':
        // Cool blue tint - using hue rotation and brightness
        filterString = 'hue-rotate(210deg) brightness(1.1) contrast(1.2)';
        console.log('🎨 Applied sunglasses filter (cool blue)');
        break;
        
      case 'dog_ears':
        // Warm sepia tone
        filterString = 'sepia(0.7) brightness(1.05) contrast(1.1)';
        console.log('🎨 Applied dog ears filter (warm sepia)');
        break;
        
      case 'cat_ears':
        // High contrast with slight saturation
        filterString = 'contrast(1.4) saturate(1.2) brightness(1.05)';
        console.log('🎨 Applied cat ears filter (high contrast)');
        break;
        
      case 'party_hat':
        // Vibrant saturation boost
        filterString = 'saturate(1.8) brightness(1.1) contrast(1.15) hue-rotate(10deg)';
        console.log('🎨 Applied party hat filter (vibrant)');
        break;
    }
    
    // Apply filter DIRECTLY to canvas element (not context) for instant preview
    if (this.canvas instanceof HTMLCanvasElement) {
      (this.canvas as HTMLCanvasElement).style.filter = filterString;
    }
  }

  /**
   * Detect face and draw mask overlay (DEPRECATED - using simple filters now)
   */
  private async detectAndDrawMask(): Promise<void> {
    // Simplified: No face detection, using canvas filters instead
    console.log('⚠️ Face detection disabled, using canvas filters');
    return;
  }

  /**
   * Draw mask overlay on canvas
   */
  private drawMask(landmarks: FaceLandmarks): void {
    if (!this.ctx || !this.canvas) return;
    
    const maskImage = this.maskImages.get(this.currentMask);
    if (!maskImage || !this.maskImagesLoaded.has(this.currentMask)) {
      // Fallback: draw simple overlay
      this.drawFallbackMask(landmarks);
      return;
    }
    
    const keypoints = landmarks.keypoints;
    const scaleX = this.canvas.width / this.videoElement!.videoWidth;
    const scaleY = this.canvas.height / this.videoElement!.videoHeight;
    
    // Draw mask based on type
    switch (this.currentMask) {
      case 'sunglasses':
        this.drawSunglasses(keypoints, maskImage, scaleX, scaleY);
        break;
      case 'dog_ears':
      case 'cat_ears':
        this.drawEars(keypoints, maskImage, scaleX, scaleY);
        break;
      case 'party_hat':
        this.drawPartyHat(keypoints, maskImage, scaleX, scaleY);
        break;
    }
  }

  /**
   * Draw sunglasses on face
   */
  private drawSunglasses(keypoints: any[], image: HTMLImageElement, scaleX: number, scaleY: number): void {
    if (!this.ctx) return;
    
    // Get eye landmarks
    const leftEye = keypoints[AR_CONSTANTS.LANDMARKS.LEFT_EYE_OUTER];
    const rightEye = keypoints[AR_CONSTANTS.LANDMARKS.RIGHT_EYE_OUTER];
    
    if (!leftEye || !rightEye) return;
    
    const eyeDistance = Math.hypot(
      (rightEye.x - leftEye.x) * scaleX,
      (rightEye.y - leftEye.y) * scaleY
    );
    
    const centerX = ((leftEye.x + rightEye.x) / 2) * scaleX;
    const centerY = ((leftEye.y + rightEye.y) / 2) * scaleY;
    
    const angle = Math.atan2(
      (rightEye.y - leftEye.y) * scaleY,
      (rightEye.x - leftEye.x) * scaleX
    );
    
    const width = eyeDistance * 2.5 * this.maskScale;
    const height = width * 0.4;
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(angle);
    this.ctx.globalAlpha = this.maskOpacity;
    this.ctx.drawImage(image, -width / 2, -height / 2, width, height);
    this.ctx.restore();
  }

  /**
   * Draw ears (dog/cat) on face
   */
  private drawEars(keypoints: any[], image: HTMLImageElement, scaleX: number, scaleY: number): void {
    if (!this.ctx) return;
    
    const headTop = keypoints[AR_CONSTANTS.LANDMARKS.HEAD_TOP];
    const leftEar = keypoints[AR_CONSTANTS.LANDMARKS.LEFT_EAR];
    const rightEar = keypoints[AR_CONSTANTS.LANDMARKS.RIGHT_EAR];
    
    if (!headTop || !leftEar || !rightEar) return;
    
    const headWidth = Math.hypot(
      (rightEar.x - leftEar.x) * scaleX,
      (rightEar.y - leftEar.y) * scaleY
    );
    
    const centerX = ((leftEar.x + rightEar.x) / 2) * scaleX;
    const centerY = headTop.y * scaleY - headWidth * 0.3;
    
    const width = headWidth * 1.5 * this.maskScale;
    const height = width * 1.2;
    
    this.ctx.save();
    this.ctx.globalAlpha = this.maskOpacity;
    this.ctx.drawImage(image, centerX - width / 2, centerY - height, width, height);
    this.ctx.restore();
  }

  /**
   * Draw party hat on head
   */
  private drawPartyHat(keypoints: any[], image: HTMLImageElement, scaleX: number, scaleY: number): void {
    if (!this.ctx) return;
    
    const headTop = keypoints[AR_CONSTANTS.LANDMARKS.HEAD_TOP];
    const chin = keypoints[AR_CONSTANTS.LANDMARKS.CHIN];
    
    if (!headTop || !chin) return;
    
    const headHeight = Math.abs((headTop.y - chin.y) * scaleY);
    const centerX = headTop.x * scaleX;
    const centerY = headTop.y * scaleY;
    
    const width = headHeight * 0.8 * this.maskScale;
    const height = width * 1.5;
    
    this.ctx.save();
    this.ctx.globalAlpha = this.maskOpacity;
    this.ctx.drawImage(image, centerX - width / 2, centerY - height, width, height);
    this.ctx.restore();
  }

  /**
   * Fallback mask drawing (simple shapes if images not loaded)
   */
  private drawFallbackMask(landmarks: FaceLandmarks): void {
    if (!this.ctx) return;
    
    // Draw simple colored overlay as fallback
    const keypoints = landmarks.keypoints;
    const scaleX = this.canvas!.width / this.videoElement!.videoWidth;
    const scaleY = this.canvas!.height / this.videoElement!.videoHeight;
    
    this.ctx.save();
    this.ctx.globalAlpha = 0.7;
    
    switch (this.currentMask) {
      case 'sunglasses': {
        const leftEye = keypoints[AR_CONSTANTS.LANDMARKS.LEFT_EYE_OUTER];
        const rightEye = keypoints[AR_CONSTANTS.LANDMARKS.RIGHT_EYE_OUTER];
        if (leftEye && rightEye) {
          this.ctx.fillStyle = '#000000';
          const eyeRadius = 20;
          this.ctx.beginPath();
          this.ctx.arc(leftEye.x * scaleX, leftEye.y * scaleY, eyeRadius, 0, 2 * Math.PI);
          this.ctx.arc(rightEye.x * scaleX, rightEye.y * scaleY, eyeRadius, 0, 2 * Math.PI);
          this.ctx.fill();
        }
        break;
      }
      default:
        // No fallback for other masks
        break;
    }
    
    this.ctx.restore();
  }

  /**
   * Apply blur effect to canvas
   */
  private applyBlur(): void {
    if (!this.ctx || !this.canvas) return;
    
    // Use CSS filter for blur (faster than manual convolution)
    this.ctx.filter = `blur(${this.blurIntensity}px)`;
    this.ctx.drawImage(this.canvas, 0, 0);
    this.ctx.filter = 'none';
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(frameTime: number): void {
    this.frameCount++;
    this.processingTimes.push(frameTime);
    
    // Keep last 60 frames for averaging
    if (this.processingTimes.length > 60) {
      this.processingTimes.shift();
    }
    
    // Update FPS every second
    const now = Date.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.performanceMetrics.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      
      // Estimate CPU usage
      const avgFrameTime = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
      const targetFrameTime = 1000 / AR_CONSTANTS.TARGET_FPS;
      this.performanceMetrics.cpuUsage = Math.min(100, (avgFrameTime / targetFrameTime) * 100);
      
      this.performanceMetrics.timestamp = now;
      
      // Notify callback
      if (this.performanceCallback) {
        this.performanceCallback(this.performanceMetrics);
      }
    }
  }

  /**
   * Change mask type
   */
  setMask(maskType: FaceMaskType): void {
    console.log(`🎭 [AR Filter] Changing mask from "${this.currentMask}" to "${maskType}"`);
    this.currentMask = maskType;
    
    // Apply filter immediately to canvas element for instant preview
    if (this.canvas && this.canvas instanceof HTMLCanvasElement) {
      if (maskType !== 'none') {
        this.applyCanvasFilter(maskType);
      } else {
        (this.canvas as HTMLCanvasElement).style.filter = 'none';
      }
    }
    
    console.log(`✅ [AR Filter] Mask updated! Filter applied immediately.`);
  }

  /**
   * Set blur state
   */
  setBlurState(state: BlurState): void {
    console.log(`👁️ Setting blur state: ${state}`);
    this.blurState = state;
  }

  /**
   * Set blur intensity
   */
  setBlurIntensity(intensity: number): void {
    this.blurIntensity = Math.max(0, Math.min(AR_CONSTANTS.BLUR_RADIUS.MAX, intensity));
  }

  /**
   * Set mask opacity
   */
  setMaskOpacity(opacity: number): void {
    this.maskOpacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Set mask scale
   */
  setMaskScale(scale: number): void {
    this.maskScale = Math.max(AR_CONSTANTS.MASK_SCALE.MIN, Math.min(AR_CONSTANTS.MASK_SCALE.MAX, scale));
  }

  /**
   * Get processed stream
   */
  getProcessedStream(): MediaStream | null {
    return this.processedStream;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): ARPerformanceMetrics {
    return { ...this.performanceMetrics };
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
   * Set face detection callback
   */
  setFaceDetectionCallback(callback: (detected: boolean, landmarks?: FaceLandmarks) => void): void {
    this.faceDetectionCallback = callback;
  }

  /**
   * Check if face is detected
   */
  isFaceDetected(): boolean {
    return this.faceDetected;
  }

  /**
   * Stop processing and cleanup
   */
  stopProcessing(): void {
    console.log('🛑 Stopping AR processing...');
    
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Stop streams
    if (this.processedStream) {
      this.processedStream.getTracks().forEach(track => track.stop());
      this.processedStream = null;
    }
    
    // Clean up video element
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    // Clean up canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      this.ctx = null;
    }
    this.canvas = null;
    
    // Reset state
    this.originalStream = null;
    this.faceDetected = false;
    this.lastFaceLandmarks = null;
    
    console.log('✅ AR processing stopped');
  }

  /**
   * Destroy service and free resources
   */
  async destroy(): Promise<void> {
    console.log('🗑️ Destroying AR Filter Service...');
    
    this.stopProcessing();
    
    // Dispose TensorFlow resources
    if (this.detector) {
      try {
        this.detector.dispose();
      } catch (error) {
        console.error('Error disposing detector:', error);
      }
      this.detector = null;
    }
    
    // Clear mask images
    this.maskImages.clear();
    this.maskImagesLoaded.clear();
    
    // Reset callbacks
    this.performanceCallback = null;
    this.errorCallback = null;
    this.faceDetectionCallback = null;
    
    console.log('✅ AR Filter Service destroyed');
  }
}

// Export singleton instance
const arFilterService = ARFilterService.getInstance();
export default arFilterService;
