/**
 * AR Filter Context
 * Manages AR face masks and blur-start state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import ARFilterService from '../services/arFilter';
import { pythonFilterClient } from '../services/pythonFilterClient';
import {
  FaceMaskType,
  BlurState,
  ARCapabilities,
  ARPerformanceMetrics,
  FaceLandmarks,
  AR_CONSTANTS,
} from '../types/arFilters';

interface ARFilterContextType {
  // State
  selectedMask: FaceMaskType;
  blurState: BlurState;
  blurIntensity: number;
  revealCountdown: number;
  isProcessing: boolean;
  isInitialized: boolean;
  capabilities: ARCapabilities | null;
  performanceMetrics: ARPerformanceMetrics | null;
  faceDetected: boolean;
  lastLandmarks: FaceLandmarks | null;
  
  // Methods
  initialize: () => Promise<ARCapabilities>;
  setMask: (mask: FaceMaskType) => void;
  setBlurIntensity: (intensity: number) => void;
  startBlurCountdown: (duration?: number) => void;
  enableManualBlur: () => void;
  revealVideo: () => void;
  getProcessedStream: (stream: MediaStream) => Promise<MediaStream>;
  stopProcessing: () => void;
  reset: () => void;
}

const ARFilterContext = createContext<ARFilterContextType | undefined>(undefined);

export const ARFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state
  const [selectedMask, setSelectedMask] = useState<FaceMaskType>('none');
  const [blurState, setBlurState] = useState<BlurState>('disabled');
  const [blurIntensity, setBlurIntensityState] = useState<number>(AR_CONSTANTS.BLUR_RADIUS.MEDIUM);
  const [revealCountdown, setRevealCountdown] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // AR state
  const [capabilities, setCapabilities] = useState<ARCapabilities | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<ARPerformanceMetrics | null>(null);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [lastLandmarks, setLastLandmarks] = useState<FaceLandmarks | null>(null);
  
  // Refs
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);

  /**
   * Initialize AR Filter Service
   */
  const initialize = useCallback(async (): Promise<ARCapabilities> => {
    if (isInitialized) {
      return capabilities!;
    }

    try {
      console.log('🎭 Initializing AR Filter Context...');
      
      // Try to connect to Python filter service first
      try {
        await pythonFilterClient.connect();
        console.log('✅ Using Python filter backend (OpenCV)');
        
        // Mock capabilities for Python backend (no face detection)
        const caps: ARCapabilities = {
          supportsFaceMesh: false,
          supportsCanvas: true,
          supportsOffscreenCanvas: false,
          supportsWebGL: false,
          supportsCaptureStream: true,
          recommendedMasks: ['grayscale', 'sepia', 'invert', 'cool', 'warm', 'vibrant'],
          warnings: [],
          devicePerformance: 'high',
        };
        
        setCapabilities(caps);
        setIsInitialized(true);
        return caps;
      } catch (pythonError) {
        console.warn('⚠️ Python filter service not available, falling back to JS:', pythonError);
        
        // Fallback to JavaScript implementation
        const caps = await ARFilterService.getInstance().initialize();
        setCapabilities(caps);
        setIsInitialized(true);
        
        // Set up callbacks for JS implementation
        // Performance and error callbacks
        ARFilterService.getInstance().setPerformanceCallback((metrics: ARPerformanceMetrics) => {
          setPerformanceMetrics(metrics);
          
          if (metrics.cpuUsage > AR_CONSTANTS.CPU_DISABLE_THRESHOLD || 
              metrics.fps < AR_CONSTANTS.FPS_WARNING_THRESHOLD) {
            console.warn('⚠️ Poor performance detected, consider disabling AR');
          }
        });
        
        ARFilterService.getInstance().setErrorCallback((error: Error) => {
          console.error('❌ AR Filter error:', error);
          setSelectedMask('none');
          setBlurState('disabled');
        });
        
        return caps;
      }
    } catch (error) {
      console.error('❌ AR Filter initialization failed:', error);
      throw error;
    }
  }, [isInitialized, capabilities]);

  /**
   * Set mask type
   */
  const setMask = useCallback((mask: FaceMaskType) => {
    console.log(`🎭 Setting mask: ${mask}`);
    setSelectedMask(mask);
    
    // Use Python client if connected, otherwise fallback to JS
    if (pythonFilterClient.isConnected()) {
      pythonFilterClient.setFilter(mask);
    } else {
      ARFilterService.getInstance().setMask(mask);
    }
    
    // Save to localStorage
    localStorage.setItem('omegoo_ar_mask', mask);
  }, []);

  /**
   * Set blur intensity
   */
  const setBlurIntensity = useCallback((intensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(AR_CONSTANTS.BLUR_RADIUS.MAX, intensity));
    setBlurIntensityState(clampedIntensity);
    ARFilterService.getInstance().setBlurIntensity(clampedIntensity);
  }, []);

  /**
   * Start blur countdown timer
   */
  const startBlurCountdown = useCallback((duration: number = AR_CONSTANTS.DEFAULT_BLUR_DURATION) => {
    console.log(`👁️ Starting blur countdown: ${duration}s`);
    
    setBlurState('active');
    setRevealCountdown(duration);
    ARFilterService.getInstance().setBlurState('active');
    
    // Save duration preference
    localStorage.setItem('omegoo_blur_duration', duration.toString());
    
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // Start countdown
    let remaining = duration;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setRevealCountdown(remaining);
      
      if (remaining <= 0) {
        // Auto-reveal when countdown ends
        console.log('⏰ Countdown finished, auto-revealing...');
        // Inline reveal logic to avoid circular dependency
        setBlurState('revealed');
        setRevealCountdown(0);
        ARFilterService.getInstance().setBlurState('revealed');
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }, AR_CONSTANTS.BLUR_COUNTDOWN_INTERVAL);
  }, []);

  /**
   * Reveal video (stop blur)
   */
  const revealVideo = useCallback(() => {
    console.log('👁️ Revealing video...');
    
    setBlurState('revealed');
    setRevealCountdown(0);
    ARFilterService.getInstance().setBlurState('revealed');
    
    // Clear countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Emit analytics event (to be implemented in socket service)
    // socket.emit('video-revealed', { timestamp: Date.now() });
  }, []);

  /**
   * Get processed video stream with AR effects
   */
  const getProcessedStream = useCallback(async (stream: MediaStream, videoElement?: HTMLVideoElement): Promise<MediaStream> => {
    try {
      setIsProcessing(true);
      
      // Ensure service is initialized
      if (!isInitialized) {
        await initialize();
      }
      
      // Use Python backend if connected
      if (pythonFilterClient.isConnected()) {
        console.log('🐍 Using Python filter backend');
        const processedStream = await pythonFilterClient.startProcessing(stream, selectedMask);
        currentStreamRef.current = processedStream;
        return processedStream;
      }
      
      // Fallback to JavaScript implementation (canvas-based, no face detection)
      console.log('📜 Using canvas filter implementation');
      const processedStream = await ARFilterService.getInstance().startProcessing(
        stream,
        selectedMask,
        blurState,
        blurIntensity,
        videoElement
      );
      
      currentStreamRef.current = processedStream;
      
      return processedStream;
    } catch (error) {
      console.error('❌ Failed to get processed stream:', error);
      setIsProcessing(false);
      // Return original stream as fallback
      return stream;
    }
  }, [isInitialized, initialize, selectedMask, blurState, blurIntensity]);

  /**
   * Stop AR processing
   */
  const stopProcessing = useCallback(() => {
    console.log('🛑 Stopping AR processing...');
    
    // Stop both Python and JS services
    if (pythonFilterClient.isConnected()) {
      pythonFilterClient.stopProcessing();
    }
    ARFilterService.getInstance().stopProcessing();
    
    currentStreamRef.current = null;
    setIsProcessing(false);
    setFaceDetected(false);
    setLastLandmarks(null);
    
    // Clear countdown
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const enableManualBlur = useCallback(() => {
    if (blurState === 'manual') {
      return;
    }

    console.log('👁️ Manually enabling blur...');

    setBlurState('manual');
    setRevealCountdown(0);
    ARFilterService.getInstance().setBlurState('manual');

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, [blurState]);

  /**
   * Reset to defaults
   */
  const reset = useCallback(() => {
    console.log('🔄 Resetting AR Filter Context...');
    
    stopProcessing();
    
    setSelectedMask('none');
    setBlurState('disabled');
    setBlurIntensityState(AR_CONSTANTS.BLUR_RADIUS.MEDIUM);
    setRevealCountdown(0);
    
    ARFilterService.getInstance().setMask('none');
    ARFilterService.getInstance().setBlurState('disabled');
  }, [stopProcessing]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up AR Filter Context...');
      
      stopProcessing();
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [stopProcessing]);

  /**
   * Update service when mask or blur state changes
   */
  useEffect(() => {
    if (isProcessing) {
      ARFilterService.getInstance().setMask(selectedMask);
      ARFilterService.getInstance().setBlurState(blurState);
      ARFilterService.getInstance().setBlurIntensity(blurIntensity);
    }
  }, [selectedMask, blurState, blurIntensity, isProcessing]);

  const value: ARFilterContextType = {
    // State
    selectedMask,
    blurState,
    blurIntensity,
    revealCountdown,
    isProcessing,
    isInitialized,
    capabilities,
    performanceMetrics,
    faceDetected,
    lastLandmarks,
    
    // Methods
    initialize,
    setMask,
    setBlurIntensity,
    startBlurCountdown,
    enableManualBlur,
    revealVideo,
    getProcessedStream,
    stopProcessing,
    reset,
  };

  return (
    <ARFilterContext.Provider value={value}>
      {children}
    </ARFilterContext.Provider>
  );
};

/**
 * Hook to use AR Filter Context
 */
export const useARFilter = (): ARFilterContextType => {
  const context = useContext(ARFilterContext);
  if (!context) {
    throw new Error('useARFilter must be used within ARFilterProvider');
  }
  return context;
};

export default ARFilterContext;

