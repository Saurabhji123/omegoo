// Voice Filter Context - State Management for Real-time Voice Filters

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import VoiceFilterService from '../services/voiceFilter';
import {
  VoiceFilterType,
  AudioPerformanceMetrics,
  AudioCapabilities,
  AUDIO_CONSTANTS,
} from '../types/voiceFilters';

interface VoiceFilterContextType {
  // State
  selectedFilter: VoiceFilterType;
  intensity: number;
  isEnabled: boolean;
  isPreviewMode: boolean;
  isProcessing: boolean;
  capabilities: AudioCapabilities | null;
  performanceMetrics: AudioPerformanceMetrics | null;
  
  // Methods
  setFilter: (filter: VoiceFilterType) => Promise<void>;
  adjustIntensity: (intensity: number) => Promise<void>;
  toggleEnabled: () => Promise<void>;
  togglePreview: () => Promise<void>;
  getProcessedStream: (originalStream: MediaStream) => Promise<MediaStream>;
  removeFilter: () => MediaStream | null;
  reset: () => void;
  
  // Preview
  startPreview: (stream: MediaStream) => Promise<void>;
  stopPreview: () => void;
}

const VoiceFilterContext = createContext<VoiceFilterContextType | undefined>(undefined);

interface VoiceFilterProviderProps {
  children: ReactNode;
}

export const VoiceFilterProvider: React.FC<VoiceFilterProviderProps> = ({ children }) => {
  // State
  const [selectedFilter, setSelectedFilterState] = useState<VoiceFilterType>('none');
  const [intensity, setIntensityState] = useState<number>(0.6);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<AudioCapabilities | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<AudioPerformanceMetrics | null>(null);
  
  // Preview state
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  
  // Original stream reference
  const [originalStream, setOriginalStream] = useState<MediaStream | null>(null);

  // Initialize service ONLY when filters are actually needed (lazy init)
  const initializeService = useCallback(async () => {
    if (capabilities) return; // Already initialized
    
    try {
      const caps = await VoiceFilterService.initialize();
      setCapabilities(caps);
      
      // Set up performance monitoring callback
      VoiceFilterService.setPerformanceCallback((metrics) => {
        setPerformanceMetrics(metrics);
        
        // Auto-disable on high CPU
        if (metrics.cpuUsage > AUDIO_CONSTANTS.PERFORMANCE.CPU_DISABLE_THRESHOLD) {
          console.warn('High CPU usage detected, disabling filter');
          setIsEnabled(false);
          setSelectedFilterState('none');
        }
      });
      
      // Set up error callback
      VoiceFilterService.setErrorCallback((error) => {
        console.error('VoiceFilter error:', error);
        // Reset to safe state on error
        setIsEnabled(false);
        setSelectedFilterState('none');
        setIsProcessing(false);
      });
      
      console.log('VoiceFilterContext initialized', caps);
    } catch (error) {
      console.error('Failed to initialize voice filters:', error);
    }
  }, [capabilities]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.srcObject = null;
      }
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
      VoiceFilterService.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem('omegoo_voice_filter');
    const savedIntensity = localStorage.getItem('omegoo_voice_intensity');
    
    if (savedFilter && savedFilter !== 'none') {
      setSelectedFilterState(savedFilter as VoiceFilterType);
    }
    
    if (savedIntensity) {
      setIntensityState(parseFloat(savedIntensity));
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('omegoo_voice_filter', selectedFilter);
  }, [selectedFilter]);
  
  useEffect(() => {
    localStorage.setItem('omegoo_voice_intensity', intensity.toString());
  }, [intensity]);

  /**
   * Set voice filter
   */
  const setFilter = useCallback(async (filter: VoiceFilterType) => {
    try {
      console.log(`Setting voice filter: ${filter}`);
      
      // Initialize service on first use (lazy)
      await initializeService();
      
      setSelectedFilterState(filter);
      
      // If no stream yet, just update state
      if (!originalStream) {
        return;
      }
      
      // Apply filter to current stream
      if (filter === 'none') {
        VoiceFilterService.removeFilter();
        setIsEnabled(false);
        setIsProcessing(false);
      } else {
        setIsProcessing(true);
        await VoiceFilterService.applyFilter(originalStream, filter, intensity);
        setIsEnabled(true);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Failed to set filter:', error);
      setIsProcessing(false);
    }
  }, [originalStream, intensity, initializeService]);

  /**
   * Adjust filter intensity
   */
  const adjustIntensity = useCallback(async (newIntensity: number) => {
    try {
      const clampedIntensity = Math.max(0, Math.min(1, newIntensity));
      setIntensityState(clampedIntensity);
      
      // If filter is active, update it
      if (isEnabled && selectedFilter !== 'none' && originalStream) {
        setIsProcessing(true);
        await VoiceFilterService.updateIntensity(clampedIntensity);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Failed to adjust intensity:', error);
      setIsProcessing(false);
    }
  }, [isEnabled, selectedFilter, originalStream]);

  /**
   * Toggle filter on/off
   */
  const toggleEnabled = useCallback(async () => {
    if (isEnabled) {
      // Disable filter
      VoiceFilterService.removeFilter();
      setIsEnabled(false);
      setIsProcessing(false);
    } else {
      // Enable filter
      if (selectedFilter !== 'none' && originalStream) {
        setIsProcessing(true);
        await VoiceFilterService.applyFilter(originalStream, selectedFilter, intensity);
        setIsEnabled(true);
        setIsProcessing(false);
      }
    }
  }, [isEnabled, selectedFilter, originalStream, intensity]);

  /**
   * Get processed audio stream with current filter
   */
  const getProcessedStream = useCallback(async (stream: MediaStream): Promise<MediaStream> => {
    try {
      setOriginalStream(stream);
      
      // If no filter selected or disabled, return original
      if (selectedFilter === 'none' || !isEnabled) {
        return stream;
      }
      
      // Apply filter and return processed stream
      setIsProcessing(true);
      const processedStream = await VoiceFilterService.applyFilter(
        stream,
        selectedFilter,
        intensity
      );
      setIsProcessing(false);
      
      return processedStream;
    } catch (error) {
      console.error('Failed to get processed stream:', error);
      setIsProcessing(false);
      return stream; // Return original on error
    }
  }, [selectedFilter, isEnabled, intensity]);

  /**
   * Remove filter and return original stream
   */
  const removeFilter = useCallback(() => {
    const stream = VoiceFilterService.removeFilter();
    setIsEnabled(false);
    setIsProcessing(false);
    return stream;
  }, []);

  /**
   * Reset to default state
   */
  const reset = useCallback(() => {
    // Stop preview inline to avoid dependency
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.srcObject = null;
    }
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }
    setIsPreviewMode(false);
    
    removeFilter();
    setSelectedFilterState('none');
    setIntensityState(0.6);
    setIsEnabled(false);
    setOriginalStream(null);
  }, [removeFilter, previewAudio, previewStream]);

  /**
   * Start preview mode (play filtered audio locally)
   */
  const startPreview = useCallback(async (stream: MediaStream) => {
    try {
      // Stop any existing preview inline
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.srcObject = null;
      }
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
      
      if (selectedFilter === 'none') {
        console.log('No filter selected for preview');
        return;
      }
      
      console.log(`Starting preview with ${selectedFilter} filter`);
      setIsPreviewMode(true);
      
      // Apply filter to stream
      const processedStream = await VoiceFilterService.applyFilter(
        stream,
        selectedFilter,
        intensity
      );
      
      setPreviewStream(processedStream);
      
      // Create audio element to play preview
      const audio = new Audio();
      audio.srcObject = processedStream;
      audio.volume = 0.8;
      
      // Play preview
      await audio.play();
      setPreviewAudio(audio);
      
      console.log('Preview started');
    } catch (error) {
      console.error('Failed to start preview:', error);
      setIsPreviewMode(false);
    }
  }, [selectedFilter, intensity, previewAudio, previewStream]);

  /**
   * Stop preview mode
   */
  const stopPreview = useCallback(() => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.srcObject = null;
      setPreviewAudio(null);
    }
    
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
    
    setIsPreviewMode(false);
    console.log('Preview stopped');
  }, [previewAudio, previewStream]);

  /**
   * Toggle preview on/off
   */
  const togglePreview = useCallback(async () => {
    if (isPreviewMode) {
      stopPreview();
    } else {
      // Request microphone for preview
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: AUDIO_CONSTANTS.QUALITY.ECHO_CANCELLATION,
            noiseSuppression: AUDIO_CONSTANTS.QUALITY.NOISE_SUPPRESSION,
            autoGainControl: AUDIO_CONSTANTS.QUALITY.AUTO_GAIN_CONTROL,
          },
        });
        await startPreview(stream);
      } catch (error) {
        console.error('Failed to get microphone for preview:', error);
      }
    }
  }, [isPreviewMode, startPreview, stopPreview]);

  const value: VoiceFilterContextType = {
    selectedFilter,
    intensity,
    isEnabled,
    isPreviewMode,
    isProcessing,
    capabilities,
    performanceMetrics,
    setFilter,
    adjustIntensity,
    toggleEnabled,
    togglePreview,
    getProcessedStream,
    removeFilter,
    reset,
    startPreview,
    stopPreview,
  };

  return (
    <VoiceFilterContext.Provider value={value}>
      {children}
    </VoiceFilterContext.Provider>
  );
};

// Hook to use voice filter context
export const useVoiceFilter = (): VoiceFilterContextType => {
  const context = useContext(VoiceFilterContext);
  if (!context) {
    throw new Error('useVoiceFilter must be used within VoiceFilterProvider');
  }
  return context;
};

export default VoiceFilterContext;
