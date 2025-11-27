// Voice Filter Service - Real-time Audio Processing
// Implements Chipmunk, Deep Bass, and Robot voice filters using Web Audio API

import {
  VoiceFilterType,
  AudioPerformanceMetrics,
  AudioCapabilities,
  AUDIO_CONSTANTS,
  calculatePitchShift,
} from '../types/voiceFilters';

// Performance monitoring
interface PerformanceMonitor {
  startTime: number;
  bufferUnderruns: number;
  lastCPUCheck: number;
  processingTimes: number[];
}

class VoiceFilterService {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  
  // Filter nodes
  private gainNode: GainNode | null = null;
  private biquadFilter: BiquadFilterNode | null = null;
  private convolver: ConvolverNode | null = null;
  private waveShaperNode: WaveShaperNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private ringModGain: GainNode | null = null;
  
  // Pitch shifting (for chipmunk/deep)
  private scriptProcessor: ScriptProcessorNode | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private pitchShiftBuffer: Float32Array[] = [];
  private pitchShiftRatio: number = 1.0;
  
  // State
  private currentFilter: VoiceFilterType = 'none';
  private currentIntensity: number = 0.6;
  private originalStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  private isProcessing: boolean = false;
  
  // Performance monitoring
  private performanceMonitor: PerformanceMonitor = {
    startTime: 0,
    bufferUnderruns: 0,
    lastCPUCheck: 0,
    processingTimes: [],
  };
  
  // Callbacks
  private onPerformanceUpdate?: (metrics: AudioPerformanceMetrics) => void;
  private onError?: (error: Error) => void;

  /**
   * Initialize audio context and check browser capabilities
   */
  async initialize(): Promise<AudioCapabilities> {
    try {
      // Check browser support
      const capabilities = this.checkBrowserCapabilities();
      
      if (!capabilities.supportsWebAudio) {
        throw new Error('Web Audio API not supported in this browser');
      }
      
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        sampleRate: AUDIO_CONSTANTS.SAMPLE_RATE,
        latencyHint: 'interactive', // Low latency for real-time
      });
      
      // Resume context if suspended (browser policy)
      // Only try to resume if we have user interaction
      if (this.audioContext.state === 'suspended') {
        // Don't await here - will be resumed on user interaction
        console.log('⚠️ AudioContext suspended - will resume on user interaction');
      }
      
      // Try to load AudioWorklet for pitch shifting (if supported)
      if (capabilities.supportsAudioWorklet) {
        try {
          // Note: AudioWorklet requires separate processor file
          // For now, we'll use ScriptProcessorNode fallback
          console.log('AudioWorklet supported, but using ScriptProcessor for compatibility');
        } catch (err) {
          console.warn('AudioWorklet loading failed, using ScriptProcessor:', err);
        }
      }
      
      console.log('VoiceFilterService initialized', {
        sampleRate: this.audioContext.sampleRate,
        capabilities,
      });
      
      return capabilities;
    } catch (error) {
      console.error('Failed to initialize VoiceFilterService:', error);
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Check browser capabilities for audio processing
   */
  checkBrowserCapabilities(): AudioCapabilities {
    const capabilities: AudioCapabilities = {
      supportsAudioWorklet: false,
      supportsMediaStream: false,
      supportsWebAudio: false,
      recommendedFilters: [],
      warnings: [],
    };
    
    // Check Web Audio API
    capabilities.supportsWebAudio = !!(
      window.AudioContext || (window as any).webkitAudioContext
    );
    
    // Check MediaStream API
    capabilities.supportsMediaStream = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    
    // Check AudioWorklet (Chrome 66+, Safari 14.1+)
    if (capabilities.supportsWebAudio) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const tempContext = new AudioContextClass();
      capabilities.supportsAudioWorklet = !!(tempContext.audioWorklet);
      tempContext.close();
    }
    
    // Determine recommended filters based on browser
    if (capabilities.supportsWebAudio && capabilities.supportsMediaStream) {
      capabilities.recommendedFilters = ['none', 'robot']; // Always safe
      
      if (capabilities.supportsAudioWorklet) {
        capabilities.recommendedFilters.push('chipmunk', 'deep');
      } else {
        capabilities.warnings.push(
          'Pitch-shift filters may have higher latency on this browser'
        );
      }
    }
    
    // Browser-specific warnings
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('firefox') && userAgent.includes('android')) {
      capabilities.warnings.push('Firefox Android may have audio processing issues');
    }
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      capabilities.warnings.push('Safari may require user interaction to start audio');
    }
    
    return capabilities;
  }

  /**
   * Apply voice filter to media stream
   */
  async applyFilter(
    stream: MediaStream,
    filterType: VoiceFilterType,
    intensity: number
  ): Promise<MediaStream> {
    try {
      if (!this.audioContext) {
        await this.initialize();
      }
      
      // Clean up existing processing
      this.cleanup();
      
      // Store original stream and config
      this.originalStream = stream;
      this.currentFilter = filterType;
      this.currentIntensity = Math.max(0, Math.min(1, intensity));
      
      // If no filter, return original stream
      if (filterType === 'none') {
        return stream;
      }
      
      // Create audio source from stream
      this.sourceNode = this.audioContext!.createMediaStreamSource(stream);
      
      // Build filter chain based on type
      const filterChain = this.buildFilterChain(filterType, this.currentIntensity);
      
      // Create destination for processed stream
      this.destinationNode = this.audioContext!.createMediaStreamDestination();
      
      // Connect nodes: source → filters → destination
      let previousNode: AudioNode = this.sourceNode;
      for (const node of filterChain) {
        previousNode.connect(node);
        previousNode = node;
      }
      previousNode.connect(this.destinationNode);
      
      this.processedStream = this.destinationNode.stream;
      this.isProcessing = true;
      this.performanceMonitor.startTime = Date.now();
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
      
      console.log(`Voice filter applied: ${filterType} at ${intensity * 100}% intensity`);
      
      return this.processedStream;
    } catch (error) {
      console.error('Failed to apply voice filter:', error);
      this.handleError(error as Error);
      return stream; // Return original on error
    }
  }

  /**
   * Build filter chain based on filter type
   */
  private buildFilterChain(type: VoiceFilterType, intensity: number): AudioNode[] {
    const chain: AudioNode[] = [];
    
    switch (type) {
      case 'chipmunk':
        chain.push(...this.createChipmunkFilter(intensity));
        break;
      case 'deep':
        chain.push(...this.createDeepBassFilter(intensity));
        break;
      case 'robot':
        chain.push(...this.createRobotFilter(intensity));
        break;
    }
    
    return chain;
  }

  /**
   * Create Chipmunk filter (high-pitched voice)
   * Implementation: Pitch shift up using granular synthesis
   */
  private createChipmunkFilter(intensity: number): AudioNode[] {
    const pitchShiftRatio = calculatePitchShift('chipmunk', intensity);
    this.pitchShiftRatio = pitchShiftRatio;
    
    // Create gain node for volume compensation
    this.gainNode = this.audioContext!.createGain();
    this.gainNode.gain.value = 0.8; // Reduce slightly to prevent clipping
    
    // Create script processor for pitch shifting
    // Note: ScriptProcessorNode is deprecated but still most compatible
    const bufferSize = AUDIO_CONSTANTS.BUFFER_SIZE;
    this.scriptProcessor = this.audioContext!.createScriptProcessor(
      bufferSize,
      1, // mono input
      1  // mono output
    );
    
    // Pitch shift processing
    let phase = 0;
    
    this.scriptProcessor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const outputBuffer = event.outputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      const outputData = outputBuffer.getChannelData(0);
      
      // Simple pitch shift using time-domain resampling
      for (let i = 0; i < outputBuffer.length; i++) {
        const readIndex = phase;
        const readIndexFloor = Math.floor(readIndex);
        const readIndexCeil = Math.ceil(readIndex);
        const fraction = readIndex - readIndexFloor;
        
        // Linear interpolation
        if (readIndexFloor < inputData.length && readIndexCeil < inputData.length) {
          outputData[i] =
            inputData[readIndexFloor] * (1 - fraction) +
            inputData[readIndexCeil] * fraction;
        } else {
          outputData[i] = 0;
        }
        
        phase += pitchShiftRatio;
        if (phase >= inputData.length) {
          phase -= inputData.length;
        }
      }
    };
    
    return [this.gainNode, this.scriptProcessor];
  }

  /**
   * Create Deep Bass filter (low-pitched voice)
   * Implementation: Pitch shift down + low-pass filter + bass boost
   */
  private createDeepBassFilter(intensity: number): AudioNode[] {
    const pitchShiftRatio = calculatePitchShift('deep', intensity);
    this.pitchShiftRatio = pitchShiftRatio;
    
    // Create gain node for bass boost
    this.gainNode = this.audioContext!.createGain();
    this.gainNode.gain.value = 1.2 + (intensity * 0.6); // 1.2x - 1.8x boost
    
    // Create low-pass filter to emphasize bass
    this.biquadFilter = this.audioContext!.createBiquadFilter();
    this.biquadFilter.type = 'lowpass';
    this.biquadFilter.frequency.value =
      AUDIO_CONSTANTS.FREQUENCIES.LOW_PASS_CUTOFF -
      (intensity * 300); // 800Hz - 500Hz based on intensity
    this.biquadFilter.Q.value = 1.0;
    
    // Create script processor for pitch shifting (same as chipmunk but lower ratio)
    const bufferSize = AUDIO_CONSTANTS.BUFFER_SIZE;
    this.scriptProcessor = this.audioContext!.createScriptProcessor(bufferSize, 1, 1);
    
    let phase = 0;
    
    this.scriptProcessor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const outputBuffer = event.outputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      const outputData = outputBuffer.getChannelData(0);
      
      for (let i = 0; i < outputBuffer.length; i++) {
        const readIndex = phase;
        const readIndexFloor = Math.floor(readIndex);
        const readIndexCeil = Math.ceil(readIndex);
        const fraction = readIndex - readIndexFloor;
        
        if (readIndexFloor < inputData.length && readIndexCeil < inputData.length) {
          outputData[i] =
            inputData[readIndexFloor] * (1 - fraction) +
            inputData[readIndexCeil] * fraction;
        } else {
          outputData[i] = 0;
        }
        
        phase += pitchShiftRatio;
        if (phase >= inputData.length) {
          phase -= inputData.length;
        }
      }
    };
    
    return [this.gainNode, this.scriptProcessor, this.biquadFilter];
  }

  /**
   * Create Robot filter (metallic/digital voice)
   * Implementation: Ring modulation + bit crushing
   */
  private createRobotFilter(intensity: number): AudioNode[] {
    const modulationFreq = calculatePitchShift('robot', intensity);
    
    // Create oscillator for ring modulation
    this.oscillator = this.audioContext!.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = modulationFreq;
    this.oscillator.start();
    
    // Create gain node for ring modulation
    this.ringModGain = this.audioContext!.createGain();
    this.ringModGain.gain.value = 0; // Will be modulated by oscillator
    
    // Connect oscillator to modulate gain
    this.oscillator.connect(this.ringModGain.gain);
    
    // Create wave shaper for bit crushing effect
    this.waveShaperNode = this.audioContext!.createWaveShaper();
    
    // Generate bit-crush curve
    const bitDepth = Math.floor(16 - (intensity * 12)); // 16-bit to 4-bit based on intensity
    const steps = Math.pow(2, bitDepth);
    const curve = new Float32Array(65536);
    for (let i = 0; i < 65536; i++) {
      const x = (i - 32768) / 32768; // -1 to 1
      const quantized = Math.round(x * steps) / steps;
      curve[i] = quantized;
    }
    this.waveShaperNode.curve = curve;
    this.waveShaperNode.oversample = 'none'; // No oversampling for digital effect
    
    // Create gain node for output volume
    this.gainNode = this.audioContext!.createGain();
    this.gainNode.gain.value = 0.7; // Reduce volume to prevent clipping
    
    return [this.ringModGain, this.waveShaperNode, this.gainNode];
  }

  /**
   * Remove current filter and return to original stream
   */
  removeFilter(): MediaStream | null {
    console.log('Removing voice filter');
    this.cleanup();
    return this.originalStream;
  }

  /**
   * Get currently processed stream
   */
  getProcessedStream(): MediaStream | null {
    if (this.currentFilter === 'none') {
      return this.originalStream;
    }
    return this.processedStream;
  }

  /**
   * Update filter intensity without rebuilding entire chain
   */
  async updateIntensity(intensity: number): Promise<void> {
    if (!this.isProcessing || !this.originalStream) {
      return;
    }
    
    // Reapply filter with new intensity
    await this.applyFilter(this.originalStream, this.currentFilter, intensity);
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    const checkPerformance = () => {
      if (!this.isProcessing) return;
      
      const now = Date.now();
      const elapsed = now - this.performanceMonitor.lastCPUCheck;
      
      if (elapsed >= 1000) { // Check every second
        const metrics = this.getPerformanceMetrics();
        
        // Emit metrics to callback
        if (this.onPerformanceUpdate) {
          this.onPerformanceUpdate(metrics);
        }
        
        // Auto-disable on high CPU
        if (metrics.cpuUsage > AUDIO_CONSTANTS.PERFORMANCE.CPU_DISABLE_THRESHOLD) {
          console.warn('CPU usage too high, disabling filter');
          this.removeFilter();
        }
        
        this.performanceMonitor.lastCPUCheck = now;
        this.performanceMonitor.processingTimes = []; // Reset for next interval
      }
      
      setTimeout(checkPerformance, 1000);
    };
    
    this.performanceMonitor.lastCPUCheck = Date.now();
    checkPerformance();
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): AudioPerformanceMetrics {
    const avgProcessingTime =
      this.performanceMonitor.processingTimes.length > 0
        ? this.performanceMonitor.processingTimes.reduce((a, b) => a + b, 0) /
          this.performanceMonitor.processingTimes.length
        : 0;
    
    // Estimate CPU usage based on processing time vs real time
    const cpuUsage = Math.min(
      100,
      (avgProcessingTime / (AUDIO_CONSTANTS.BUFFER_SIZE / AUDIO_CONSTANTS.SAMPLE_RATE * 1000)) * 100
    );
    
    return {
      cpuUsage,
      processingLatency: avgProcessingTime,
      bufferUnderruns: this.performanceMonitor.bufferUnderruns,
      audioContextState: this.audioContext?.state || 'closed',
      timestamp: Date.now(),
    };
  }

  /**
   * Set performance update callback
   */
  setPerformanceCallback(callback: (metrics: AudioPerformanceMetrics) => void): void {
    this.onPerformanceUpdate = callback;
  }

  /**
   * Set error callback
   */
  setErrorCallback(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('VoiceFilterService error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop processing
    this.isProcessing = false;
    
    // Disconnect and cleanup nodes
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.biquadFilter) {
      this.biquadFilter.disconnect();
      this.biquadFilter = null;
    }
    
    if (this.waveShaperNode) {
      this.waveShaperNode.disconnect();
      this.waveShaperNode = null;
    }
    
    if (this.ringModGain) {
      this.ringModGain.disconnect();
      this.ringModGain = null;
    }
    
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }
    
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
    
    if (this.destinationNode) {
      this.destinationNode.disconnect();
      this.destinationNode = null;
    }
    
    // Reset state
    this.currentFilter = 'none';
    this.processedStream = null;
  }

  /**
   * Destroy service and cleanup all resources
   */
  async destroy(): Promise<void> {
    this.cleanup();
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.originalStream = null;
    console.log('VoiceFilterService destroyed');
  }
}

// Export singleton instance
const voiceFilterService = new VoiceFilterService();
export default voiceFilterService;
